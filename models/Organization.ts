import mongoose, { Schema, Document, Model } from "mongoose";

// Single-document collection holding the chamber's identity and member-form rules.
export interface IOrganization extends Document {
  organizationName: string;
  address: string;
  telephone: string;
  email: string;
  website: string;
  presidentTitle: string;
  presidentDesignation: string;
  brandPrimary: string;
  brandAccent: string;
  logo: string;
  signature: string;
  requireCnic: boolean;
  requireMobile: boolean;
  requireWhatsapp: boolean;
  requireAddress: boolean;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    organizationName: { type: String, default: "" },
    address: { type: String, default: "" },
    telephone: { type: String, default: "" },
    email: { type: String, default: "" },
    website: { type: String, default: "" },
    presidentTitle: { type: String, default: "" },
    presidentDesignation: { type: String, default: "" },
    brandPrimary: { type: String, default: "" },
    brandAccent: { type: String, default: "" },
    logo: { type: String, default: "" },
    signature: { type: String, default: "" },
    requireCnic: { type: Boolean, default: true },
    requireMobile: { type: Boolean, default: true },
    requireWhatsapp: { type: Boolean, default: false },
    requireAddress: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Organization: Model<IOrganization> =
  mongoose.models.Organization ?? mongoose.model<IOrganization>("Organization", OrganizationSchema);

export default Organization;
