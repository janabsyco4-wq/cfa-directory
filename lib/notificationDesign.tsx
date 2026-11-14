// A Chamber notification (appointment to a post for a period): A4 landscape. Server-only.

import type { GlyphSet } from "@/lib/glyphs";
import { SITE_URL } from "@/lib/site";
import { pronouns, type NotificationRecord } from "@/lib/notifications";
import {
  clean, DEFAULT_THEME, Divider, DOC_THEMES, DOC_W, dottedDate, GOLD, GOLD_TEXT, loadDocAssets, LOGO_RATIO, longDate, MAROON,
  Page, Paragraph, qrDataUrl, renderDoc, Seal, SignatureBlock, VerifyQr, type DocFormat, type DocTheme, type DocThemeKey, type Run,
} from "@/lib/docArt";

export interface NotificationMemberData {
  id: string;
  membershipNo: string;
  firstName?: string;
  lastName?: string;
}

function Notification({ m, n, t, logo, signature, stamp, glyphs, qr, president }: {
  m: NotificationMemberData; n: NotificationRecord; t: DocTheme; logo: string; signature: string; stamp: string; glyphs: GlyphSet; qr: string; president?: string;
}) {
  const name = clean(`${m.firstName ?? ""} ${m.lastName ?? ""}`);
  const { subject, possessive } = pronouns(n.relation);
  const unit = clean(n.unit);
  const appointment: Run[] = [
    "This is to notify that", { strong: `${clean(n.honorific)} ${name}`.trim() },
    ...(clean(n.relativeName) ? [n.relation, { strong: clean(n.relativeName) }] : []),
    "is hereby notified as", { strong: clean(n.post) }, ",",
    ...(unit ? ["Chamber of Food & Agriculture,", { strong: unit }, ","] : ["Chamber of Food & Agriculture Pakistan,"]),
    "for the period from", { strong: dottedDate(n.from) }, "to", { strong: dottedDate(n.to) }, ".",
  ];
  const tribute = [
    `${subject} is one of our best volunteer members and works hard to perform ${possessive} duties.`,
    `${subject} is a talented, committed and hard-working farmer activist and an asset to the country.`,
    `${subject} is officially authorised by the organisation to work for the betterment and protection of the farmer community.`,
  ].join(" ");

  return (
    <Page watermark={logo} t={t}>
      {/* Letterhead */}
      <div style={{ position: "absolute", left: 92, top: 82, width: DOC_W - 184, display: "flex", alignItems: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={logo} width={94} height={94 * LOGO_RATIO} />
        <div style={{ marginLeft: 22, flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "flex-start" }}>
            <div style={{ fontFamily: "Cinzel", fontWeight: 700, fontSize: 27, letterSpacing: 1, color: t.primary }}>CHAMBER OF FOOD &amp; AGRICULTURE PAKISTAN</div>
            <div style={{ marginLeft: 4, fontFamily: "Garamond", fontWeight: 500, fontSize: 15, color: t.primary }}>®</div>
          </div>
          <div style={{ marginTop: 2, fontFamily: "Garamond", fontStyle: "italic", fontSize: 17, color: "#6b4a12" }}>
            (We work hard for the betterment of the farmer community)
          </div>
          <div style={{ marginTop: 8, display: "flex" }}><Divider width={620} /></div>
        </div>
      </div>

      {/* Reference line */}
      <div style={{ position: "absolute", left: 100, top: 214, width: DOC_W - 200, display: "flex", justifyContent: "space-between", fontFamily: "Garamond", fontWeight: 500, fontSize: 15, color: t.ink }}>
        <div style={{ display: "flex" }}><span style={{ fontFamily: "Cinzel", fontWeight: 700, fontSize: 12, color: GOLD, marginRight: 8, marginTop: 2 }}>NO.</span>{n.number}</div>
        <div style={{ display: "flex" }}><span style={{ fontFamily: "Cinzel", fontWeight: 700, fontSize: 12, color: GOLD, marginRight: 8, marginTop: 2 }}>DATED</span>{longDate(n.issuedAt)}</div>
      </div>

      {/* Title */}
      <div style={{ position: "absolute", left: 0, top: 236, width: DOC_W, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ fontFamily: "Cinzel Decorative", fontWeight: 700, fontSize: 46, letterSpacing: 4, lineHeight: 1, color: MAROON }}>Notification</div>
        <div style={{ marginTop: 4, width: 300, height: 3, backgroundImage: GOLD_TEXT }} />
      </div>

      {/* Body */}
      <div style={{ position: "absolute", left: 116, top: 306, width: DOC_W - 232, display: "flex", flexDirection: "column" }}>
        <Paragraph runs={appointment} size={21} lineHeight={1.7} color="#1c3a8a" strongColor={t.primary} align="flex-start" />
        <div style={{ marginTop: 8, display: "flex" }}>
          <Paragraph runs={[tribute]} size={19} lineHeight={1.65} color="#1c3a8a" strongColor={t.primary} align="flex-start" />
        </div>
      </div>

      {/* Verification, seal and signature */}
      <div style={{ position: "absolute", left: 100, bottom: 124, width: DOC_W - 200, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div style={{ display: "flex", width: 240, justifyContent: "center" }}><VerifyQr qr={qr} caption="SCAN TO VERIFY" size={72} color={t.primary} /></div>
        <div style={{ display: "flex", marginBottom: -14 }}><Seal size={112} logo={logo} glyphs={glyphs} ribbon={t.primary} /></div>
        <div style={{ display: "flex", width: 240, justifyContent: "center" }}><SignatureBlock signature={signature} stamp={stamp} stampSide="left" name={president} width={220} color={t.primary} ink={t.ink} /></div>
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", left: 90, bottom: 68, width: DOC_W - 180, display: "flex", flexDirection: "column", alignItems: "center", borderTop: `1.2px solid ${GOLD}`, paddingTop: 5 }}>
        <div style={{ fontFamily: "Garamond", fontStyle: "italic", fontSize: 12.5, color: MAROON, textAlign: "center" }}>
          The Chamber of Food &amp; Agriculture is one of the largest organisations working with government authorities and civil society for the betterment and protection of the farmer community.
        </div>
        <div style={{ fontFamily: "Garamond", fontStyle: "italic", fontWeight: 600, fontSize: 12.5, color: MAROON }}>We are united for the rights and protection of the farmer community.</div>
      </div>
    </Page>
  );
}

export async function renderNotification(m: NotificationMemberData, n: NotificationRecord, format: DocFormat, president?: string, theme: DocThemeKey = DEFAULT_THEME): Promise<Buffer> {
  const t = DOC_THEMES[theme];
  const a = await loadDocAssets();
  const qr = await qrDataUrl(`${SITE_URL}/verify/${m.id}#notifications`, t.deep);
  return renderDoc(
    <Notification m={m} n={n} t={t} logo={a.logo} signature={a.signature} stamp={a.stamp} glyphs={a.sealGlyphs} qr={qr} president={clean(president) || undefined} />,
    format,
    a.fonts,
    `Notification ${n.number}`,
  );
}
