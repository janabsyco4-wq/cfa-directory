// Draws the membership card (front and back) as print-resolution PNGs, matching the
// printed CFA cards: gold for Associate and Student members, silver for everyone else. Server-only.

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { SITE_URL } from "@/lib/site";
import { getPublicContact } from "@/lib/organization";
import { cardTier, type CardTier } from "@/lib/cardTier";

// CR80 card (85.6 × 54 mm) at ~600 DPI.
export const CARD_W = 2024;
export const CARD_H = 1276;

export type CardSide = "front" | "back";

export interface CardMemberData {
  id: string;
  membershipNo: string;
  firstName?: string;
  lastName?: string;
  membershipCategory?: string;
  designation?: string;
  joinedDate?: Date | string | null;
  expiryDate?: Date | string | null;
}

// Printed on the back of every card.
const CARD_CONTACT = {
  address: ["Jasmine Block, House No. 560,", "Bahria Town Lahore, Pakistan"],
  email: "chamberoffoodandagriculturepk@gmail.com",
  website: "www.cfapak.org",
};

const PRIVILEGES = [
  "Participate in Chamber meetings, programs and events.",
  "Access business networking and collaboration opportunities.",
  "Receive updates on policies, regulations and industry developments.",
  "Have the right to vote in Chamber elections as per the Chamber rules.",
];

const INK = "#373c42";
const BAND = "linear-gradient(180deg, #2a2a2c 0%, #19191b 55%, #222224 100%)";

const TIERS: Record<CardTier, { base: string; sheen: string }> = {
  gold: {
    base: "linear-gradient(115deg, #e4c98f 0%, #d8b878 30%, #cfac68 55%, #dcbe82 80%, #d2b06d 100%)",
    sheen: "linear-gradient(160deg, rgba(255,248,225,0.35) 0%, rgba(255,248,225,0) 45%, rgba(120,85,25,0.10) 100%)",
  },
  silver: {
    base: "linear-gradient(115deg, #eceef0 0%, #d6d9dd 30%, #c4c8cd 55%, #dadde1 80%, #c9cdd2 100%)",
    sheen: "linear-gradient(160deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 45%, rgba(40,45,55,0.10) 100%)",
  },
};

// Embossed silver lettering: the metal, and the dark rim it casts on the card body.
const SILVER_FOIL = "linear-gradient(180deg, #ffffff 0%, #ffffff 20%, #dde1e5 37%, #8b929a 50%, #c8cdd2 60%, #ffffff 75%, #f1f3f5 88%, #868d95 100%)";
const SILVER_EDGE = "#22262b";
// Gold cards print the name on the black band in plain gold, with no embossing.
const GOLD_PRINT = "#e8c76a";

// Fine horizontal pinstripes of the printed PVC finish.
const PINSTRIPES =
  "repeating-linear-gradient(180deg, rgba(255,255,255,0.16) 0px, rgba(255,255,255,0.16) 2px, rgba(0,0,0,0.035) 2px, rgba(0,0,0,0.035) 7px)";

type Fonts = NonNullable<NonNullable<ConstructorParameters<typeof ImageResponse>[1]>["fonts"]>;
type Assets = { fonts: Fonts; logo: string; signature: string };

let assets: Promise<Assets> | undefined;

export function loadCardAssets(): Promise<Assets> {
  assets ??= (async () => {
    const dir = join(process.cwd(), "assets");
    const font = (file: string) => readFile(join(dir, "fonts", file));
    const dataUri = async (file: string) => `data:image/png;base64,${(await readFile(join(dir, "card", file))).toString("base64")}`;
    const [montserrat, barlow, mono, rcReg, rcBold, arimo, logo, signature] = await Promise.all([
      font("Montserrat-SemiBold.ttf"),
      font("Barlow-Medium.ttf"), font("ShareTechMono-Regular.ttf"),
      font("RobotoCondensed-Regular.ttf"), font("RobotoCondensed-Bold.ttf"), font("Arimo-Regular.ttf"),
      dataUri("logo.png"), dataUri("signature.png"),
    ]);
    const fonts: Fonts = [
      { name: "Montserrat", data: montserrat, weight: 600, style: "normal" },
      { name: "Barlow", data: barlow, weight: 500, style: "normal" },
      { name: "Emboss", data: mono, weight: 400, style: "normal" },
      { name: "Roboto Condensed", data: rcReg, weight: 400, style: "normal" },
      { name: "Roboto Condensed", data: rcBold, weight: 700, style: "normal" },
      { name: "Arimo", data: arimo, weight: 400, style: "normal" },
    ];
    return { fonts, logo, signature };
  })().catch((err) => {
    assets = undefined;
    throw err;
  });
  return assets!;
}

