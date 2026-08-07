"use client";

import { useMemo, useRef, useState } from "react";
import {
  Check,
  File,
  FileAudio,
  FileCode2,
  FileImage,
  FileText,
  FileVideo,
  FolderOpen,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { useEditorStore } from "@/lib/editorStore";
import CustomModal, { ModalState } from "@/components/Modal/CustomModal";

type ComponentNode = {
  id: string;
  name: string;
  tag: string;
  selector: string;
};

function getUniqueSelector(el: Element): string {
  if (!el || el.nodeType !== Node.ELEMENT_NODE) return "";

  const path: string[] = [];
  let curr: Element | null = el;

  while (
    curr &&
    curr.nodeType === Node.ELEMENT_NODE &&
    curr.tagName.toLowerCase() !== "body" &&
    curr.tagName.toLowerCase() !== "html"
  ) {
    const parent: Element | null = curr.parentElement;
    if (!parent) break;

    const currTag = curr.tagName.toLowerCase();
    const siblings = (Array.from(parent.children) as Element[]).filter(
      (c) => c.tagName.toLowerCase() === currTag
    );
    const index = Math.max(1, siblings.indexOf(curr) + 1);

    path.unshift(`${currTag}:nth-of-type(${index})`);
    curr = parent;
  }

  // Anchor at body to guarantee uniqueness
  if (path.length > 0) {
    path.unshift("body");
  }

  return path.join(" > ");
}

function parseComponentTree(htmlContent?: string): ComponentNode[] {
  if (typeof window === "undefined" || typeof DOMParser === "undefined" || !htmlContent || !htmlContent.trim()) return [];

  const nodes: ComponentNode[] = [];
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");

    const targets = doc.querySelectorAll(
      "header, nav, main, section, footer, form, article, aside, button, [id], .hero, .navbar, .footer, .card"
    );

    targets.forEach((el, index) => {
      const tag = el.tagName.toLowerCase();
      const idAttr = el.id ? `#${el.id}` : "";
      const firstClass =
        el.className && typeof el.className === "string"
          ? el.className.trim().split(/\s+/)[0]
          : "";
      const classAttr = firstClass ? `.${firstClass}` : "";

      const selector = getUniqueSelector(el);

      let labelName = tag.toUpperCase();
      if (tag === "header") labelName = "Header";
      else if (tag === "nav") labelName = "Navbar";
      else if (tag === "main") labelName = "Main";
      else if (tag === "section") labelName = "Section";
      else if (tag === "footer") labelName = "Footer";
      else if (tag === "button") labelName = `Button (${el.textContent?.trim().slice(0, 15) || "action"})`;
      else if (tag === "form") labelName = "Form";

      if (idAttr) labelName += ` ${idAttr}`;
      else if (classAttr) labelName += ` ${classAttr}`;

      nodes.push({
        id: `comp_${index}_${tag}`,
        name: labelName,
        tag,
        selector,
      });
    });
  } catch (err) {
    console.error("Component tree parse error:", err);
  }

  return nodes.slice(0, 20);
}

function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() || "";

  if (["png", "jpg", "jpeg", "svg", "gif", "webp", "ico", "bmp"].includes(ext)) {
    return <FileImage size={15} className="text-emerald-400 shrink-0" />;
  }

  if (["mp3", "wav", "ogg", "flac", "m4a"].includes(ext)) {
    return <FileAudio size={15} className="text-purple-400 shrink-0" />;
  }

  if (["mp4", "webm", "ogv", "mov"].includes(ext)) {
    return <FileVideo size={15} className="text-rose-400 shrink-0" />;
  }

  if (["json", "txt", "md", "csv"].includes(ext)) {
    return <FileText size={15} className="text-amber-400 shrink-0" />;
  }

  if (["html", "css", "js", "ts", "jsx", "tsx"].includes(ext)) {
    return <FileCode2 size={15} className="text-blue-400 shrink-0" />;
  }

  return <File size={15} className="text-zinc-400 shrink-0" />;
}

