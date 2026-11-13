// Chamber notifications (appointments to a post for a period). Shared by the admin form,
// the verification page and the renderer, so nothing here touches the server.

export const HONORIFICS = ["Mr.", "Mrs.", "Ms.", "Dr.", "Engr.", "Ch."] as const;
export const RELATIONS = ["S/O", "D/O", "W/O"] as const;
export type Relation = (typeof RELATIONS)[number];

export interface NotificationRecord {
  id: string;
  number: string;
  honorific: string;
  relation: Relation;
  relativeName: string;
  post: string;
  unit: string;
  from: string; // ISO
  to: string; // ISO
  issuedAt: string; // ISO
}

/** Fields an admin fills in to issue one. */
export interface NotificationInput {
  honorific: string;
  relation: Relation;
  relativeName: string;
  post: string;
  unit: string;
  from: string; // yyyy-mm-dd
  to: string; // yyyy-mm-dd
}

export type NotificationState = "upcoming" | "in-force" | "ended";

const DAY = 24 * 60 * 60 * 1000;

/** In force from the start date through the whole of the end date. */
export function notificationState(n: { from: string | Date; to: string | Date }, now = Date.now()): NotificationState {
  if (new Date(n.from).getTime() > now) return "upcoming";
  return new Date(n.to).getTime() + DAY <= now ? "ended" : "in-force";
}

export const STATE_LABEL: Record<NotificationState, string> = {
  upcoming: "Starts soon",
  "in-force": "In force",
  ended: "Period ended",
};

/** Daughters and wives are "she"; everyone else "he". */
export function pronouns(relation: string) {
  return relation === "S/O" ? { subject: "He", possessive: "his" } : { subject: "She", possessive: "her" };
}

/** A notification as stored on the member document. */
interface StoredNotification {
  _id: unknown;
  number: string;
  honorific?: string;
  relation?: string;
  relativeName?: string;
  post: string;
  unit?: string;
  from: Date | string;
  to: Date | string;
  issuedAt: Date | string;
}

export function toNotificationRecord(n: StoredNotification): NotificationRecord {
  return {
    id: String(n._id),
    number: n.number,
    honorific: n.honorific ?? "",
    relation: (RELATIONS as readonly string[]).includes(n.relation ?? "") ? (n.relation as Relation) : "S/O",
    relativeName: n.relativeName ?? "",
    post: n.post,
    unit: n.unit ?? "",
    from: new Date(n.from).toISOString(),
    to: new Date(n.to).toISOString(),
    issuedAt: new Date(n.issuedAt).toISOString(),
  };
}

/** Newest first. */
export function notificationList(list?: StoredNotification[] | null) {
  return (list ?? []).map(toNotificationRecord).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
}

/** "CFAP/NTF/2026/0007" */
export function notificationNumber(year: number, seq: number) {
  return `CFAP/NTF/${year}/${String(seq).padStart(4, "0")}`;
}
