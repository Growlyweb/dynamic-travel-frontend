import { Building2, Receipt, CreditCard, AlertCircle } from "lucide-react";
import { formatNumber } from "@/utils/formatters";
import { cn } from "@/utils/helpers";

export default function SummaryCards({ summary }) {
  const {
    totalVendors = 0,
    totalBilled = 0,
    totalPaid = 0,
    totalDue = 0,
  } = summary || {};

  const cards = [
    {
      label: "Active Vendors",
      value: formatNumber(totalVendors),
      subtext: "Vendors configured",
      icon: Building2,
      color: "text-primary",
      bg: "bg-primary-soft border-primary/20",
    },
    {
      label: "Total Billed",
      value: `৳${formatNumber(totalBilled)}`,
      subtext: "Includes bills + opening due",
      icon: Receipt,
      color: "text-amber-600",
      bg: "bg-amber-50 border-amber-200/60 dark:bg-amber-950/40 dark:border-amber-800/40",
    },
    {
      label: "Total Paid",
      value: `৳${formatNumber(totalPaid)}`,
      subtext: "Total payments made",
      icon: CreditCard,
      color: "text-emerald-600",
      bg: "bg-emerald-50 border-emerald-200/60 dark:bg-emerald-950/40 dark:border-emerald-800/40",
    },
    {
      label: "Total Due",
      value: `৳${formatNumber(Math.abs(totalDue))}`,
      subtext:
        totalDue > 0
          ? "Net amount owed to vendors"
          : totalDue < 0
            ? "Net advance with vendors"
            : "All accounts settled",
      icon: AlertCircle,
      color:
        totalDue > 0
          ? "text-rose-600"
          : totalDue < 0
            ? "text-blue-600"
            : "text-emerald-600",
      bg:
        totalDue > 0
          ? "bg-rose-50 border-rose-200/60 dark:bg-rose-950/40 dark:border-rose-800/40"
          : totalDue < 0
            ? "bg-blue-50 border-blue-200/60 dark:bg-blue-950/40 dark:border-blue-800/40"
            : "bg-emerald-50 border-emerald-200/60 dark:bg-emerald-950/40 dark:border-emerald-800/40",
      badge:
        totalDue > 0
          ? "Outstanding Due"
          : totalDue < 0
            ? "Advance Credit"
            : "Fully Settled",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-white border border-border rounded-xl p-4.5 shadow-xs transition-all hover:shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className={cn("p-2.5 rounded-xl border shrink-0", card.bg)}>
                <Icon className={cn("size-5", card.color)} />
              </div>
              <div className="flex-1 pl-4">
                <p className="text-xs font-medium text-muted-foreground">
                  {card.label}
                </p>
                <h3
                  className={cn(
                    "text-2xl font-bold mt-1 tracking-tight",
                    card.color,
                  )}
                >
                  {card.value}
                </h3>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{card.subtext}</span>
              {card.badge && (
                <span
                  className={cn(
                    "font-medium text-[11px] px-1.5 py-0.5 rounded",
                    card.bg,
                    card.color,
                  )}
                >
                  {card.badge}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
