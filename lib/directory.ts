import type { MembershipCategory } from "@/models/Member";
import type { PhotoFrame } from "@/lib/photoFrame";

export const CATEGORIES: MembershipCategory[] = [
  "Corporate", "Executive", "Associate", "Overseas", "Women", "Student", "Honorary Member",
];

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest members" },
  { value: "oldest", label: "Longest-standing" },
  { value: "name",   label: "Name (A–Z)" },
] as const;
export type SortKey = (typeof SORT_OPTIONS)[number]["value"];

export const PAGE_SIZE = 24;

export interface PublicMember {
  _id: string;
  membershipNo: string;
  firstName: string;
  lastName: string;
  membershipCategory: MembershipCategory;
  photo?: string;
  photoFrame?: PhotoFrame;
  businessName?: string;
  district?: string;
}

export interface PublicProfile extends PublicMember {
  businessType?: string;
  joinedDate?: string;
}

export interface DirectoryPage {
  members: PublicMember[];
  total: number;
  page: number;
  totalPages: number;
  districts: string[];
}
