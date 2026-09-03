import mongoose, { Schema, Document, Model } from "mongoose";

export type MembershipCategory =
  | "Corporate"
  | "Executive"
  | "Associate"
  | "Overseas"
  | "Women"
  | "Student"
  | "Honorary Member";

export type MemberStatus = "Active" | "Inactive" | "Pending";

export interface IMember extends Document {
  membershipNo: string;
  firstName: string;
  lastName: string;
  fatherName: string;
  cnic: string;
  phone: string;
  email: string;
  ntn: string;
  address: string;
  district: string;
  businessName: string;
  businessType: string;
  membershipCategory: MembershipCategory;
  fee: number;
  status: MemberStatus;
  joinedDate: Date;
  photo: string;
}

const MemberSchema = new Schema<IMember>(
  {
    membershipNo: { type: String, required: true, unique: true, index: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    fatherName: { type: String, default: "" },
    cnic: { type: String, required: true, unique: true, index: true },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    ntn: { type: String, default: "" },
    address: { type: String, default: "" },
    district: { type: String, default: "" },
    businessName: { type: String, default: "" },
    businessType: { type: String, default: "" },
    membershipCategory: {
      type: String,
      enum: ["Corporate", "Executive", "Associate", "Overseas", "Women", "Student", "Honorary Member"],
      required: true,
    },
    fee: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Pending"],
      default: "Active",
    },
    joinedDate: { type: Date, default: Date.now },
    photo: { type: String, default: "" },
  },
  { timestamps: true }
);

// Text search index for name/business search
MemberSchema.index({ firstName: "text", lastName: "text", businessName: "text" });

// Compound indexes for common queries
MemberSchema.index({ status: 1, joinedDate: -1 });
MemberSchema.index({ status: 1, membershipCategory: 1, joinedDate: -1 });
MemberSchema.index({ status: 1, district: 1, joinedDate: -1 });
MemberSchema.index({ status: 1, membershipCategory: 1, district: 1, joinedDate: -1 });

const Member: Model<IMember> =
  mongoose.models.Member ?? mongoose.model<IMember>("Member", MemberSchema);

export default Member;
