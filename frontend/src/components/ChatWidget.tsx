import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useActiveBranchData, useBranch } from "../context/BranchContext";
import { useLanguage } from "../context/LanguageContext";
import { getSocket } from "../lib/socket";
import { ChatBubble } from "./ChatBubble";
import { Modal } from "./ui/Modal";

type Message = {
  id: number;
  from: "customer" | "staff";
  text: string;
  time: string;
};

interface BackendMessage {
  from: "customer" | "reception";
  text: string;
  createdAt: string;
}

function getOrCreateCustomerId(): string {
  let id = localStorage.getItem("csl_customer_id");
  if (!id) {
    id = "cust_" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem("csl_customer_id", id);
  }
  return id;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// Map backend "reception" to widget "staff"
function toWidgetMessage(msg: BackendMessage, idx: number): Message {
  return {
    id: Date.now() + idx,
    from: msg.from === "reception" ? "staff" : "customer",
    text: msg.text,
    time: formatTime(msg.createdAt),
  };
}

export function ChatWidget() {
  const branch = useActiveBranchData();
  const { selectedBranch } = useBranch();
  const { language, t } = useLanguage();

  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [customerName, setCustomerName] = useState(
    () => localStorage.getItem("csl_customer_name") ?? ""
  );
  const [nameEntered, setNameEntered] = useState(Boolean(customerName));
  const [connected, setConnected] = useState(false);

  const customerId = useMemo(getOrCreateCustomerId, []);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Localized text
  const emptyStateText =
    language === "fr"
      ? "Dites bonjour pour commencer la conversation !"
      : language === "rw"
        ? "Vuga muraho kugira ngo utangire ikiganiro!"
        : "Say hi to start the conversation!";

  const sayHiText =
    language === "fr" ? "👋 Bonjour" : language === "rw" ? "👋 Muraho" : "👋 Say Hi";

  const namePromptText =
    language === "fr"
      ? "Entrez votre nom pour commencer"
      : language === "rw"
        ? "Andika izina ryawe kugira ngo utangire"
        : "Please enter your name to start";

  const startChatText =
    language === "fr" ? "Commencer" : language === "rw" ? "Tangira" : "Start Chat";

  // Connect to socket when opened and name is entered
  useEffect(() => {
    if (!open || !nameEntered) return;

    const socket = getSocket();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    if (socket.connected) setConnected(true);

    socket.emit("customer:join", {
      branchId: selectedBranch,
      customerId,
      customerName,
    });

    const onHistory = (chat: { messages?: BackendMessage[] } | null) => {
      const history = chat?.messages ?? [];
      setMessages(history.map(toWidgetMessage));
    };

    const onMessage = (msg: BackendMessage) => {
      setMessages((prev) => [...prev, toWidgetMessage(msg, prev.length)]);
    };

    socket.on("chat:history", onHistory);
    socket.on("chat:message", onMessage);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("chat:history", onHistory);
      socket.off("chat:message", onMessage);
    };
  }, [open, nameEntered, selectedBranch, customerId, customerName]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (messageText?: string) => {
    const finalText = (messageText ?? text).trim();
    if (!finalText) return;

    getSocket().emit("customer:message", {
      branchId: selectedBranch,
      customerId,
      customerName,
      text: finalText,
    });

    setText("");
  };

  const handleSayHi = () => {
    const hiText =
      language === "fr" ? "Bonjour !" : language === "rw" ? "Muraho!" : "Hi!";
    sendMessage(hiText);
  };

  const saveName = () => {
    const trimmed = customerName.trim();
    if (!trimmed) return;
    localStorage.setItem("csl_customer_name", trimmed);
    setNameEntered(true);
  };

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 h-12 rounded-xl bg-[var(--brand-1)] px-4 text-sm font-medium text-white shadow-lg shadow-orange-500/20"
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
      >
        {t("chat.widget", { city: branch.city })}
      </motion.button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={t("chat.modal", { city: branch.city })}
      >
        <div className="space-y-3 p-4 bg-[var(--card)] text-[var(--ink)]">
          {/* Connection status */}
          {nameEntered && (
            <div className="flex justify-end">
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  connected
                    ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                    : "bg-[var(--bg-soft)] text-[var(--muted)] border border-[var(--line)]"
                }`}
              >
                {connected ? "● Live" : "○ Connecting..."}
              </span>
            </div>
          )}

          {/* Name prompt */}
          {!nameEntered ? (
            <div className="space-y-3 py-4">
              <p className="text-sm text-[var(--muted)] text-center">{namePromptText}</p>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveName()}
                placeholder={language === "fr" ? "Votre nom" : language === "rw" ? "Izina ryawe" : "Your name"}
                className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg,var(--card))] text-[var(--ink)] placeholder:text-[var(--muted)] px-4 text-sm outline-none focus:ring-2 focus:ring-[var(--brand-1)]"
                autoFocus
              />
              <button
                onClick={saveName}
                className="h-11 w-full rounded-xl bg-[var(--brand-1)] text-sm font-medium text-white hover:bg-[var(--brand-2)] transition"
              >
                {startChatText}
              </button>
            </div>
          ) : (
            <>
              {/* Messages area */}
              <div className="h-72 space-y-3 overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--bg-soft)] p-3">
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                    <div className="text-5xl">💬</div>
                    <p className="text-sm text-[var(--muted)]">{emptyStateText}</p>
                    <button
                      onClick={handleSayHi}
                      className="rounded-xl bg-[var(--brand-1)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-2)] transition"
                    >
                      {sayHiText}
                    </button>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <ChatBubble
                        key={message.id}
                        from={message.from}
                        text={message.text}
                        time={message.time}
                      />
                    ))}
                    <div ref={bottomRef} />
                  </>
                )}
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <input
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") sendMessage();
                  }}
                  placeholder={t("chat.input")}
                  className="h-11 flex-1 rounded-xl border border-[var(--line)] bg-[var(--input-bg,var(--card))] text-[var(--ink)] placeholder:text-[var(--muted)] px-4 text-sm outline-none focus:ring-2 focus:ring-[var(--brand-1)]"
                />
                <button
                  onClick={() => sendMessage()}
                  className="h-11 rounded-xl bg-[var(--brand-1)] px-4 text-sm font-medium text-white hover:bg-[var(--brand-2)]"
                >
                  {t("chat.send")}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}