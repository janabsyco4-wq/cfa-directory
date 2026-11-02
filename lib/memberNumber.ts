// Membership card numbers follow the official member portal (members.cfapak.org):
// letters and digits only, upper-case, at most 16 characters, shown in groups of four,
// e.g. "CMCN 0092 CFAP 0007". Kept free of server imports so forms can use it.
export const MEMBER_NO_EXAMPLE = "CMCN 0092 CFAP 0007";

export function formatMemberNo(raw: string): string {
  return raw
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 16)
    .replace(/(.{4})(?=.)/g, "$1 ");
}
