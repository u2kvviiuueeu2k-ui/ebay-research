import { ProductPattern } from "@/types";
import { PATTERN_LABELS } from "@/lib/mock-data";

export default function PatternBadge({ pattern }: { pattern: ProductPattern }) {
  const { label, color, desc } = PATTERN_LABELS[pattern];
  return (
    <span className={`inline-flex flex-col items-center px-2 py-1 rounded-md text-xs font-semibold ${color}`}>
      {label}
      <span className="font-normal text-[10px]">{desc}</span>
    </span>
  );
}
