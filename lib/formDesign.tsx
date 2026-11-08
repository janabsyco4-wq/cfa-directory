// Draws the one-page A4 membership application form: blank for new applicants,
// or filled in from an existing member's record. Admin-only output (it can show CNICs).

import { ImageResponse } from "next/og";
import { isValidObjectId } from "mongoose";
import type { ReactNode } from "react";
import { connectDB } from "@/lib/mongodb";
import Member from "@/models/Member";
import { CATEGORIES } from "@/lib/directory";
import { loadCardAssets } from "@/lib/cardDesign";
import { buildCardPdf, cardFileName, pngCardImage } from "@/lib/cardFile";
import { getPublicContact } from "@/lib/organization";
import { SITE_URL } from "@/lib/site";

// A4 at 240 DPI, and in PDF points.
const FORM_W = 1984;
const FORM_H = 2806;
const A4_PT = { width: 595.28, height: 841.89 };

const GREEN = "#14532d";
const GOLD = "#b8892e";
const INK = "#1f2937";
const MUTED = "#4b5563";
const RULE = "#7c8a80";

const MEMBER_FIELDS =
  "membershipNo firstName lastName fatherName designation department cnic phone whatsapp email ntn address district businessName businessType membershipCategory fee status joinedDate expiryDate photo";

interface FormMember {
  membershipNo?: string;
  firstName?: string;
  lastName?: string;
  fatherName?: string;
  designation?: string;
  department?: string;
  cnic?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  ntn?: string;
  address?: string;
  district?: string;
  businessName?: string;
  businessType?: string;
  membershipCategory?: string;
  fee?: number;
  status?: string;
  joinedDate?: Date | string | null;
  expiryDate?: Date | string | null;
  photo?: string;
}

function day(d?: Date | string | null) {
  const v = d ? new Date(d) : null;
  if (!v || Number.isNaN(v.getTime())) return "";
  return `${String(v.getUTCDate()).padStart(2, "0")}/${String(v.getUTCMonth() + 1).padStart(2, "0")}/${v.getUTCFullYear()}`;
}

