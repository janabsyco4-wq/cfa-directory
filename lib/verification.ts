import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { normalizeFrame } from "@/lib/photoFrame";
import Member from "@/models/Member";
import type { VerificationRecord } from "@/components/VerificationResult";

const VERIFY_FIELDS =
  "membershipNo firstName lastName photo photoFrame membershipCategory designation businessName department district joinedDate expiryDate status cardFront cardBack";

export type VerifyBy = "card" | "cnic";

/** A lapsed expiry date outranks a stale "Active" flag. */
export function effectiveStatus(status: string, expiryDate?: Date | string | null): VerificationRecord["status"] {
  const expiry = expiryDate ? new Date(expiryDate) : undefined;
  if (status === "Active" && expiry && expiry.getTime() < Date.now()) return "Expired";
  return (status ?? "Inactive") as VerificationRecord["status"];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toRecord(m: any): VerificationRecord {
  const expiry = m.expiryDate ? new Date(m.expiryDate) : undefined;
  const status = effectiveStatus(m.status, expiry);
  return {
    id: String(m._id),
    membershipNo: m.membershipNo,
    name: `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim(),
    photo: m.photo || undefined,
    photoFrame: m.photo && m.photoFrame ? normalizeFrame(m.photoFrame) : undefined,
    category: m.membershipCategory,
    designation: m.designation || undefined,
    organization: m.businessName && m.businessName !== "N/A" ? m.businessName : undefined,
    department: m.department || undefined,
    district: m.district || undefined,
    joinedDate: m.joinedDate ? new Date(m.joinedDate).toISOString() : undefined,
    expiryDate: expiry?.toISOString(),
    status,
    // Only whether a card exists; the image URLs stay server-side and are served via /api/cards.
    card: { front: !!m.cardFront, back: !!m.cardBack },
  };
}

/** Card numbers match whatever spacing, dashes or case the visitor types. */
export function cardNumberQuery(value: string) {
  const chars = value.replace(/[^a-z0-9]/gi, "");
  if (chars.length < 3) return null;
  return { membershipNo: { $regex: `^[^a-z0-9]*${chars.split("").join("[^a-z0-9]*")}[^a-z0-9]*$`, $options: "i" } };
}

function cnicQuery(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 13) return null;
  const formatted = `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
  return { cnic: { $in: [formatted, digits] } };
}

export async function findForVerification(by: VerifyBy, value: string): Promise<VerificationRecord | null | undefined> {
  const query = by === "cnic" ? cnicQuery(value) : cardNumberQuery(value);
  if (!query) return undefined; // malformed input
  await connectDB();
  const m = await Member.findOne(query).select(VERIFY_FIELDS).lean();
  return m ? toRecord(m) : null;
}

/** Accepts our member id or a token from a card printed by the previous portal. */
export async function getVerificationById(id: string): Promise<VerificationRecord | null> {
  const query = isValidObjectId(id) ? { _id: id } : /^[A-Za-z0-9_-]{8,128}$/.test(id) ? { verifyToken: id } : null;
  if (!query) return null;
  await connectDB();
  const m = await Member.findOne(query).select(VERIFY_FIELDS).lean();
  return m ? toRecord(m) : null;
}
