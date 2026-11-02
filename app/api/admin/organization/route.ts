import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Organization from "@/models/Organization";
import { requireAdmin } from "@/lib/admin";
import {
  ORG_RULE_FIELDS, ORG_TEXT_FIELDS, revalidateOrganizationPages, toOrgSettings,
} from "@/lib/organization";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await connectDB();
    return NextResponse.json({ settings: toOrgSettings(await Organization.findOne().lean()) });
  } catch {
    return NextResponse.json({ error: "Unable to load organization settings." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const update: Record<string, string | boolean> = {};
    for (const k of ORG_TEXT_FIELDS) if (typeof body[k] === "string") update[k] = body[k].trim();
    for (const k of ORG_RULE_FIELDS) if (typeof body[k] === "boolean") update[k] = body[k];

    for (const k of ["brandPrimary", "brandAccent"] as const) {
      if (update[k] && !/^#[0-9a-f]{6}$/i.test(String(update[k]))) {
        return NextResponse.json({ error: "Brand colors must be hex values like #1f7a3a." }, { status: 400 });
      }
    }
    if (update.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(update.email))) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    await connectDB();
    const doc = await Organization.findOneAndUpdate({}, { $set: update }, { upsert: true, new: true }).lean();
    revalidateOrganizationPages();
    return NextResponse.json({ settings: toOrgSettings(doc) });
  } catch {
    return NextResponse.json({ error: "Unable to save settings." }, { status: 500 });
  }
}
