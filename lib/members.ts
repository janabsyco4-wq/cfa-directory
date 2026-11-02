import { isValidObjectId } from "mongoose";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import Member from "@/models/Member";
import { PAGE_SIZE, type DirectoryPage, type PublicMember, type PublicProfile, type SortKey } from "@/lib/directory";
import { normalizeFrame } from "@/lib/photoFrame";

export const PUBLIC_LIST_FIELDS = "membershipNo firstName lastName membershipCategory photo photoFrame businessName district";
const PUBLIC_PROFILE_FIELDS = `${PUBLIC_LIST_FIELDS} businessType joinedDate designation department`;

// _id tiebreak keeps paging stable and follows insertion order when joinedDate ties (bulk imports)
const SORTS: Record<SortKey, Record<string, 1 | -1>> = {
  newest: { joinedDate: -1, _id: -1 },
  oldest: { joinedDate: 1, _id: 1 },
  name:   { firstName: 1, lastName: 1, _id: 1 },
};

export interface MemberQuery {
  search?: string;
  category?: string;
  district?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPublic(m: any): PublicMember {
  return {
    _id: String(m._id),
    membershipNo: m.membershipNo,
    firstName: m.firstName,
    lastName: m.lastName,
    membershipCategory: m.membershipCategory,
    photo: m.photo || undefined,
    photoFrame: m.photo && m.photoFrame ? normalizeFrame(m.photoFrame) : undefined,
    businessName: m.businessName || undefined,
    district: m.district || undefined,
  };
}

/** Admin list/export filter from ?search=&category=&status=&card= (shared so exports match the list). */
export function adminMemberQuery(params: URLSearchParams) {
  const search   = (params.get("search") ?? "").trim().slice(0, 100);
  const category = params.get("category") ?? "";
  const status   = params.get("status") ?? "";
  const card     = params.get("card") ?? "";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = {};
  if (category && category !== "All") query.membershipCategory = category;
  if (status   && status   !== "All") query.status = status;
  if (search) {
    const rx = { $regex: escapeRegex(search), $options: "i" };
    query.$or = [
      { firstName:    rx },
      { lastName:     rx },
      { membershipNo: rx },
      { businessName: rx },
      { cnic:         rx },
    ];
  }
  // Card filter: both sides uploaded, or at least one side missing.
  const blank = { $in: ["", null] };
  if (card === "uploaded") query.$and = [{ cardFront: { $nin: ["", null] } }, { cardBack: { $nin: ["", null] } }];
  if (card === "missing")  query.$and = [{ $or: [{ cardFront: blank }, { cardBack: blank }] }];
  return query;
}

/** Turns a failed member save into a message an admin can act on. */
export function memberSaveError(err: unknown): { error: string; status: number } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = err as any;
  if (e?.code === 11000) {
    const field = Object.keys(e.keyPattern ?? e.keyValue ?? {})[0];
    if (field === "cnic") {
      return e.keyValue?.cnic
        ? { error: "Another member already has this CNIC.", status: 409 }
        : { error: "Another member is already saved without a CNIC. Enter this member's CNIC to save.", status: 409 };
    }
    return { error: "Another member already has this Membership No.", status: 409 };
  }
  if (e?.name === "ValidationError") return { error: "Some fields are invalid. Check the form and try again.", status: 400 };
  return { error: "Server error", status: 500 };
}

export function revalidateMemberPages(id: string) {
  revalidatePath("/");
  revalidatePath("/members");
  revalidatePath(`/members/${id}`);
  revalidatePath(`/verify/${id}`);
  revalidatePath("/api/stats");
}

export async function getDistricts(): Promise<string[]> {
  await connectDB();
  const value = (await Member.distinct("district", { status: "Active", district: { $nin: [null, ""] } })) as string[];
  value.sort((a, b) => a.localeCompare(b));
  return value;
}

export async function queryMembers(q: MemberQuery): Promise<DirectoryPage> {
  await connectDB();
  const page  = Math.max(1, q.page || 1);
  const limit = Math.min(48, Math.max(1, q.limit || PAGE_SIZE));
  const sortKey: SortKey = q.sort && Object.hasOwn(SORTS, q.sort) ? (q.sort as SortKey) : "newest";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: any = { status: "Active" };
  if (q.category && q.category !== "All") filter.membershipCategory = q.category;
  if (q.district) filter.district = q.district;
  const search = q.search?.trim().slice(0, 100);
  if (search) {
    const rx = { $regex: escapeRegex(search), $options: "i" };
    filter.$or = [{ firstName: rx }, { lastName: rx }, { businessName: rx }];
  }

  const [total, docs, districts] = await Promise.all([
    Member.countDocuments(filter),
    Member.find(filter)
      .select(PUBLIC_LIST_FIELDS)
      .sort(SORTS[sortKey])
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    getDistricts(),
  ]);

  return {
    members: docs.map(toPublic),
    total,
    page,
    totalPages: Math.ceil(total / limit),
    districts,
  };
}

export async function getPublicProfile(id: string): Promise<PublicProfile | null> {
  if (!isValidObjectId(id)) return null;
  await connectDB();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const m: any = await Member.findOne({ _id: id, status: "Active" }).select(PUBLIC_PROFILE_FIELDS).lean();
  if (!m) return null;
  return {
    ...toPublic(m),
    businessType: m.businessType || undefined,
    designation: m.designation || undefined,
    department: m.department || undefined,
    joinedDate: m.joinedDate ? new Date(m.joinedDate).toISOString() : undefined,
  };
}

export async function getDirectoryStats() {
  await connectDB();
  const active = { status: "Active" as const };
  const [members, districts, organizations, categories] = await Promise.all([
    Member.countDocuments(active),
    Member.distinct("district", { ...active, district: { $nin: [null, ""] } }),
    Member.distinct("businessName", { ...active, businessName: { $nin: [null, ""] } }),
    Member.distinct("membershipCategory", active),
  ]);
  return {
    members,
    districts: districts.length,
    organizations: organizations.length,
    categories: categories.length,
  };
}

/** Active members per district, largest first. */
export async function getDistrictCounts(limit = 8): Promise<{ district: string; count: number }[]> {
  await connectDB();
  const rows = await Member.aggregate<{ _id: string; count: number }>([
    { $match: { status: "Active", district: { $nin: [null, ""] } } },
    { $group: { _id: "$district", count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
    { $limit: limit },
  ]);
  return rows.map((r) => ({ district: r._id, count: r.count }));
}

export async function getFeaturedMembers(limit = 6) {
  await connectDB();
  const docs = await Member.find({ status: "Active" })
    .select(PUBLIC_LIST_FIELDS)
    .sort({ joinedDate: -1, _id: -1 })
    .limit(limit)
    .lean();
  return docs.map(toPublic);
}