/** The member's photo as a data URI; a missing or unreadable one just leaves the box empty. */
async function photoData(src?: string) {
  if (!src) return undefined;
  const cloudinary = src.startsWith("https://res.cloudinary.com/");
  if (!cloudinary && !src.startsWith("/")) return undefined;
  const url = cloudinary ? src.replace("/upload/", "/upload/f_jpg,q_85,c_fill,g_face,w_600,h_760/") : `${SITE_URL}${encodeURI(src)}`;
  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !/^image\/(jpeg|png)/.test(type)) return undefined;
    return `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
  } catch {
    return undefined;
  }
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", marginTop: 40 }}>
      <div style={{ display: "flex", alignItems: "center", height: 58, paddingLeft: 24, background: GREEN, color: "#ffffff", fontFamily: "Roboto Condensed", fontWeight: 700, fontSize: 33, letterSpacing: 1.5 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ children, top = 24 }: { children: ReactNode; top?: number }) {
  return <div style={{ display: "flex", gap: 40, marginTop: top }}>{children}</div>;
}

/** A labelled writing line. Long values shrink to stay on the line. */
function Field({ label, value, flex = 1, width, height = 108 }: { label: string; value?: string; flex?: number; width: number; height?: number }) {
  const text = (value ?? "").replace(/\s+/g, " ").trim();
  const size = Math.max(24, Math.min(37, Math.floor((width * (height > 110 ? 1.9 : 1)) / (Math.max(text.length, 1) * 0.52))));
  return (
    <div style={{ display: "flex", flexDirection: "column", flexGrow: flex, flexBasis: 0, height }}>
      <div style={{ fontFamily: "Roboto Condensed", fontWeight: 700, fontSize: 28, color: MUTED }}>{label}</div>
      <div style={{ display: "flex", alignItems: "flex-end", flexGrow: 1, borderBottom: `3px solid ${RULE}`, paddingBottom: 6, fontFamily: "Arimo", fontSize: size, lineHeight: 1.15, color: INK }}>
        {text}
      </div>
    </div>
  );
}

function Tick({ label, checked = false, size = 36 }: { label: string; checked?: boolean; size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", fontFamily: "Arimo", fontSize: 31, color: INK }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: size, height: size, border: `3px solid ${GREEN}`, marginRight: 13, background: "#ffffff" }}>
        {checked && (
          <svg width={size - 8} height={size - 8} viewBox="0 0 24 24">
            <path d="M4 13l5 5L20 6" fill="none" stroke={GREEN} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      {label}
    </div>
  );
}

/** Pakistani CNIC layout: 5 boxes, dash, 7 boxes, dash, 1 box. */
function CnicBoxes({ cnic }: { cnic?: string }) {
  const digits = (cnic ?? "").replace(/\D/g, "");
  const chars = digits.length === 13 ? digits.split("") : Array<string>(13).fill("");
  const box = (i: number) => (
    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 47, height: 58, border: `2.5px solid ${RULE}`, marginLeft: -2.5, fontFamily: "Arimo", fontSize: 34, color: INK }}>
      {chars[i]}
    </div>
  );
  const dash = (k: string) => <div key={k} style={{ display: "flex", width: 26, height: 3, background: MUTED, margin: "0 8px" }} />;
  return (
    <div style={{ display: "flex", flexDirection: "column", height: 108 }}>
      <div style={{ fontFamily: "Roboto Condensed", fontWeight: 700, fontSize: 28, color: MUTED, marginBottom: 6 }}>CNIC No.</div>
      <div style={{ display: "flex", alignItems: "center", marginLeft: 2.5 }}>
        {[0, 1, 2, 3, 4].map(box)}
        {dash("a")}
        {[5, 6, 7, 8, 9, 10, 11].map(box)}
        {dash("b")}
        {box(12)}
      </div>
    </div>
  );
}

function SignatureLine({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, flexBasis: 0, marginTop: 84 }}>
      <div style={{ display: "flex", height: 3, background: RULE }} />
      <div style={{ fontFamily: "Roboto Condensed", fontWeight: 700, fontSize: 28, color: MUTED, marginTop: 8 }}>{label}</div>
    </div>
  );
}

type Org = Awaited<ReturnType<typeof getPublicContact>>;

function MembershipForm({ m, org, logo, photo }: { m: FormMember | null; org: Org; logo: string; photo?: string }) {
  const name = m ? `${m.firstName ?? ""} ${m.lastName ?? ""}` : "";
  const full = 1764; // width inside the page margins
  const half = (full - 40) / 2;

  return (
    <div style={{ width: FORM_W, height: FORM_H, display: "flex", flexDirection: "column", position: "relative", background: "#ffffff" }}>
      <div style={{ display: "flex", height: 26, background: GREEN }} />
      <div style={{ display: "flex", height: 8, background: GOLD }} />

      <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, padding: "44px 110px 0" }}>
        {/* Letterhead */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
          <img src={logo} width={224} height={224} />
          <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, marginLeft: 34 }}>
            <div style={{ fontFamily: "Montserrat", fontWeight: 600, fontSize: 60, color: GREEN, lineHeight: 1.1 }}>Chamber of Food &amp; Agriculture</div>
            <div style={{ fontFamily: "Montserrat", fontWeight: 600, fontSize: 38, color: GOLD, marginTop: 6 }}>Pakistan</div>
            <div style={{ fontFamily: "Arimo", fontSize: 28, color: MUTED, marginTop: 16 }}>{org.address}</div>
            <div style={{ fontFamily: "Arimo", fontSize: 28, color: MUTED, marginTop: 6 }}>{`Tel: ${org.phone.display}  |  ${org.emails[0]}  |  ${org.website.display}`}</div>
          </div>
        </div>

        {/* Title */}
        <div style={{ display: "flex", alignItems: "center", marginTop: 26, borderTop: `4px solid ${GREEN}`, borderBottom: `4px solid ${GREEN}`, height: 96 }}>
          <div style={{ fontFamily: "Montserrat", fontWeight: 600, fontSize: 48, color: GREEN, letterSpacing: 3, flexGrow: 1 }}>MEMBERSHIP APPLICATION FORM</div>
          <div style={{ fontFamily: "Arimo", fontSize: 26, color: MUTED }}>Please complete in BLOCK LETTERS</div>
        </div>

        {/* Membership + photograph */}
        <div style={{ display: "flex", marginTop: 30 }}>
          <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, flexBasis: 0, marginRight: 40 }}>
            <div style={{ display: "flex", alignItems: "center", height: 58, paddingLeft: 24, background: GREEN, color: "#ffffff", fontFamily: "Roboto Condensed", fontWeight: 700, fontSize: 33, letterSpacing: 1.5 }}>
              MEMBERSHIP CATEGORY
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", marginTop: 8 }}>
              {CATEGORIES.map((c) => (
                <div key={c} style={{ display: "flex", width: "33%", marginTop: 16 }}>
                  <Tick label={c.replace(" Member", "")} checked={m?.membershipCategory === c} />
                </div>
              ))}
            </div>
            <Row top={22}>
              <Field label="Membership No." value={m?.membershipNo} width={550} flex={1.4} />
              <Field label="Date of Joining" value={day(m?.joinedDate)} width={397} />
              <Field label="Date of Expiry" value={day(m?.expiryDate)} width={397} />
            </Row>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 300, height: 380, border: `3px dashed ${RULE}`, overflow: "hidden" }}>
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
              <img src={photo} width={300} height={380} style={{ objectFit: "cover" }} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontFamily: "Arimo", fontSize: 26, color: MUTED, lineHeight: 1.3 }}>
                <span>Affix recent</span>
                <span>passport-size</span>
                <span>photograph</span>
              </div>
            )}
          </div>
        </div>

        <Section title="PERSONAL INFORMATION">
          <Row><Field label="Full Name" value={name} width={half} /><Field label="Father's / Husband's Name" value={m?.fatherName} width={half} /></Row>
          <Row>
            <CnicBoxes cnic={m?.cnic} />
            <Field label="District" value={m?.district} width={760} />
          </Row>
          <Row><Field label="Designation" value={m?.designation} width={half} /><Field label="Chapter / Department" value={m?.department} width={half} /></Row>
          <Row>
            <Field label="Mobile No." value={m?.phone} width={440} />
            <Field label="WhatsApp No." value={m?.whatsapp} width={440} />
            <Field label="Email" value={m?.email} width={800} flex={1.8} />
          </Row>
          <Row><Field label="Postal Address" value={m?.address} width={full} height={146} /></Row>
        </Section>

        <Section title="BUSINESS / ORGANIZATION">
          <Row>
            <Field label="Business / Organization Name" value={m?.businessName} width={760} flex={1.7} />
            <Field label="Nature of Business" value={m?.businessType} width={520} flex={1.2} />
            <Field label="NTN" value={m?.ntn} width={400} flex={0.9} />
          </Row>
        </Section>

        <Section title="DECLARATION">
          <div style={{ display: "flex", marginTop: 16, fontFamily: "Arimo", fontSize: 29, lineHeight: 1.4, color: INK }}>
            I hereby apply for membership of the Chamber of Food &amp; Agriculture Pakistan. I declare that the information given above is true and correct to the best of my knowledge, and I agree to abide by the rules and regulations of the Chamber. I understand that membership is subject to approval and may be cancelled if any information is found to be incorrect.
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 50, marginTop: 16 }}>
            <div style={{ fontFamily: "Roboto Condensed", fontWeight: 700, fontSize: 30, color: MUTED }}>Enclosed:</div>
            <Tick label="Copy of CNIC" />
            <Tick label="Recent photograph" />
            <Tick label="Proof of business (if any)" />
          </div>
          <div style={{ display: "flex", gap: 60 }}>
            <SignatureLine label="Applicant's Signature" />
            <SignatureLine label="Date" />
          </div>
        </Section>

        {/* Office use */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 40, background: "#f3f5f1", border: `3px solid ${GREEN}`, padding: "0 30px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", height: 66, fontFamily: "Roboto Condensed", fontWeight: 700, fontSize: 33, letterSpacing: 1.5, color: GREEN, borderBottom: `3px solid ${GREEN}` }}>
            FOR OFFICE USE ONLY
          </div>
          <Row>
            <Field label="Fee Received (Rs.)" value={m?.fee ? m.fee.toLocaleString("en-PK") : ""} width={380} />
            <Field label="Receipt No." value="" width={380} />
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flexGrow: 1, flexBasis: 0, height: 108 }}>
              <Tick label="Approved" checked={m?.status === "Active"} />
              <Tick label="Not approved" />
            </div>
          </Row>
          <div style={{ display: "flex", gap: 60 }}>
            <SignatureLine label="Secretary General" />
            <SignatureLine label="President" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 66, marginTop: 20, background: GREEN, color: "#ffffff", fontFamily: "Arimo", fontSize: 26 }}>
        {`Verify any membership online: ${SITE_URL.replace(/^https?:\/\//, "")}/verify`}
      </div>
    </div>
  );
}

/** The form as a PDF: blank, or filled in for one member. Null when that member doesn't exist. */
export async function buildMembershipFormPdf(memberId?: string | null): Promise<{ pdf: Buffer; filename: string } | null> {
  let m: FormMember | null = null;
  if (memberId) {
    if (!isValidObjectId(memberId)) return null;
    await connectDB();
    m = await Member.findById(memberId).select(MEMBER_FIELDS).lean<FormMember>();
    if (!m) return null;
  }
  const [{ fonts, logo }, org, photo] = await Promise.all([loadCardAssets(), getPublicContact(), photoData(m?.photo)]);
  const res = new ImageResponse(<MembershipForm m={m} org={org} logo={logo} photo={photo} />, { width: FORM_W, height: FORM_H, fonts });
  const png = Buffer.from(await res.arrayBuffer());
  const title = m ? `Membership form ${m.membershipNo}` : "Membership application form";
  return {
    pdf: buildCardPdf([pngCardImage(png)], title, A4_PT),
    filename: m ? cardFileName(m.membershipNo ?? "", "form.pdf") : "CFA-Membership-Application-Form.pdf",
  };
}
