import { AnimatePresence, motion } from "framer-motion";
import type { PropsWithChildren } from "react";

type ModalProps = PropsWithChildren<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
}>;

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-3 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-white"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 24 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
              <h2 className="text-sm font-semibold text-[var(--ink)]">{title}</h2>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-lg text-[var(--muted)] transition hover:bg-[var(--bg-soft)]"
                aria-label="Close"
              >
                x
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
