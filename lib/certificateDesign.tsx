// The membership certificate: A4 landscape, drawn from the member's record. Server-only.

import type { GlyphSet } from "@/lib/glyphs";
import type { FrameStyle } from "@/lib/docFrames";
import { SITE_URL } from "@/lib/site";
import {
  clean, DEFAULT_THEME, Divider, DOC_THEMES, DOC_W, fitSize, GOLD, GOLD_TEXT, loadDocAssets, LOGO_RATIO, longDate, Page,
  Paragraph, qrDataUrl, renderDoc, Seal, SignatureBlock, VerifyQr, type DocFormat, type DocTheme, type DocThemeKey, type DocTier,
} from "@/lib/docArt";

export interface CertificateMemberData {
  id: string;
  membershipNo: string;
  firstName?: string;
  lastName?: string;
  membershipCategory?: string;
  district?: string;
  joinedDate?: Date | string | null;
  expiryDate?: Date | string | null;
}

/**
 * Each membership level has its own colours and a grandeur tier (4 most ornate), so higher
 * levels feel more prestigious. Anything unlisted uses the default colours at tier 3.
 */
export const CATEGORY_STYLES: Record<string, { theme: DocThemeKey; tier: DocTier }> = {
  Corporate: { theme: "black", tier: 4 },
  "Honorary Member": { theme: "maroon", tier: 4 },
  Executive: { theme: "emerald", tier: 3 },
  Overseas: { theme: "navy", tier: 3 },
  Associate: { theme: "blue", tier: 2 },
  Women: { theme: "purple", tier: 2 },
  Student: { theme: "teal", tier: 1 },
};

