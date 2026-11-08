// Tidies what admins type into the member form: extra spaces and commas go, a few known
// misspellings are corrected, and words get a capital first letter. Text typed ALL IN CAPITALS
// or all in small letters is redone in Title Case; in mixed text only the words that start with
// a small letter change, so "ABC traders" becomes "ABC Traders".

// Joining words that stay small inside a phrase ("Chamber of Food and Agriculture").
const SMALL_WORDS = new Set(["a", "an", "and", "at", "by", "for", "in", "of", "on", "or", "the", "to", "bin", "ul", "ud", "ur"]);

// Misspellings seen in member records, matched as whole words.
const SPELLINGS: [RegExp, string][] = [
  [/\bjehlum\b/gi, "Jhelum"],
  [/\bjhelumum\b/gi, "Jhelum"],
  [/\bcapter\b/gi, "Chapter"],
  [/\bsecretory\b/gi, "Secretary"],
];

function capitalise(word: string) {
  // "P.O", "G.T.S" and "B-I-1156" keep each part's first letter large.
  return word.toLowerCase().replace(/(^|[.\-/])([a-z])/g, (_, sep: string, c: string) => sep + c.toUpperCase());
}

/** Title Case; with `onlySmall`, words already holding a capital are kept as typed. */
function titleCase(text: string, onlySmall: boolean) {
  let first = true;
  return text.replace(/[A-Za-z0-9][\w.'\-/]*/g, (word) => {
    const small = !first && SMALL_WORDS.has(word.toLowerCase());
    first = false;
    if (small) return word.toLowerCase();
    return onlySmall && !/^[a-z]/.test(word) ? word : capitalise(word);
  });
}

export function tidyText(value: string) {
  let text = value
    .split("\n")
    .map((line) => line
      .replace(/[ \t]+/g, " ")
      .replace(/(\s*,)+\s*/g, ", ")
      .replace(/\s*&\s*/g, " & ")
      .replace(/^, |, ?$/g, (m) => m.trim())
      .trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const letters = text.replace(/[^A-Za-z]/g, "");
  if (letters) text = titleCase(text, letters !== letters.toUpperCase() && letters !== letters.toLowerCase());
  for (const [wrong, right] of SPELLINGS) text = text.replace(wrong, right);
  return text;
}
