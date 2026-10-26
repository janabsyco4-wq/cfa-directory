import { isValidObjectId } from "mongoose";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import Member from "@/models/Member";
import { PAGE_SIZE, type DirectoryPage, type PublicMember, type PublicProfile, type SortKey } from "@/lib/directory";
import { normalizeFrame } from "@/lib/photoFrame";

export const PUBLIC_LIST_FIELDS = "membershipNo firstName lastName membershipCategory photo photoFrame businessName district";
const PUBLIC_PROFILE_FIELDS = `${PUBLIC_LIST_FIELDS} businessType joinedDate`;

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

export function revalidateMemberPages(id: string) {
  revalidatePath("/");
  revalidatePath("/members");
  revalidatePath(`/members/${id}`);
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

export async function getFeaturedMembers(limit = 6) {
  await connectDB();
  const docs = await Member.find({ status: "Active" })
    .select(PUBLIC_LIST_FIELDS)
    .sort({ joinedDate: -1, _id: -1 })
    .limit(limit)
    .lean();
  return docs.map(toPublic);
}