/** The level name on a ribbon banner, for the grandest certificates. */
function LevelBanner({ text, t }: { text: string; t: DocTheme }) {
  const w = text.length * 15 + 90, h = 30, notch = 12;
  return (
    <div style={{ width: w, height: h, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <path d={`M0 0H${w}L${w - notch} ${h / 2}L${w} ${h}H0L${notch} ${h / 2}Z`} fill={t.primary} stroke={GOLD} strokeWidth={1.6} />
        <path d={`M6 4H${w - 6}M6 ${h - 4}H${w - 6}`} stroke={GOLD} strokeOpacity={0.7} strokeWidth={0.7} />
      </svg>
      <div style={{ fontFamily: "Cinzel", fontWeight: 700, fontSize: 15, letterSpacing: 4, color: "#f3dc94" }}>{text}</div>
    </div>
  );
}

/** "OF CORPORATE MEMBERSHIP" under the title. */
function levelLine(category?: string) {
  const level = clean(category).replace(/\s*member$/i, "");
  if (!level) return "OF MEMBERSHIP";
  return `OF ${/^women$/i.test(level) ? "WOMEN'S" : level.toUpperCase()} MEMBERSHIP`;
}

/** "an Executive Member", "a Corporate Member", "an Honorary Member". */
function categoryLabel(category?: string) {
  const c = clean(category) || "Executive";
  const label = /member$/i.test(c) ? c : `${c} Member`;
  return { article: /^([aeiou]|honou?r)/i.test(label) ? "an" : "a", label };
}

/** Deeper gold for small lettering, which reads faintly in the lighter gold. */
const LABEL_GOLD = "#8a6416";

function Detail({ label, value, ink }: { label: string; value: string; ink: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 22px" }}>
      <div style={{ fontFamily: "Cinzel", fontWeight: 700, fontSize: 10.5, letterSpacing: 2, color: LABEL_GOLD }}>{label}</div>
      <div style={{ marginTop: 4, fontFamily: "Garamond", fontWeight: 700, fontSize: 18, color: ink }}>{value}</div>
    </div>
  );
}

function Certificate({ m, t, tier, frame, logo, signature, stamp, glyphs, qr, president, issued }: {
  m: CertificateMemberData; t: DocTheme; tier: DocTier; frame?: FrameStyle; logo: string; signature: string; stamp: string; glyphs: GlyphSet; qr: string; president?: string; issued: string;
}) {
  const name = clean(`${m.firstName ?? ""} ${m.lastName ?? ""}`);
  const { article, label } = categoryLabel(m.membershipCategory);
  const since = longDate(m.joinedDate);
  const until = longDate(m.expiryDate);
  const details = [
    { label: "MEMBERSHIP NO.", value: clean(m.membershipNo).toUpperCase() },
    { label: "CATEGORY", value: label },
    m.district ? { label: "DISTRICT", value: clean(m.district) } : null,
    until ? { label: "VALID UNTIL", value: until } : since ? { label: "MEMBER SINCE", value: since } : null,
  ].filter((d): d is { label: string; value: string } => !!d);

  return (
    <Page watermark={logo} t={t} tier={tier} frame={frame}>
      <div style={{ position: "absolute", left: 0, top: 62, width: DOC_W, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={logo} width={68} height={68 * LOGO_RATIO} />
        <div style={{ marginTop: 8, fontFamily: "Cinzel", fontWeight: 700, fontSize: 19, letterSpacing: 4, color: t.primary }}>
          CHAMBER OF FOOD &amp; AGRICULTURE PAKISTAN
        </div>
        <div style={{ marginTop: 10, fontFamily: "Cinzel Decorative", fontWeight: 700, fontSize: tier === 4 ? 66 : tier === 1 ? 54 : 60, lineHeight: 1, backgroundImage: GOLD_TEXT, backgroundClip: "text", color: "transparent" }}>
          Certificate
        </div>
        {tier === 4 ? (
          <div style={{ display: "flex", marginTop: 8 }}><LevelBanner text={levelLine(m.membershipCategory).replace(/^OF /, "")} t={t} /></div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", marginTop: 6 }}>
            <div style={{ width: 70, height: 1.4, background: GOLD }} />
            <div style={{ margin: "0 16px", fontFamily: "Cinzel", fontWeight: 700, fontSize: 18, letterSpacing: 6, color: t.primary }}>{levelLine(m.membershipCategory)}</div>
            <div style={{ width: 70, height: 1.4, background: GOLD }} />
          </div>
        )}

        <div style={{ marginTop: 16, fontFamily: "Great Vibes", fontSize: 32, color: "#4a3109" }}>This is to certify that</div>
        <div style={{ marginTop: 2, fontFamily: "Playfair", fontWeight: 700, fontSize: fitSize(name, 50, 760, 0.6), lineHeight: 1.15, color: t.primary }}>{name}</div>
        <div style={{ marginTop: 6, display: "flex" }}><Divider width={560} /></div>

        <div style={{ marginTop: 12, width: 860, display: "flex" }}>
          <Paragraph
            size={18.5}
            color={t.ink}
            strongColor={t.primary}
            weight={600}
            strongWeight={700}
            runs={[
              `is ${article}`, { strong: label }, "of the Chamber of Food & Agriculture Pakistan",
              ...(since ? [", admitted on", { strong: since } as const, ","] : [","]),
              "and is entitled to all the rights and privileges of membership under the rules of the Chamber.",
            ]}
          />
        </div>

        <div style={{ marginTop: 16, display: "flex", alignItems: "center", padding: "10px 6px", borderTop: `1.2px solid ${GOLD}`, borderBottom: `1.2px solid ${GOLD}` }}>
          {details.map((d, i) => (
            <div key={d.label} style={{ display: "flex", alignItems: "center" }}>
              {i > 0 && <div style={{ width: 1, height: 34, background: GOLD, opacity: 0.6 }} />}
              <Detail label={d.label} value={d.value} ink={t.ink} />
            </div>
          ))}
        </div>
      </div>

      {/* Signature, seal and verification */}
      <div style={{ position: "absolute", left: 110, bottom: 74, width: DOC_W - 220, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 240 }}>
          <SignatureBlock signature={signature} stamp={stamp} name={president} color={t.primary} ink={t.ink} />
          <div style={{ marginTop: 4, fontFamily: "Garamond", fontStyle: "italic", fontWeight: 600, fontSize: 13.5, color: "#3a3328" }}>{`Issued on ${issued}`}</div>
        </div>
        <div style={{ display: "flex", marginBottom: -8 }}><Seal size={tier === 4 ? 128 : tier === 1 ? 104 : tier === 2 ? 116 : 126} logo={logo} glyphs={glyphs} ribbon={t.primary} ribbons={tier > 1} laurel={tier === 4} /></div>
        <div style={{ display: "flex", width: 240, justifyContent: "center" }}>
          <VerifyQr qr={qr} caption="SCAN TO VERIFY" size={80} color={t.primary} />
        </div>
      </div>
    </Page>
  );
}

export async function renderCertificate(m: CertificateMemberData, format: DocFormat, president?: string, theme?: DocThemeKey, frame: FrameStyle = "swoosh"): Promise<Buffer> {
  const style = CATEGORY_STYLES[clean(m.membershipCategory)] ?? { theme: DEFAULT_THEME, tier: 3 as DocTier };
  const t = DOC_THEMES[theme ?? style.theme];
  const a = await loadDocAssets();
  const qr = await qrDataUrl(`${SITE_URL}/verify/${m.id}`, t.deep);
  return renderDoc(
    <Certificate m={m} t={t} tier={style.tier} frame={frame} logo={a.logo} signature={a.signature} stamp={a.stamp} glyphs={a.sealGlyphs} qr={qr} president={clean(president) || undefined} issued={longDate(new Date())} />,
    format,
    a.fonts,
    `Membership certificate ${m.membershipNo}`,
  );
}
