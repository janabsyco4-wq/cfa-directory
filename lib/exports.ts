// Data behind the admin Exports page: the members sheet and the picture list share one
// order. Pictures are named by membership number. Server-only.

import { connectDB } from "@/lib/mongodb";
import Member from "@/models/Member";
import { adminMemberQuery } from "@/lib/members";
import { districtOptions, districtsLabel, requestedDistricts, tidyDistrict } from "@/lib/districts";
import { effectiveStatus } from "@/lib/verification";
import { buildXlsx } from "@/lib/xlsx";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = any;

const clean = (v: unknown) => {
  const s = String(v ?? "").replace(/\s+/g, " ").trim();
  return /^(n\/?a|nil+|none|-+)$/i.test(s) ? "" : s;
};

function day(d?: Date | string | null) {
  const v = d ? new Date(d) : null;
  if (!v || Number.isNaN(v.getTime())) return "";
  return `${String(v.getUTCDate()).padStart(2, "0")}/${String(v.getUTCMonth() + 1).padStart(2, "0")}/${v.getUTCFullYear()}`;
}

/** The number at the end of a membership no.; ones without a number go last. */
function serial(no: string) {
  const digits = String(no ?? "").match(/(\d+)\s*$/)?.[1];
  return digits ? Number(digits) : Number.MAX_SAFE_INTEGER;
}

function inOrder(members: Doc[]) {
  return [...members].sort((a, b) => serial(a.membershipNo) - serial(b.membershipNo) || String(a.membershipNo).localeCompare(String(b.membershipNo)));
}

const fullName = (m: Doc) => clean(`${m.firstName ?? ""} ${m.lastName ?? ""}`);

const COLUMNS: { header: string; value: (m: Doc) => string | number }[] = [
  { header: "Membership No", value: (m) => clean(m.membershipNo) },
  { header: "Name", value: fullName },
  { header: "Father's Name", value: (m) => clean(m.fatherName) },
  { header: "Category", value: (m) => clean(m.membershipCategory) },
  { header: "Designation", value: (m) => clean(m.designation) },
  { header: "Chapter / Department", value: (m) => clean(m.department) },
  { header: "District", value: (m) => tidyDistrict(String(m.district ?? "")) },
  { header: "CNIC", value: (m) => clean(m.cnic) },
  { header: "Mobile", value: (m) => clean(m.phone) },
  { header: "WhatsApp", value: (m) => clean(m.whatsapp) },
  { header: "Email", value: (m) => clean(m.email) },
  { header: "NTN", value: (m) => clean(m.ntn) },
  { header: "Address", value: (m) => clean(m.address) },
  { header: "Business / Organization", value: (m) => clean(m.businessName) },
  { header: "Nature of Business", value: (m) => clean(m.businessType) },
  { header: "Fee (Rs.)", value: (m) => (m.fee > 0 ? m.fee : "") },
  { header: "Status", value: (m) => effectiveStatus(m.status, m.expiryDate) },
  { header: "Date of Joining", value: (m) => day(m.joinedDate) },
  { header: "Valid Until", value: (m) => day(m.expiryDate) },
];

/** One clean sheet in member-number order: Sr. No. first, no links, and no column left entirely empty. */
export async function buildMembersSheet(params: URLSearchParams) {
  await connectDB();
  const members = inOrder(await Member.find(adminMemberQuery(params)).lean());

  const used = COLUMNS.filter((c) => members.some((m) => c.value(m) !== ""));
  const rows = members.map((m, i) => [i + 1, ...used.map((c) => c.value(m))]);
  const headers = ["Sr. No.", ...used.map((c) => c.header)];
  const columns = headers.map((header, ci) => ({
    header,
    width: Math.min(60, Math.max(header.length, ...rows.map((r) => String(r[ci]).length)) + 3),
  }));

  const districts = requestedDistricts(params);
  const others = ["search", "category", "status"].some((k) => params.get(k));
  const label = others ? "Filtered" : districtsLabel(districts);
  const sheetName = label === "All" ? "All Members" : !others && districts.length > 1 ? "Selected Districts" : label;
  const date = new Date().toISOString().slice(0, 10);
  return {
    file: buildXlsx(sheetName, columns, rows),
    filename: `CFA-Members-${label.replace(/[^A-Za-z0-9]+/g, "-")}-${date}.xlsx`,
  };
}

/** Totals for the Exports page, per district. */
export async function getExportSummary() {
  await connectDB();
  const members: Doc[] = await Member.find().select("district photo").lean();
  const count = (list: Doc[]) => ({ members: list.length, pictures: list.filter((m) => m.photo).length });
  return {
    ...count(members),
    districts: districtOptions(members.map((m) => m.district)).map((name) => ({
      name,
      ...count(members.filter((m) => tidyDistrict(String(m.district ?? "")) === name)),
    })),
  };
}

const safeFileName = (s: string) => s.replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, " ").trim().slice(0, 110);

/**
 * What the browser needs to build the pictures ZIP. All pictures together are far over the
 * hosting response limit, so the browser fetches each one itself.
 */
export async function getPictureList(params: URLSearchParams) {
  await connectDB();
  const districts = requestedDistricts(params);
  const filter = new URLSearchParams(districts.map((district) => ["district", district]));
  const members = inOrder(await Member.find(adminMemberQuery(filter)).select("membershipNo firstName lastName photo").lean());
  const files: { name: string; url: string }[] = [];
  const withoutPicture: string[] = [];

  members.forEach((m) => {
    const base = safeFileName(clean(m.membershipNo));
    const photo = String(m.photo ?? "");
    if (photo.startsWith("https://res.cloudinary.com/")) files.push({ name: `${base}.jpg`, url: photo.replace("/upload/", "/upload/f_jpg,q_95/") });
    else if (photo.startsWith("/")) files.push({ name: `${base}.${photo.match(/\.(\w+)$/)?.[1]?.toLowerCase() ?? "jpg"}`, url: encodeURI(photo) });
    else withoutPicture.push(`${base} - ${fullName(m)}`);
  });
  const date = new Date().toISOString().slice(0, 10);
  return { files, withoutPicture, zipName: `CFA-Pictures-${districtsLabel(districts).replace(/[^A-Za-z0-9]+/g, "-")}-${date}.zip` };
}
