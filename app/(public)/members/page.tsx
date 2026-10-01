import { connectDB } from "@/lib/mongodb";
import Member from "@/models/Member";
import MembersClient, { type InitialData } from "./MembersClient";

// ISR: the default directory view is prerendered and cached at the edge,
// refreshed every 2 minutes. Search/filter/pagination still hit /api/members.
export const revalidate = 120;

async function getInitialData(): Promise<InitialData | null> {
  try {
    await connectDB();
    const query = { status: "Active" as const };
    const limit = 20;

    const [total, members, districts] = await Promise.all([
      Member.countDocuments(query),
      Member.find(query)
        .select("membershipNo firstName lastName membershipCategory photo businessName district")
        .sort({ joinedDate: -1 })
        .limit(limit)
        .lean(),
      Member.distinct("district", { status: "Active", district: { $nin: [null, ""] } }),
    ]);

    districts.sort();

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      members: members.map((m: any) => ({
        _id: String(m._id),
        membershipNo: m.membershipNo,
        firstName: m.firstName,
        lastName: m.lastName,
        membershipCategory: m.membershipCategory,
        photo: m.photo || undefined,
        businessName: m.businessName || undefined,
        district: m.district || undefined,
      })),
      total,
      page: 1,
      totalPages: Math.ceil(total / limit),
      districts,
    };
  } catch {
    return null;
  }
}

export default async function MembersPage() {
  const initialData = await getInitialData();
  return <MembersClient initialData={initialData} />;
}
