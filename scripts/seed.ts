/**
 * Seed script — populates the database with sample CFA members.
 * Run with:  npx tsx scripts/seed.ts
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI as string;
if (!MONGODB_URI) throw new Error("MONGODB_URI not set in .env.local");

// ── inline schema (avoids transpile issues when running directly) ─────────────
const MemberSchema = new mongoose.Schema({
  membershipNo:        { type: String, required: true, unique: true },
  firstName:           { type: String, required: true },
  lastName:            { type: String, required: true },
  fatherName:          { type: String, default: "" },
  cnic:                { type: String, required: true, unique: true },
  phone:               { type: String, default: "" },
  email:               { type: String, default: "" },
  ntn:                 { type: String, default: "" },
  address:             { type: String, default: "" },
  district:            { type: String, default: "" },
  businessName:        { type: String, default: "" },
  businessType:        { type: String, default: "" },
  membershipCategory:  { type: String, required: true },
  fee:                 { type: Number, default: 0 },
  status:              { type: String, default: "Active" },
  joinedDate:          { type: Date,   default: Date.now },
  photo:               { type: String, default: "" },
});

const Member =
  mongoose.models.Member ?? mongoose.model("Member", MemberSchema);

// ── seed data ─────────────────────────────────────────────────────────────────
const members = [
  {
    membershipNo: "M No.821",
    firstName: "Imtiaz",
    lastName: "Raza",
    fatherName: "Qalandar Bux Bhanbhro",
    cnic: "42205-1587267-7",
    phone: "0301-3513283",
    email: "",
    ntn: "",
    address: "Sarai Muhammad Bux Kot Diji District Khairpur",
    district: "Khairpur",
    businessName: "",
    businessType: "",
    membershipCategory: "Executive",
    fee: 5000,
    status: "Active",
    joinedDate: new Date("2024-01-01"),
    photo: "https://i.pravatar.cc/300?img=11",
  },
  {
    membershipNo: "M No.831",
    firstName: "Feroz",
    lastName: "Gul",
    fatherName: "Gulzar Ali",
    cnic: "42201-1276563-3",
    phone: "0307-5165715",
    email: "",
    ntn: "",
    address: "Kot Pir Bux Metlo Post Office Karlu Mori Shah Ladhat Tehsil & District Khairpur",
    district: "Khairpur",
    businessName: "",
    businessType: "",
    membershipCategory: "Executive",
    fee: 5000,
    status: "Active",
    joinedDate: new Date("2024-01-01"),
    photo: "https://i.pravatar.cc/300?img=12",
  },
  {
    membershipNo: "M No.832",
    firstName: "Abdul",
    lastName: "Ghafar",
    fatherName: "Rahim Bux",
    cnic: "42209-8087184-1",
    phone: "0325-9260227",
    email: "",
    ntn: "",
    address: "Kot Khuda Bux Bhanbhro soho Tehsil Kot Diji, District Khairpur",
    district: "Khairpur",
    businessName: "",
    businessType: "Advocate, General Secretary Kot Diji",
    membershipCategory: "Executive",
    fee: 5000,
    status: "Active",
    joinedDate: new Date("2024-01-01"),
    photo: "https://i.pravatar.cc/300?img=13",
  },
  {
    membershipNo: "M No.833",
    firstName: "Badar",
    lastName: "Hussain",
    fatherName: "Muhammad Saflar Tunio",
    cnic: "45208-9576753-9",
    phone: "0332-2743529",
    email: "",
    ntn: "",
    address: "Goth Ali Mardan Tunio, p/o Hangorja, Peer Meshaikh, Tehsil Sohbo Dero, District Khairpur",
    district: "Khairpur",
    businessName: "",
    businessType: "",
    membershipCategory: "Executive",
    fee: 5000,
    status: "Active",
    joinedDate: new Date("2024-01-01"),
    photo: "https://i.pravatar.cc/300?img=14",
  },
  {
    membershipNo: "M No.834",
    firstName: "Muhammad",
    lastName: "Hayat",
    fatherName: "Muhammad Yousaf Tanwari",
    cnic: "45302-8306730-3",
    phone: "0334-2427022",
    email: "",
    ntn: "",
    address: "Near Higher Secondary School National Hiway, Mohallah Tanwari Hango Taraf Kili Sobodero District Khairpur",
    district: "Khairpur",
    businessName: "",
    businessType: "",
    membershipCategory: "Executive",
    fee: 5000,
    status: "Active",
    joinedDate: new Date("2024-01-01"),
    photo: "https://i.pravatar.cc/300?img=15",
  },
  {
    membershipNo: "M No.848",
    firstName: "Wali",
    lastName: "Muhammad Bhutto",
    fatherName: "Muhammad Bhutto",
    cnic: "45208-3977675-9",
    phone: "0300-3125240",
    email: "",
    ntn: "",
    address: "Goth Raseman, Hangorja, Tehsil Sohbo dero District Khairpur",
    district: "Khairpur",
    businessName: "",
    businessType: "Chairman Sukkur Division",
    membershipCategory: "Executive",
    fee: 5000,
    status: "Active",
    joinedDate: new Date("2024-01-01"),
    photo: "https://i.pravatar.cc/300?img=16",
  },
  {
    membershipNo: "M No.860",
    firstName: "Muhammad",
    lastName: "Sheeikh Lasbari",
    fatherName: "Muhammad Lasheri Lasbari",
    cnic: "42201-9777571-9",
    phone: "0300-2144948",
    email: "",
    ntn: "",
    address: "Goth Lasheri Post Office Rasool Abad Peer Umar Shah Tehsil Sobodero District Khairpur",
    district: "Khairpur",
    businessName: "",
    businessType: "",
    membershipCategory: "Executive",
    fee: 5000,
    status: "Active",
    joinedDate: new Date("2024-01-01"),
    photo: "https://i.pravatar.cc/300?img=17",
  },
  {
    membershipNo: "M No.883",
    firstName: "Muhammad",
    lastName: "Zaffar",
    fatherName: "Muhbat Khan",
    cnic: "45206-2420591-7",
    phone: "0306-1232449",
    email: "",
    ntn: "",
    address: "Tando Mir Ali Village Soomharsam Taluka Thari Mir Wah District Khairpur",
    district: "Khairpur",
    businessName: "",
    businessType: "Vice Chairman Sukkur Division",
    membershipCategory: "Executive",
    fee: 5000,
    status: "Active",
    joinedDate: new Date("2024-01-01"),
    photo: "https://i.pravatar.cc/300?img=18",
  },
  {
    membershipNo: "M No.884",
    firstName: "Ghulam",
    lastName: "Ali Tanweri",
    fatherName: "",
    cnic: "45208-2183676-5",
    phone: "0325-3441342",
    email: "",
    ntn: "",
    address: "Sobhodero Khairpur",
    district: "Khairpur",
    businessName: "",
    businessType: "",
    membershipCategory: "Student",
    fee: 0,
    status: "Active",
    joinedDate: new Date("2024-01-01"),
    photo: "https://i.pravatar.cc/300?img=19",
  },
  {
    membershipNo: "M No.917",
    firstName: "Salman",
    lastName: "Dohri",
    fatherName: "Kareem Bux",
    cnic: "",
    phone: "0304-2834418",
    email: "",
    ntn: "",
    address: "Govt. High School Bachil Illanbhro District Khairpur",
    district: "Khairpur",
    businessName: "",
    businessType: "",
    membershipCategory: "Student",
    fee: 0,
    status: "Active",
    joinedDate: new Date("2024-01-01"),
    photo: "https://i.pravatar.cc/300?img=20",
  },
  {
    membershipNo: "M No.874",
    firstName: "Dr. Ghulam Sarwar",
    lastName: "Markhand",
    fatherName: "Hafiz Abdul Rahman Markhand",
    cnic: "42203-0426908-9",
    phone: "0333-7594897 & 0324-0241011",
    email: "",
    ntn: "",
    address: "Bungalow # C-5, Mumtaz Colony, Khairpur (Mirs), Sindh",
    district: "Khairpur",
    businessName: "",
    businessType: "Honorary Member",
    membershipCategory: "Honorary Member",
    fee: 0,
    status: "Active",
    joinedDate: new Date("2024-01-01"),
    photo: "https://i.pravatar.cc/300?img=21",
  },
];

async function seed() {
  console.log("🌱  Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("✅  Connected.");

  console.log("🗑️   Clearing existing members...");
  await Member.deleteMany({});

  console.log("📥  Inserting seed data...");
  await Member.insertMany(members);

  console.log(`✅  Seeded ${members.length} members successfully.`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err);
  process.exit(1);
});
