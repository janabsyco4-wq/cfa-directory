// Kept free of mongoose so client components can import it.
export const MEMBER_STATUSES = ["Active", "Expired", "Inactive", "Pending"] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];
