import { cn } from "../utils/cn";

type ChatBubbleProps = {
  from: "customer" | "staff";
  text: string;
  time: string;
};

export function ChatBubble({ from, text, time }: ChatBubbleProps) {
  const isCustomer = from === "customer";

  return (
    <div className={cn("flex", isCustomer ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[82%] rounded-2xl px-3 py-2.5 text-sm shadow-sm",
          isCustomer
            ? "rounded-br-sm bg-[var(--brand-1)] text-white shadow-orange-200"
            : "rounded-bl-sm border border-[var(--line)] bg-white text-[var(--ink)] shadow-slate-200"
        )}
      >
        <p>{text}</p>
        <p className={cn("mt-1 text-[11px]", isCustomer ? "text-orange-100" : "text-[var(--muted)]")}>{time}</p>
      </div>
    </div>
  );
}
