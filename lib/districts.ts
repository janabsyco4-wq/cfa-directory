// Stored districts vary in case and spacing ("Jhelum", "JHELUM", "Jhelum "), so the admin
// filter lists one tidy name for each and matches every spelling of it.

export function tidyDistrict(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

/** One display name per district, A to Z. */
export function districtOptions(stored: unknown[]): string[] {
  const names = stored.filter((v): v is string => typeof v === "string").map(tidyDistrict).filter(Boolean);
  return [...new Set(names)].sort((a, b) => a.localeCompare(b));
}

/** Mongo condition matching any of these districts, however each was typed. */
export function districtCondition(names: string[]) {
  const options = names.map((name) => name.trim().split(/\s+/).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("\\s+"));
  return { $regex: `^\\s*(${options.join("|")})\\s*$`, $options: "i" };
}

/** The districts asked for in a query: tidy, without blanks or repeats, and a sane number of them. */
export function requestedDistricts(params: URLSearchParams) {
  return districtOptions(params.getAll("district").map((d) => d.slice(0, 100))).slice(0, 100);
}

/** Names a download: "All", one district, a few joined, or a count once the names get long. */
export function districtsLabel(names: string[]) {
  if (!names.length) return "All";
  return names.length <= 3 ? names.join("-") : `${names.length}-Districts`;
}
