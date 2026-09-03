import { MembershipCategory } from "@/models/Member";

const categoryStyles: Record<MembershipCategory, string> = {
  Corporate:        "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-100",
  Executive:        "bg-blue-50   text-blue-700   border-blue-200   ring-blue-100",
  Associate:        "bg-violet-50 text-violet-700 border-violet-200 ring-violet-100",
  Overseas:         "bg-sky-50    text-sky-700    border-sky-200    ring-sky-100",
  Women:            "bg-rose-50   text-rose-700   border-rose-200   ring-rose-100",
  Student:          "bg-amber-50  text-amber-700  border-amber-200  ring-amber-100",
  "Honorary Member":"bg-gray-50   text-gray-600   border-gray-200   ring-gray-100",
};

interface Props {
  category: MembershipCategory;
  size?: "sm" | "md";
}

export default function CategoryBadge({ category, size = "sm" }: Props) {
  const styles = categoryStyles[category] ?? "bg-gray-50 text-gray-600 border-gray-200";
  const sizeClass = size === "md"
    ? "text-xs px-3 py-1 font-semibold"
    : "text-[10px] px-2 py-0.5 font-semibold";

  return (
    <span
      className={`inline-flex items-center rounded-md border tracking-wide ${styles} ${sizeClass}`}
    >
      {category}
    </span>
  );
}
