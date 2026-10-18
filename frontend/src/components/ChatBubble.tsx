import { cn } from "../utils/cn";

type ChatBubbleProps = {
  from: "customer" | "staff";
  text: string;
  time: string;
};

export function ChatBubble({ from, text, time }: { from: "customer" | "staff"; text: string; time: string }) {
  const isCustomer = from === "customer";

  return (
    <div className={`flex ${isCustomer ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
          isCustomer
            ? "rounded-br-md bg-[var(--brand-1)] text-white"
            : "rounded-bl-md border border-[var(--line)] bg-[var(--card)] text-[var(--ink)]"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{text}</p>
        <p className={`mt-1 text-[10px] ${isCustomer ? "text-white/70" : "text-[var(--muted)]"}`}>
          {time}
        </p>
      </div>
    </div>
  );
}