const clean = (s?: string) => (s ?? "").replace(/\s+/g, " ").trim();

function fullName(m: CardMemberData) {
  return clean(`${m.firstName ?? ""} ${m.lastName ?? ""}`).toUpperCase();
}

function year(d?: Date | string | null) {
  const v = d ? new Date(d) : null;
  return v && !Number.isNaN(v.getTime()) ? String(v.getUTCFullYear()) : "—";
}

function monthYear(d?: Date | string | null) {
  const v = d ? new Date(d) : null;
  return v && !Number.isNaN(v.getTime()) ? `${String(v.getUTCMonth() + 1).padStart(2, "0")}/${v.getUTCFullYear()}` : "—";
}

/** "President, District Jhelum" → ["PRESIDENT", "DISTRICT JHELUM"]. */
function designationLines(designation?: string) {
  const d = clean(designation);
  if (!d || /^(nil|n\/a|-)$/i.test(d)) return [];
  const i = d.indexOf(",");
  return (i > 0 ? [d.slice(0, i), d.slice(i + 1)] : [d]).map((s) => clean(s).toUpperCase()).filter(Boolean);
}

/** "an Executive Member", "a Corporate Member", "an Honorary Member". */
function categoryPhrase(category?: string) {
  const c = clean(category) || "Executive";
  const label = /member$/i.test(c) ? c : `${c} Member`;
  return { article: /^([aeiou]|honou?r)/i.test(label) ? "an" : "a", label };
}

/** The mono face slashes its zero; embossed cards print a plain oval, which is its letter O. */
const plainZero = (s: string) => s.replace(/0/g, "O");

/** Embossed (mono) text sized down so long values still fit the given width. */
function embossSize(text: string, max: number, width: number, spacing: number) {
  const perChar = 0.54 + spacing; // advance of the mono face, in em
  return Math.min(max, Math.floor(width / (Math.max(text.length, 1) * perChar)));
}

/**
 * The name and number. Silver is raised foil: a dark rim underneath, then the metal thickened
 * and highlighted on top. Gold is flat print.
 */
function Lettering({ text, size, tier, onBand = false }: { text: string; size: number; tier: CardTier; onBand?: boolean }) {
  const type = { fontFamily: "Emboss", fontSize: size, letterSpacing: "0.16em", lineHeight: 1 };
  const depth = Math.max(2, size * 0.05);
  if (tier === "gold") return <div style={{ ...type, color: onBand ? GOLD_PRINT : INK }}>{text}</div>;
  const rim = onBand ? "#000000" : SILVER_EDGE;
  const metal = { ...type, backgroundImage: SILVER_FOIL, backgroundClip: "text", color: "transparent" };
  const at = (left: number, top: number) => ({ position: "absolute" as const, left, top });
  return (
    <div style={{ display: "flex", position: "relative" }}>
      <div style={{ ...type, ...at(depth * 0.7, depth), color: rim, WebkitTextStroke: `${depth * 0.8}px ${rim}` }}>{text}</div>
      <div style={{ ...metal, ...at(-depth * 0.3, 0) }}>{text}</div>
      <div style={{ ...metal, ...at(depth * 0.3, 0) }}>{text}</div>
      <div style={metal}>{text}</div>
    </div>
  );
}

/** Small caps like the printed card: each word's first letter full height, the rest smaller. */
function SmallCaps({ text, size, color }: { text: string; size: number; color: string }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", color, fontFamily: "Montserrat", fontWeight: 600, letterSpacing: size * 0.04, lineHeight: 1.12 }}>
      {text.split(" ").map((word, i) => (
        <div key={i} style={{ display: "flex", alignItems: "baseline", marginRight: size * 0.32 }}>
          <span style={{ fontSize: size }}>{word.slice(0, 1)}</span>
          {word.length > 1 && <span style={{ fontSize: size * 0.78 }}>{word.slice(1)}</span>}
        </div>
      ))}
    </div>
  );
}

function Chip() {
  return (
    <svg width="164" height="124" viewBox="0 0 164 124">
      <defs>
        <linearGradient id="chip" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b9dcf7" />
          <stop offset="0.5" stopColor="#8fc0ec" />
          <stop offset="1" stopColor="#79acdf" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="160" height="120" rx="18" fill="url(#chip)" stroke="#3d6f9e" strokeWidth="3" />
      <path d="M82 6 L58 30 L58 94 L82 118 L106 94 L106 30 Z" fill="#c9e4fa" stroke="#3d6f9e" strokeWidth="3" />
      <path d="M2 42 H58 M2 82 H58 M106 42 H162 M106 82 H162" stroke="#3d6f9e" strokeWidth="3" fill="none" />
    </svg>
  );
}

