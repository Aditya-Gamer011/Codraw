"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  CheckCircle2,
  GitBranch,
  GitPullRequest,
  Info,
  Lock,
  UploadCloud,
  X,
} from "lucide-react";

export type ModalState = {
  isOpen: boolean;
  title: string;
  description?: string;
  mode: "input" | "alert" | "confirm";
  icon?: "repo" | "commit" | "pr" | "alert" | "info" | "success";
  placeholder?: string;
  defaultValue?: string;
  showCheckbox?: boolean;
  checkboxLabel?: string;
  defaultCheckboxValue?: boolean;
  confirmText?: string;
  cancelText?: string;
  variant?: "primary" | "danger" | "success";
  onResolve?: (result: { confirmed: boolean; text: string; checkbox: boolean }) => void;
};

type Props = {
  modal: ModalState | null;
  onClose: () => void;
};

export default function CustomModal({ modal, onClose }: Props) {
  const [text, setText] = useState("");
  const [checkbox, setCheckbox] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [prevModal, setPrevModal] = useState(modal);
  if (prevModal !== modal) {
    setPrevModal(modal);
    if (modal?.isOpen) {
      setText(modal.defaultValue ?? "");
      setCheckbox(modal.defaultCheckboxValue ?? false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (modal?.isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [modal]);

  if (!mounted || !modal || !modal.isOpen) return null;

  function handleConfirm() {
    modal?.onResolve?.({
      confirmed: true,
      text: text.trim(),
      checkbox,
    });
    onClose();
  }

  function handleCancel() {
    modal?.onResolve?.({
      confirmed: false,
      text: "",
      checkbox: false,
    });
    onClose();
  }

  function getIcon() {
    switch (modal?.icon) {
      case "repo":
        return <GitBranch className="h-5 w-5 text-sky-400" />;
      case "commit":
        return <UploadCloud className="h-5 w-5 text-emerald-400" />;
      case "pr":
        return <GitPullRequest className="h-5 w-5 text-purple-400" />;
      case "alert":
        return <AlertCircle className="h-5 w-5 text-amber-400" />;
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
      default:
        return <Info className="h-5 w-5 text-blue-400" />;
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-xl transition-opacity animate-fadeIn"
        onClick={handleCancel}
      />
      <div className="relative z-10 w-full max-w-md transform overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-zinc-900/90 via-zinc-950/95 to-zinc-950 p-6 text-left shadow-[0_25px_60px_rgba(0,0,0,0.8)] backdrop-blur-3xl transition-all animate-scaleUp">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 shadow-inner">
              {getIcon()}
            </div>
            <div>
              <h3 className="text-base font-semibold leading-6 text-white tracking-wide">
                {modal.title}
              </h3>
              {modal.description && (
                <p className="mt-0.5 text-xs text-zinc-400">
                  {modal.description}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleCancel}
            className="rounded-full p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Input Field */}
        {modal.mode === "input" && (
          <div className="mt-5 space-y-4">
            <div>
              <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={modal.placeholder ?? "Type here..."}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleConfirm();
                  } else if (e.key === "Escape") {
                    handleCancel();
                  }
                }}
                className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:border-sky-500 focus:bg-black/80 focus:ring-1 focus:ring-sky-500/50 shadow-inner"
              />
            </div>

            {modal.showCheckbox && (
              <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 cursor-pointer select-none hover:bg-white/10 transition">
                <input
                  type="checkbox"
                  checked={checkbox}
                  onChange={(e) => setCheckbox(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-black/50 text-sky-500 focus:ring-sky-500 focus:ring-offset-zinc-950"
                />
                <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
                  <Lock size={13} className="text-zinc-400" />
                  {modal.checkboxLabel ?? "Make private"}
                </div>
              </label>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3">
          {modal.mode !== "alert" && (
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-full border border-white/10 bg-white/5 px-4.5 py-2.5 text-xs font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white active:scale-95"
            >
              {modal.cancelText ?? "Cancel"}
            </button>
          )}

          <button
            type="button"
            onClick={handleConfirm}
            className={`flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold text-white shadow-lg transition active:scale-95 ${
              modal.variant === "danger"
                ? "bg-red-600 hover:bg-red-500 shadow-red-600/30"
                : modal.variant === "success"
                ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30"
                : "bg-sky-500 hover:bg-sky-400 shadow-sky-500/30"
            }`}
          >
            {modal.confirmText ?? (modal.mode === "alert" ? "OK" : "Submit")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
