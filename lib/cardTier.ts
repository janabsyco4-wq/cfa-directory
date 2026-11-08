export type CardTier = "gold" | "silver";

/** Associate and Student members carry the gold card; every other category gets silver. */
export function cardTier(category?: string): CardTier {
  return category === "Associate" || category === "Student" ? "gold" : "silver";
}
