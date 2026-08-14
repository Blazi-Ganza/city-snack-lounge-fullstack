import { useEffect, useMemo, useRef, useState } from "react";
import { useBranch } from "../context/BranchContext";
import { useLanguage } from "../context/LanguageContext";
import { getSocket } from "../lib/socket";

interface ChatMessage {
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

export function ChatPage() {
  const { selectedBranch, branchData } = useBranch();
  const { language, t } = useLanguage();

  const branchId = selectedBranch;
  const branchName = branchData?.name ?? selectedBranch;

  const customerId = useMemo(getOrCreateCustomerId, []);
  const [customerName, setCustomerName] = useState(
    () => localStorage.getItem("csl_customer_name") ?? ""
  );
  const [nameEntered, setNameEntered] = useState(Boolean(customerName));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const copy = {
    intro:
      language === "rw"
        ? "Andika amazina yawe kugira ngo utangire kuganira."
        : language === "fr"
          ? "Veuillez entrer votre nom pour commencer."
          : "Please enter your name to start.",
    namePlaceholder:
      language === "rw"
        ? "Amazina yawe"
        : language === "fr"
          ? "Votre nom"
          : "Your name",
    start:
      language === "rw"
        ? "Tangira kuganira"
        : language === "fr"
          ? "Commencer le chat"
          : "Start Chat",
    live:
      language === "rw"
        ? "● Turahari"
        : language === "fr"
          ? "● En ligne"
          : "● Live",
    connecting:
      language === "rw"
        ? "○ Birahuza..."
        : language === "fr"
          ? "○ Connexion..."
          : "○ Connecting...",
    empty:
      language === "rw"
        ? "Tangira utwandikira 👋"
        : language === "fr"
          ? "Dites bonjour pour commencer 👋"
          : "Say hi to start the conversation 👋",
  };

  useEffect(() => {
    if (!nameEntered) return;

    const socket = getSocket();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    if (socket.connected) {
      setConnected(true);
    }

    socket.emit("customer:join", {
      branchId,
      customerId,
      customerName,
    });

    const onHistory = (chat: { messages?: ChatMessage[] } | null) => {
      setMessages(chat?.messages ?? []);
    };

    const onMessage = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("chat:history", onHistory);
    socket.on("chat:message", onMessage);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("chat:history", onHistory);
      socket.off("chat:message", onMessage);
    };
  }, [nameEntered, branchId, customerId, customerName]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage() {
    const text = draft.trim();
    if (!text) return;

    getSocket().emit("customer:message", {
      branchId,
      customerId,
      customerName,
      text,
    });

    setDraft("");
  }

  function saveName() {
    const trimmed = customerName.trim();
    if (!trimmed) return;

    localStorage.setItem("csl_customer_name", trimmed);
    setCustomerName(trimmed);
    setNameEntered(true);
  }

  if (!nameEntered) {
    return (
      <main className="min-h-screen bg-[var(--bg-soft)] px-4 py-16 sm:px-6">
        <section className="mx-auto max-w-md">
          <div className="relative overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
            <img
              src="/images/city-snack-logo.png"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -right-8 -top-8 w-40 select-none opacity-[0.05]"
            />

            <div className="relative">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--primary)]">
                {branchName}
              </p>

              <h1 className="font-display mt-3 text-3xl font-semibold text-[var(--ink)]">
                {t("chat.title")}
              </h1>

              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                {copy.intro}
              </p>

              <div className="mt-6">
                <label
                  htmlFor="customer-name"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]"
                >
                  {t("reservation.name")}
                </label>

                <input
                  id="customer-name"
                  className="h-12 w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-4 text-sm text-[var(--ink)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
                  placeholder={copy.namePlaceholder}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      saveName();
                    }
                  }}
                  autoFocus
                />
              </div>

              <button
                onClick={saveName}
                className="mt-4 h-12 w-full rounded-xl bg-[var(--primary)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)]"
              >
                {copy.start}
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg-soft)] px-4 py-10 sm:px-6">
      <section className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--primary)]">
              {branchName}
            </p>

            <h1 className="font-display mt-2 text-3xl font-semibold text-[var(--ink)] sm:text-4xl">
              {t("chat.title")}
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
              {t("chat.subtitle", { branch: branchName })}
            </p>
          </div>

          <span
            className={`inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${
              connected
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "border-[var(--line)] bg-[var(--card)] text-[var(--muted)]"
            }`}
          >
            {connected ? copy.live : copy.connecting}
          </span>
        </div>

        {/* Chat Card */}
        <div className="relative overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--card)] shadow-sm">
          <img
            src="/images/city-snack-logo.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 w-72 select-none opacity-[0.035]"
          />

          {/* Messages */}
          <div className="relative h-[480px] overflow-y-auto bg-[var(--bg-soft)]/60 p-4 sm:p-6">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--card)] px-6 py-5 text-center">
                  <div className="text-3xl">💬</div>
                  <p className="mt-3 text-sm font-medium text-[var(--muted)]">
                    {copy.empty}
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => {
                const isCustomer = message.from === "customer";

                return (
                  <div
                    key={`${message.createdAt}-${index}`}
                    className={`mb-3 flex ${
                      isCustomer ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                        isCustomer
                          ? "rounded-br-md bg-[var(--primary)] text-white"
                          : "rounded-bl-md border border-[var(--line)] bg-[var(--card)] text-[var(--ink)]"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">
                        {message.text}
                      </p>

                      {message.createdAt ? (
                        <p
                          className={`mt-1 text-[10px] ${
                            isCustomer ? "text-white/70" : "text-[var(--muted)]"
                          }`}
                        >
                          {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}

            <div ref={bottomRef} />
          </div>

          {/* Composer */}
          <div className="relative border-t border-[var(--line)] bg-[var(--card)] p-4">
            <div className="flex gap-2">
              <input
                className="h-12 flex-1 rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-4 text-sm text-[var(--ink)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
                placeholder={t("chat.input")}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />

              <button
                onClick={sendMessage}
                disabled={!draft.trim()}
                className="h-12 rounded-xl bg-[var(--primary)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50 sm:px-7"
              >
                {t("chat.send")}
              </button>
            </div>

            <p className="mt-2 text-center text-[11px] text-[var(--muted)]">
              {connected
                ? language === "rw"
                  ? "Ubutumwa bwawe bwoherezwa ako kanya."
                  : language === "fr"
                    ? "Vos messages sont envoyés en direct."
                    : "Your messages are sent in real time."
                : language === "rw"
                  ? "Turagerageza kongera guhuza..."
                  : language === "fr"
                    ? "Tentative de reconnexion..."
                    : "Trying to reconnect..."}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}