function Front({ m, tier, a }: { m: CardMemberData; tier: CardTier; a: Assets }) {
  const t = TIERS[tier];
  const number = clean(m.membershipNo).toUpperCase();
  const name = fullName(m);
  const lines = designationLines(m.designation);
  const numberSize = embossSize(number, 80, 1180, 0.16);
  const nameSize = embossSize(name, 74, 1840, 0.16);
  const line1Size = lines[0] && lines[0].length > 26 ? Math.max(34, Math.round(52 * 26 / lines[0].length)) : 52;
  const line2Size = lines[1] && lines[1].length > 34 ? Math.max(26, Math.round(38 * 34 / lines[1].length)) : 38;

  return (
    <div style={{ width: CARD_W, height: CARD_H, display: "flex", position: "relative", backgroundImage: `${PINSTRIPES}, ${t.sheen}, ${t.base}` }}>
      {/* Chamber title */}
      <div style={{ position: "absolute", left: 186, top: 76, width: 730, display: "flex", flexDirection: "column", alignItems: "center", color: INK, fontFamily: "Montserrat", fontWeight: 600, lineHeight: 1 }}>
        <div style={{ fontSize: 68, letterSpacing: 1 }}>CHAMBER OF</div>
        <div style={{ fontSize: 59, marginTop: 14, letterSpacing: 0.5 }}>FOOD &amp; AGRICULTURE</div>
        <div style={{ display: "flex", alignItems: "center", marginTop: 14, width: "100%" }}>
          <div style={{ flex: 1, height: 4, background: INK }} />
          <div style={{ fontSize: 40, padding: "0 26px" }}>Pakistan</div>
          <div style={{ flex: 1, height: 4, background: INK }} />
        </div>
      </div>

      {/* Logo */}
      <div style={{ position: "absolute", left: 1546, top: 92, width: 322, height: 310, borderRadius: 30, background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.25)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={a.logo} width={290} height={290} />
      </div>

      <div style={{ position: "absolute", left: 182, top: 310, display: "flex" }}><Chip /></div>

      {/* Membership number (embossed) */}
      <div style={{ position: "absolute", left: 84, top: 524 - numberSize * 0.6, display: "flex" }}><Lettering text={plainZero(number)} size={numberSize} tier={tier} /></div>

      {/* Validity */}
      <div style={{ position: "absolute", left: 196, top: 640, display: "flex", alignItems: "flex-end", fontFamily: "Barlow", fontWeight: 500, color: INK }}>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 38, lineHeight: 1.08 }}><span>Valid</span><span>From</span></div>
        <div style={{ marginLeft: 18, marginBottom: 2, background: "#202226", color: "#f4f4f4", fontSize: 54, lineHeight: 1, padding: "10px 22px 12px" }}>{year(m.joinedDate)}</div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 38, lineHeight: 1.08, marginLeft: 76 }}><span>Until</span><span>End</span></div>
        <div style={{ marginLeft: 18, marginBottom: 2, background: "#202226", color: "#f4f4f4", fontSize: 54, lineHeight: 1, padding: "10px 22px 12px" }}>{monthYear(m.expiryDate)}</div>
      </div>

      {/* Authorised signature */}
      <div style={{ position: "absolute", left: 1530, top: 480, width: 340, display: "flex", flexDirection: "column", alignItems: "center", color: INK }}>
        <div style={{ fontFamily: "Roboto Condensed", fontWeight: 700, fontSize: 25, color: "#2b2b2b" }}>Authorised Signature</div>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={a.signature} width={112} height={164} style={{ marginTop: 4, marginBottom: -14 }} />
        <div style={{ width: 300, height: 3, background: INK }} />
        <div style={{ fontFamily: "Montserrat", fontWeight: 600, fontSize: 38, marginTop: 6 }}>President</div>
      </div>

      {/* Name band */}
      <div style={{ position: "absolute", left: 0, top: 790, width: CARD_W, height: 218, backgroundImage: BAND, display: "flex", alignItems: "center", paddingLeft: 80 }}>
        <Lettering text={plainZero(name)} size={nameSize} tier={tier} onBand />
      </div>

      {/* Designation */}
      <div style={{ position: "absolute", left: 140, top: 1030, width: 1780, display: "flex", flexDirection: "column" }}>
        {lines[0] && <SmallCaps text={lines[0]} size={line1Size} color={INK} />}
        {lines[1] && <div style={{ display: "flex", marginTop: 4 }}><SmallCaps text={lines[1]} size={line2Size} color={INK} /></div>}
      </div>
    </div>
  );
}

