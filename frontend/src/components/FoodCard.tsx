import type { FoodItem } from "../data";
import { useLanguage } from "../context/LanguageContext";
import { useCart } from "../context/CartContext";
import { cn } from "../utils/cn";
import { Button } from "./ui/Button";

type FoodCardProps = {
  item: FoodItem;
  branchLabel: string;
  className?: string;
};

export function FoodCard({ item, branchLabel, className }: FoodCardProps) {
  const { t } = useLanguage();
  const { addItem, openCart } = useCart();

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--panel)] shadow-sm shadow-slate-900/5",
        className
      )}
    >
      <img src={item.image} alt={item.name} loading="lazy" className="h-48 w-full object-cover" />
      <div className="space-y-3 p-4">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">{item.category}</p>
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-[var(--ink)]">{item.name}</h3>
          <span className="text-sm font-semibold text-[var(--primary)]">${item.price.toFixed(2)}</span>
        </div>
        <p className="text-sm leading-relaxed text-[var(--muted)]">{item.description}</p>
        <p className="text-xs text-[var(--muted)]">{t("food.ready", { branch: branchLabel })}</p>
        <Button
          className="w-full"
          variant="secondary"
          onClick={() => {
            addItem(item);
            openCart();
          }}
        >
          {t("food.add")}
        </Button>
      </div>
    </article>
  );
}