export default function FileExplorer() {
  const files = useEditorStore((s) => s.files);
  const selectedFile = useEditorStore((s) => s.selectedFile);
  const openFile = useEditorStore((s) => s.openFile);
  const addFile = useEditorStore((s) => s.addFile);
  const deleteFile = useEditorStore((s) => s.deleteFile);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [modalState, setModalState] = useState<ModalState | null>(null);

  // Inline New File State
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState("");

  const components = useMemo(() => {
    const htmlContent = files["index.html"] || Object.values(files).find((c) => c.includes("<html") || c.includes("<body>"));
    return parseComponentTree(htmlContent);
  }, [files]);

  function handleStartNewFile() {
    setIsCreatingFile(true);
    setNewFileName("");
  }

  function handleConfirmNewFile() {
    const trimmed = newFileName.trim();
    if (trimmed) {
      addFile(trimmed, "");
    }
    setIsCreatingFile(false);
    setNewFileName("");
  }

  function handleCancelNewFile() {
    setIsCreatingFile(false);
    setNewFileName("");
  }

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const uploaded = e.target.files;
    if (!uploaded || uploaded.length === 0) return;

    for (let i = 0; i < uploaded.length; i++) {
      const file = uploaded[i];
      const filename = file.name;
      const isBinary =
        file.type.startsWith("image/") ||
        file.type.startsWith("audio/") ||
        file.type.startsWith("video/") ||
        file.type.startsWith("font/") ||
        Boolean(file.name.match(/\.(png|jpe?g|gif|webp|ico|svg|mp3|wav|ogg|mp4|webm|woff2?|ttf|eot)$/i));

      if (isBinary && !file.type.startsWith("image/svg+xml")) {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            addFile(filename, reader.result);
          }
        };
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            addFile(filename, reader.result);
          }
        };
        reader.readAsText(file);
      }
    }

    e.target.value = "";
  }

  function handleDelete(filename: string, e: React.MouseEvent) {
    e.stopPropagation();

    setModalState({
      isOpen: true,
      title: "Delete File",
      description: `Are you sure you want to delete "${filename}"? This action cannot be undone.`,
      mode: "confirm",
      icon: "alert",
      variant: "danger",
      confirmText: "Delete",
      cancelText: "Cancel",
      onResolve: (res) => {
        setModalState(null);
        if (res.confirmed) {
          deleteFile(filename);
        }
      },
    });
  }

  function highlightComponent(selector: string, tag: string) {
    window.postMessage({ type: "CODRAW_SELECT_COMPONENT", selector, tag }, "*");
    const iframe = document.querySelector("iframe") as HTMLIFrameElement | null;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: "CODRAW_SELECT_COMPONENT", selector, tag }, "*");
    }
  }

  const fileList = Object.keys(files).sort((a, b) => {
    if (a === "index.html") return -1;
    if (b === "index.html") return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="sleek-panel flex h-full flex-col border-r p-4 text-zinc-100">
      <CustomModal
        modal={modalState}
        onClose={() => setModalState(null)}
      />

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Project Files Header */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
          <FolderOpen size={15} className="text-zinc-300" />
          Project Files
        </h2>

        <div className="flex items-center gap-1">
          <button
            onClick={handleStartNewFile}
            className="sleek-button grid h-7 w-7 place-items-center rounded border text-zinc-300 hover:text-white"
            title="New File"
          >
            <Plus size={14} />
          </button>

          <button
            onClick={handleUploadClick}
            className="sleek-button flex h-7 items-center gap-1 rounded border px-2 text-xs font-medium text-zinc-300 hover:text-white"
            title="Upload Asset (Image, Audio, Video, Code)"
          >
            <Upload size={13} />
            Upload
          </button>
        </div>
      </div>

      {/* Inline File Creation Row inside Project Files */}
      {isCreatingFile && (
        <div className="mb-2 flex items-center gap-1.5 rounded-lg border border-sky-500/50 bg-zinc-900/90 p-1.5 shadow-lg backdrop-blur-md">
          {getFileIcon(newFileName || "index.html")}
          <input
            type="text"
            autoFocus
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleConfirmNewFile();
              if (e.key === "Escape") handleCancelNewFile();
            }}
            placeholder="e.g. style.css"
            className="flex-1 bg-transparent px-1 py-0.5 font-mono text-xs text-white placeholder-zinc-500 outline-none"
          />
          <button
            onClick={handleConfirmNewFile}
            className="grid h-6 w-6 place-items-center rounded bg-sky-500 text-white transition hover:bg-sky-400"
            title="Create File (Enter)"
          >
            <Check size={12} />
          </button>
          <button
            onClick={handleCancelNewFile}
            className="grid h-6 w-6 place-items-center rounded bg-zinc-800 text-zinc-400 transition hover:bg-zinc-700 hover:text-white"
            title="Cancel (Esc)"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Project Files List (Fixed ratio, scrollable) */}
      <div className="flex flex-col h-1/2 min-h-[100px] overflow-hidden">
        <div className="flex-1 space-y-1 overflow-y-auto pr-1">
          {fileList.length === 0 && !isCreatingFile ? (
            <div className="py-4 px-2 text-center text-xs text-zinc-500">
              No files in project.<br />Click <strong className="text-zinc-400">+</strong> to create a file or <strong className="text-zinc-400">Upload</strong> to add assets.
            </div>
          ) : (
            fileList.map((file) => {
              const isSelected = selectedFile === file;

              return (
                <div
                  key={file}
                  onClick={() => openFile(file)}
                  className={`group flex w-full cursor-pointer items-center justify-between rounded px-3 py-2 text-sm transition ${
                    isSelected
                      ? "sleek-button-active"
                      : "text-zinc-400 hover:bg-zinc-800/80 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    {getFileIcon(file)}
                    <span className="truncate font-mono text-xs">{file}</span>
                  </div>

                  <button
                    onClick={(e) => handleDelete(file, e)}
                    className="hidden h-5 w-5 place-items-center rounded text-zinc-500 hover:bg-red-500/20 hover:text-red-400 group-hover:grid"
                    title={`Delete ${file}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Separator Divider Line - Always visible across all screen sizes */}
      <div className="relative my-3 flex items-center justify-center shrink-0">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-700/70" />
        </div>
        <div className="relative bg-zinc-900 px-2 text-[10px] font-semibold text-zinc-500 tracking-wider uppercase">
          Components
        </div>
      </div>

      {/* Component Tree Section */}
      <div className="flex flex-col h-1/2 min-h-[100px] overflow-hidden shrink-0">
        <div className="flex-1 space-y-1 overflow-y-auto pr-1">
          {components.length === 0 ? (
            <div className="py-2 px-2 text-center text-xs text-zinc-500">
              No HTML components detected.
            </div>
          ) : (
            components.map((comp) => (
              <div
                key={comp.id}
                onClick={() => highlightComponent(comp.selector, comp.tag)}
                className="group flex w-full cursor-pointer items-center justify-between rounded px-3 py-1.5 text-xs text-zinc-400 transition hover:bg-cyan-950/40 hover:text-cyan-300 border border-transparent hover:border-cyan-800/50"
                title={`Highlight ${comp.selector} in canvas`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="font-mono text-[10px] text-cyan-400 font-bold uppercase">&lt;{comp.tag}&gt;</span>
                  <span className="truncate">{comp.name}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