const icon = { width: 44, height: 44, viewBox: "0 0 24 24", fill: "none", stroke: "#ffffff", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function Back({ m, tier, qr, phone }: { m: CardMemberData; tier: CardTier; qr: string; phone: string }) {
  const t = TIERS[tier];
  const { article, label } = categoryPhrase(m.membershipCategory);
  const serial = (clean(m.membershipNo).match(/(\d+)\s*$/)?.[1] ?? "").slice(-4).padStart(4, "0");
  const body = { fontFamily: "Roboto Condensed", color: "#262626" };

  return (
    <div style={{ width: CARD_W, height: CARD_H, display: "flex", position: "relative", backgroundImage: `${PINSTRIPES}, ${t.sheen}, ${t.base}` }}>
      {/* Certification band */}
      <div style={{ position: "absolute", left: 0, top: 50, width: CARD_W, height: 192, backgroundImage: BAND, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Roboto Condensed", fontSize: 48, color: "#f5f5f5", lineHeight: 1.3 }}>
        <div>This is to certify that the person whose name appears on the front of this</div>
        <div style={{ display: "flex" }}>
          <span>card is {article}&nbsp;</span>
          <span style={{ fontWeight: 700 }}>{label}</span>
          <span>&nbsp;of the Chamber of Food &amp; Agriculture Pakistan.</span>
        </div>
      </div>

      {/* Privileges */}
      <div style={{ position: "absolute", left: 218, top: 296, display: "flex", flexDirection: "column", ...body }}>
        <div style={{ fontWeight: 700, fontSize: 56, lineHeight: 1.1 }}>MEMBER PRIVILEGES</div>
        {PRIVILEGES.map((p) => (
          <div key={p} style={{ fontSize: 43, lineHeight: 1.42 }}>{p}</div>
        ))}
      </div>

      {/* Signature strip with serial */}
      <div style={{ position: "absolute", left: 226, top: 776, width: 1254, height: 180, display: "flex", background: "#ffffff", border: "3px solid #3a3a3a", padding: 12 }}>
        <div style={{ flex: 1, backgroundImage: BAND }} />
        <div style={{ width: 300, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Roboto Condensed", fontWeight: 700, fontSize: 112, color: "#1b1b1b", letterSpacing: 2 }}>{serial}</div>
      </div>

      {/* Verification QR */}
      <div style={{ position: "absolute", left: 1578, top: 606, width: 322, height: 322, background: "#ffffff", border: "3px solid #4a4a4a", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={qr} width={290} height={290} />
      </div>

      {/* Contact band */}
      <div style={{ position: "absolute", left: 0, top: 1004, width: CARD_W, height: 198, backgroundImage: BAND, display: "flex", alignItems: "center", color: "#ffffff" }}>
        <div style={{ display: "flex", alignItems: "center", marginLeft: 150, width: 1080 }}>
          <svg {...icon} width={58} height={58}>
            <circle cx="12" cy="12" r="10.5" />
            <path d="M12 17.5s-4-3.6-4-7a4 4 0 0 1 8 0c0 3.4-4 7-4 7z" fill="#ffffff" stroke="none" />
            <circle cx="12" cy="10.4" r="1.5" fill="#222" stroke="none" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column", marginLeft: 30, fontFamily: "Arimo", fontSize: 44, lineHeight: 1.22 }}>
            <span>{CARD_CONTACT.address[0]}</span>
            <span>{CARD_CONTACT.address[1]}</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontFamily: "Arimo", marginTop: -6 }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 52 }}>
            <svg {...icon} width={50} height={50}>
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
            </svg>
            <span style={{ marginLeft: 14 }}>{phone}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", fontSize: 25, marginTop: 10, marginLeft: 6 }}>
            <svg {...icon} width={26} height={26}><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4z" fill="#ffffff" /></svg>
            <span style={{ marginLeft: 22 }}>{CARD_CONTACT.email}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", fontSize: 25, marginTop: 8, marginLeft: 6 }}>
            <svg {...icon} width={26} height={26}><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" /></svg>
            <span style={{ marginLeft: 22 }}>{CARD_CONTACT.website}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Where the QR code on the back of the card leads. */
export function cardVerifyUrl(id: string) {
  return `${SITE_URL}/verify/${id}`;
}

export async function renderCard(side: CardSide, m: CardMemberData): Promise<Buffer> {
  const a = await loadCardAssets();
  const tier = cardTier(m.membershipCategory);
  const element = side === "front"
    ? <Front m={m} tier={tier} a={a} />
    : <Back m={m} tier={tier} phone={(await getPublicContact()).phone.display} qr={await QRCode.toDataURL(cardVerifyUrl(m.id), { margin: 0, width: 580, errorCorrectionLevel: "M", color: { dark: "#111111", light: "#ffffff" } })} />;
  const res = new ImageResponse(element, { width: CARD_W, height: CARD_H, fonts: a.fonts });
  return Buffer.from(await res.arrayBuffer());
}
