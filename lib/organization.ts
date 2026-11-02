import { cache } from "react";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import Organization from "@/models/Organization";
import { contact, OFFICIAL_SITE } from "@/lib/site";

export const ORG_TEXT_FIELDS = [
  "organizationName", "address", "telephone", "email", "website",
  "presidentTitle", "presidentDesignation", "brandPrimary", "brandAccent", "logo", "signature",
] as const;
export const ORG_RULE_FIELDS = ["requireCnic", "requireMobile", "requireWhatsapp", "requireAddress"] as const;

export type OrgSettings = Record<(typeof ORG_TEXT_FIELDS)[number], string> &
  Record<(typeof ORG_RULE_FIELDS)[number], boolean>;

export const ORG_DEFAULTS: OrgSettings = {
  organizationName: "Chamber of Food & Agriculture Pakistan",
  address: contact.address,
  telephone: contact.phone.display,
  email: contact.emails[0],
  website: OFFICIAL_SITE,
  presidentTitle: "",
  presidentDesignation: "President, Federation of Pakistan,\nChamber Of Food & Agriculture",
  brandPrimary: "",
  brandAccent: "",
  logo: "",
  signature: "",
  requireCnic: true,
  requireMobile: true,
  requireWhatsapp: false,
  requireAddress: false,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toOrgSettings(doc: any): OrgSettings {
  const out = { ...ORG_DEFAULTS };
  if (!doc) return out;
  for (const k of ORG_TEXT_FIELDS) if (typeof doc[k] === "string") out[k] = doc[k];
  for (const k of ORG_RULE_FIELDS) if (typeof doc[k] === "boolean") out[k] = doc[k];
  return out;
}

/** Saved settings; unreachable database falls back to the built-in defaults. */
export const getOrganization = cache(async (): Promise<OrgSettings> => {
  try {
    await connectDB();
    return toOrgSettings(await Organization.findOne().lean());
  } catch {
    return { ...ORG_DEFAULTS };
  }
});

/** Dialable link for local (042…, 0300…) or international numbers. */
function telHref(phone: string) {
  const digits = phone.replace(/[^\d+]/g, "");
  return `tel:${digits.startsWith("0") ? `+92${digits.slice(1)}` : digits}`;
}

/** Public contact details, falling back to the built-in values for any blank field. */
export async function getPublicContact() {
  const org = await getOrganization();
  const email = org.email || contact.emails[0];
  const phone = org.telephone || contact.phone.display;
  const website = org.website || OFFICIAL_SITE;
  return {
    name: org.organizationName || ORG_DEFAULTS.organizationName,
    logo: org.logo || "/logo.avif",
    emails: [email, ...contact.emails.filter((e) => e.toLowerCase() !== email.toLowerCase())],
    phone: { display: phone, href: telHref(phone) },
    mobile: contact.mobile,
    address: org.address || contact.address,
    website: { href: /^https?:\/\//i.test(website) ? website : `https://${website}`, display: website.replace(/^https?:\/\//i, "").replace(/\/$/, "") },
    facebook: contact.facebook,
  };
}

export function revalidateOrganizationPages() {
  // Footer sits in the shared layout, so every public page needs a refresh.
  revalidatePath("/", "layout");
}
