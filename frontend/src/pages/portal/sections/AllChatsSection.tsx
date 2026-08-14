import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, MessageSquare, User, X } from "lucide-react";
import { useAdminChats, type AdminChat } from "../../../hooks/useAdminData";
import { cn } from "../../../utils/cn";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const STATUS_META: Record<
  AdminChat["status"],
  { label: string; className: string }
> = {
  new: { label: "New", className: "bg-[var(--primary)] text-white" },
  in_progress: {
    label: "Active",
    className: "bg-[var(--success)] text-white",
  },
  closed: {
    label: "Closed",
    className: "bg-[var(--bg-soft)] text-[var(--muted)]",
  },
};

export function AllChatsSection({ refreshKey }: { refreshKey: number }) {
  const { data: chats, loading, error } = useAdminChats(refreshKey);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [selected, setSelected] = useState<AdminChat | null>(null);

  const branches = useMemo(
    () => Array.from(new Set(chats.map((c) => c.branchId))),
    [chats]
  );

  const filtered = useMemo(() => {
    return chats.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (branchFilter !== "all" && c.branchId !== branchFilter) return false;
      if (
        search &&
        !c.customerName.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      return true;
    });
  }, [chats, search, statusFilter, branchFilter]);

  if (loading) {
    return (
      <div className="py-20 text-center text-[var(--muted)]">
        Loading chats...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-[var(--error)]/20 bg-[var(--error)]/10 p-6 text-sm text-[var(--error)]">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
        <div className="relative min-w-[200px] flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer name..."
            className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] pl-9 pr-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--primary)]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm text-[var(--ink)] outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="new">New</option>
          <option value="in_progress">Active</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="h-10 rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-3 text-sm text-[var(--ink)] outline-none"
        >
          <option value="all">All Branches</option>
          {branches.map((b) => (
            <option key={b} value={b}>
              {b.charAt(0).toUpperCase() + b.slice(1)}
            </option>
          ))}
        </select>
        <span className="text-xs text-[var(--muted)]">
          {filtered.length} of {chats.length}
        </span>
      </div>

      {/* Chats grid */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--line)] bg-[var(--card)] py-16 text-center">
          <MessageSquare
            className="mx-auto mb-3 text-[var(--muted)]"
            size={32}
          />
          <p className="text-sm text-[var(--muted)]">No chats found</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((chat) => (
            <ChatCard key={chat._id} chat={chat} onClick={() => setSelected(chat)} />
          ))}
        </div>
      )}

      {/* Chat detail modal */}
      {selected && (
        <ChatDetailModal chat={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function ChatCard({ chat, onClick }: { chat: AdminChat; onClick: () => void }) {
  const lastMsg = chat.messages[chat.messages.length - 1];
  const status = STATUS_META[chat.status];

  return (
    <button
      onClick={onClick}
      className="group text-left rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 transition hover:border-[var(--primary)]/30 hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
            <User size={16} />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-[var(--ink)]">
              {chat.customerName || "Anonymous"}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
              {chat.branchId}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold",
            status.className
          )}
        >
          {status.label}
        </span>
      </div>

      {lastMsg && (
        <div className="mb-3 rounded-xl bg-[var(--bg-soft)] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            {lastMsg.from === "customer" ? "Customer" : "Staff"}
          </p>
          <p className="mt-1 line-clamp-2 text-sm text-[var(--ink)]">
            {lastMsg.text}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-[var(--muted)]">
        <span>{chat.messages.length} messages</span>
        <span>{timeAgo(chat.updatedAt)}</span>
      </div>
    </button>
  );
}

function ChatDetailModal({
  chat,
  onClose,
}: {
  chat: AdminChat;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--card)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--line)] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--primary)] text-white">
              <User size={18} />
            </div>
            <div>
              <h3 className="font-display font-bold text-[var(--ink)]">
                {chat.customerName || "Anonymous"}
              </h3>
              <p className="text-xs uppercase tracking-wider text-[var(--muted)]">
                {chat.branchId} · {chat.status}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[var(--muted)] hover:bg-[var(--card-hover)]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-3 overflow-y-auto bg-[var(--bg-soft)] p-4">
          {chat.messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[80%] rounded-2xl p-3 text-sm",
                m.from === "customer"
                  ? "ml-auto bg-[var(--primary)] text-white"
                  : "border border-[var(--line)] bg-[var(--card)] text-[var(--ink)]"
              )}
            >
              <p>{m.text}</p>
              <p
                className={cn(
                  "mt-1 text-[10px]",
                  m.from === "customer"
                    ? "text-white/70"
                    : "text-[var(--muted)]"
                )}
              >
                {timeAgo(m.createdAt)}
              </p>
            </div>
          ))}
        </div>

        <div className="border-t border-[var(--line)] bg-[var(--card)] p-4 text-center">
          <p className="text-xs text-[var(--muted)]">
            View only — reply from the branch reception dashboard
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}