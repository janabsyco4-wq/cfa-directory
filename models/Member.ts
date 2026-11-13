import mongoose, { Schema, Document, Model } from "mongoose";
import { MEMBER_STATUSES, type MemberStatus } from "@/lib/memberStatus";

export { MEMBER_STATUSES, type MemberStatus };

export type MembershipCategory =
  | "Corporate"
  | "Executive"
  | "Associate"
  | "Overseas"
  | "Women"
  | "Student"
  | "Honorary Member";

export interface IMember extends Document {
  membershipNo: string;
  firstName: string;
  lastName: string;
  fatherName: string;
  designation: string;
  department: string;
  cnic: string;
  phone: string;
  whatsapp: string;
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
  expiryDate?: Date;
  photo: string;
  photoFrame?: { x: number; y: number; zoom: number };
  cardFront: string;
  cardBack: string;
  verifyToken?: string;
  notifications?: IMemberNotification[];
}

/** An appointment notified by the Chamber; shown on the member's verification page. */
export interface IMemberNotification {
  _id: mongoose.Types.ObjectId;
  number: string;
  honorific: string;
  relation: "S/O" | "D/O" | "W/O";
  relativeName: string;
  post: string;
  unit: string;
  from: Date;
  to: Date;
  issuedAt: Date;
}

const NotificationSchema = new Schema<IMemberNotification>({
  number: { type: String, required: true },
  honorific: { type: String, default: "" },
  relation: { type: String, enum: ["S/O", "D/O", "W/O"], default: "S/O" },
  relativeName: { type: String, default: "" },
  post: { type: String, required: true },
  unit: { type: String, default: "" },
  from: { type: Date, required: true },
  to: { type: Date, required: true },
  issuedAt: { type: Date, default: Date.now },
});

const MemberSchema = new Schema<IMember>(
  {
    membershipNo: { type: String, required: true, unique: true, index: true },
    firstName: { type: String, required: true },
    // Optional: some members are known by a single name.
    lastName: { type: String, default: "" },
    fatherName: { type: String, default: "" },
    designation: { type: String, default: "" },
    department: { type: String, default: "" },
    cnic: { type: String, default: "" },
    phone: { type: String, default: "" },
    whatsapp: { type: String, default: "" },
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
      enum: [...MEMBER_STATUSES],
      default: "Active",
    },
    joinedDate: { type: Date, default: Date.now },
    expiryDate: { type: Date, default: undefined },
    photo: { type: String, default: "" },
    photoFrame: {
      type: new Schema(
        {
          x: { type: Number, min: 0, max: 100 },
          y: { type: Number, min: 0, max: 100 },
          zoom: { type: Number, min: 1, max: 2.5 },
        },
        { _id: false }
      ),
      default: undefined,
    },
    // Membership cards are designed outside this app and uploaded as finished images.
    cardFront: { type: String, default: "" },
    cardBack: { type: String, default: "" },
    // Token from cards printed by the previous portal (members.cfapak.org/verify/<token>), kept so those QR codes still work.
    verifyToken: { type: String, default: undefined, index: { sparse: true } },
    notifications: { type: [NotificationSchema], default: undefined },
  },
  { timestamps: true }
);

// CNIC is optional, so uniqueness applies only to members who have one.
MemberSchema.index(
  { cnic: 1 },
  { unique: true, name: "cnic_unique_when_set", partialFilterExpression: { cnic: { $type: "string", $gt: "" } } }
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
