"use client";

import { useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpToLine,
  Boxes,
  Check,
  Code2,
  CreditCard,
  Heading,
  LayoutGrid,
  LucideIcon,
  MessageSquareQuote,
  MousePointer,
  Plus,
  Search,
  Sparkles,
  Square,
  Type,
} from "lucide-react";
import { useEditorStore } from "@/lib/editorStore";
import { HERO_PREVIEW_TEMPLATE } from "../LiveCanvas/utils/previewBuilder";

type ElementItem = {
  id: string;
  name: string;
  category: "text" | "buttons" | "shapes" | "components";
  description: string;
  icon: LucideIcon;
  snippet: string;
};

const ELEMENT_CATALOG: ElementItem[] = [
  // Typography
  {
    id: "hero-title",
    name: "Hero Display Title",
    category: "text",
    description: "Bold gradient display heading",
    icon: Heading,
    snippet: `<h1 class="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-sky-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">Design The Future</h1>`,
  },
  {
    id: "section-heading",
    name: "Section Heading",
    category: "text",
    description: "Clean section title with subtitle",
    icon: Type,
    snippet: `<div class="space-y-1 my-4">
  <h2 class="text-2xl font-bold text-white">Build Faster Together</h2>
  <p class="text-xs text-zinc-400">Streamline your workflow with real-time visual tools.</p>
</div>`,
  },
  {
    id: "paragraph",
    name: "Body Paragraph",
    category: "text",
    description: "Standard body paragraph text",
    icon: Type,
    snippet: `<p class="text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-md my-2">Experience the next generation of real-time visual web design directly inside your browser.</p>`,
  },
  {
    id: "callout-quote",
    name: "Glass Quote Box",
    category: "text",
    description: "Frosted callout quote block",
    icon: MessageSquareQuote,
    snippet: `<blockquote class="p-4 my-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md text-zinc-300 text-xs sm:text-sm italic">"CoDraw reimagines how teams create interactive visual web apps."</blockquote>`,
  },

  // Buttons & Badges
  {
    id: "primary-button",
    name: "Gradient CTA Button",
    category: "buttons",
    description: "Primary gradient action button",
    icon: MousePointer,
    snippet: `<button class="px-6 py-2.5 rounded-full bg-gradient-to-r from-sky-500 to-purple-600 hover:brightness-110 text-white font-semibold text-xs shadow-lg transition-all my-2">Get Started Now</button>`,
  },
  {
    id: "glass-button",
    name: "Glass Button",
    category: "buttons",
    description: "Translucent frosted button",
    icon: MousePointer,
    snippet: `<button class="px-6 py-2.5 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-semibold text-xs transition-all my-2">Explore Platform</button>`,
  },
  {
    id: "pill-badge",
    name: "Status Pill Badge",
    category: "buttons",
    description: "Animated live status indicator badge",
    icon: Sparkles,
    snippet: `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-400 text-xs font-medium my-2"><span class="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse"></span>LIVE STUDIO</span>`,
  },

  // Shapes & Containers
  {
    id: "glass-card",
    name: "Glass Container",
    category: "shapes",
    description: "Frosted glass card container",
    icon: Square,
    snippet: `<div class="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl space-y-3 my-4">
  <h3 class="text-base font-bold text-white">Glass Container</h3>
  <p class="text-xs text-zinc-400">Add any text, buttons, or elements inside this container.</p>
</div>`,
  },
  {
    id: "solid-card",
    name: "Dark Zinc Card",
    category: "shapes",
    description: "Dark zinc card container",
    icon: Square,
    snippet: `<div class="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-3 my-4">
  <h3 class="text-base font-bold text-white">Feature Box</h3>
  <p class="text-xs text-zinc-400">Sleek dark container with clean border styling.</p>
</div>`,
  },
  {
    id: "horizontal-divider",
    name: "Divider Line",
    category: "shapes",
    description: "Clean horizontal separator line",
    icon: Square,
    snippet: `<hr class="my-6 border-zinc-800/80" />`,
  },

  // Components & Layouts
  {
    id: "feature-grid-card",
    name: "Feature Card",
    category: "components",
    description: "Icon feature block",
    icon: LayoutGrid,
    snippet: `<div class="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2 my-3">
  <div class="h-9 w-9 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold text-sm">⚡</div>
  <h4 class="text-xs sm:text-sm font-bold text-white">Lightning Speed</h4>
  <p class="text-xs text-zinc-400">Optimized for high-performance interactive rendering.</p>
</div>`,
  },
  {
    id: "pricing-card",
    name: "Pricing Card",
    category: "components",
    description: "Subscription plan pricing card",
    icon: CreditCard,
    snippet: `<div class="p-6 rounded-2xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-sky-500/30 shadow-2xl space-y-4 my-4">
  <div class="flex items-center justify-between">
    <span class="text-xs font-bold uppercase tracking-wider text-sky-400">Pro Plan</span>
    <span class="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] font-semibold">Popular</span>
  </div>
  <div class="flex items-baseline gap-1">
    <span class="text-3xl font-bold text-white">$29</span>
    <span class="text-xs text-zinc-400">/ month</span>
  </div>
  <p class="text-xs text-zinc-400">Full access to AI assistant, visual inspector & export.</p>
  <button class="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-xs font-bold text-white transition">Upgrade to Pro</button>
</div>`,
  },
  {
    id: "input-field",
    name: "Email Form",
    category: "components",
    description: "Form input with subscribe button",
    icon: Code2,
    snippet: `<div class="flex items-center gap-2 my-3">
  <input type="email" placeholder="Enter your email..." class="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 outline-none focus:border-sky-500 transition" />
  <button class="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-xs font-semibold text-white transition">Subscribe</button>
</div>`,
  },
];

type Props = {
  onClose?: () => void;
  onVisualEditEnable?: () => void;
};

export default function ElementsPanel({ onVisualEditEnable }: Props) {
  const setFiles = useEditorStore((s) => s.setFiles);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [placement, setPlacement] = useState<"append" | "prepend">("append");
  const [lastInserted, setLastInserted] = useState<string | null>(null);

  const categories = [
    { id: "all", label: "All" },
    { id: "text", label: "Text" },
    { id: "buttons", label: "Buttons" },
    { id: "shapes", label: "Shapes" },
    { id: "components", label: "Components" },
  ];

  const filteredElements = ELEMENT_CATALOG.filter((item) => {
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  function insertElement(snippet: string, item: ElementItem) {
    const cleanSnippet = snippet.trim();
    const elementId = `codraw-el-${item.id}`;
    let snippetWithId = cleanSnippet;

    const tagMatch = cleanSnippet.match(/^<([a-z0-9]+)/i);
    if (tagMatch) {
      const tagName = tagMatch[1];
      snippetWithId = cleanSnippet.replace(/^<([a-z0-9]+)/i, `<${tagName} id="${elementId}"`);
    }

    setFiles((prev) => {
      const hasUserFiles = Object.keys(prev).length > 0;
      const baseFiles = hasUserFiles ? prev : HERO_PREVIEW_TEMPLATE;
      const originalHtml = baseFiles["index.html"] || HERO_PREVIEW_TEMPLATE["index.html"];

      let updatedHtml = originalHtml;

      if (placement === "prepend") {
        if (updatedHtml.includes("<main")) {
          updatedHtml = updatedHtml.replace(/(<main[^>]*>)/i, `$1\n  ${snippetWithId}`);
        } else if (updatedHtml.includes("<body")) {
          updatedHtml = updatedHtml.replace(/(<body[^>]*>)/i, `$1\n  ${snippetWithId}`);
        } else {
          updatedHtml = `${snippetWithId}\n${updatedHtml}`;
        }
      } else {
        if (updatedHtml.includes("</main>")) {
          updatedHtml = updatedHtml.replace("</main>", `  ${snippetWithId}\n</main>`);
        } else if (updatedHtml.includes("</body>")) {
          updatedHtml = updatedHtml.replace("</body>", `  ${snippetWithId}\n</body>`);
        } else {
          updatedHtml += `\n${snippetWithId}`;
        }
      }

      return {
        ...baseFiles,
        "index.html": updatedHtml,
      };
    });

    // 1. Enable Visual Edit Mode
    if (onVisualEditEnable) {
      onVisualEditEnable();
    }

    // 2. Select newly inserted element in canvas & open Inspector
    const targetSelector = `#${elementId}`;
    window.postMessage({ type: "CODRAW_SELECT_COMPONENT", selector: targetSelector, tag: tagMatch ? tagMatch[1] : "" }, "*");

    setLastInserted(item.name);
    setTimeout(() => setLastInserted(null), 3000);
  }

  return (
    <div className="sleek-panel flex h-full flex-col text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 p-4">
        <div className="flex items-center gap-2">
          <Boxes size={18} className="text-sky-400" />
          <h2 className="text-base font-semibold text-white">Elements Library</h2>
        </div>
        <p className="mt-1 text-xs text-zinc-400">
          Click any element to add it directly into your live canvas.
        </p>

        {/* Placement Mode Selector */}
        <div className="mt-3 flex items-center justify-between rounded-lg bg-zinc-900/90 border border-zinc-800 p-1 text-[11px]">
          <span className="text-zinc-400 font-medium px-2">Placement:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPlacement("append")}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition ${
                placement === "append"
                  ? "bg-sky-500/20 border border-sky-500/40 text-sky-300 font-semibold"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Add to bottom of page"
            >
              <ArrowDownToLine size={12} />
              <span>Bottom</span>
            </button>

            <button
              onClick={() => setPlacement("prepend")}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition ${
                placement === "prepend"
                  ? "bg-sky-500/20 border border-sky-500/40 text-sky-300 font-semibold"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Add to top of page"
            >
              <ArrowUpToLine size={12} />
              <span>Top</span>
            </button>
          </div>
        </div>
      </div>

      {/* Insertion Success Toast Banner */}
      {lastInserted && (
        <div className="animate-slideInRight mx-3 mt-3 flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-950/40 px-3 py-2 text-xs text-emerald-300 shadow-lg">
          <div className="flex items-center gap-1.5">
            <Check size={14} className="text-emerald-400" />
            <span>Inserted & Selected: <strong>{lastInserted}</strong></span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide">Inspector Open</span>
        </div>
      )}

      {/* Search & Category Filter */}
      <div className="p-3 border-b border-zinc-800/80 space-y-2">
        <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-1.5">
          <Search size={14} className="text-zinc-500 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search headings, buttons, cards..."
            className="flex-1 bg-transparent text-xs text-white placeholder-zinc-500 outline-none"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition ${
                activeCategory === cat.id
                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Element Cards Grid */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredElements.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">
            No elements match your search.
          </div>
        ) : (
          filteredElements.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => insertElement(item.snippet, item)}
                className="group flex cursor-pointer items-center justify-between rounded-xl border border-zinc-800/90 bg-zinc-900/50 p-3 transition-all hover:border-sky-500/50 hover:bg-sky-950/20 hover:shadow-[0_0_20px_rgba(56,189,248,0.15)]"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg border border-zinc-700/60 bg-zinc-800 text-zinc-300 transition-colors group-hover:border-sky-500/40 group-hover:bg-sky-500/20 group-hover:text-sky-400">
                    <Icon size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200 group-hover:text-white">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-zinc-400 line-clamp-1">
                      {item.description}
                    </p>
                  </div>
                </div>

                <button
                  className="grid h-7 w-7 place-items-center rounded-lg border border-zinc-700/60 bg-zinc-800 text-zinc-300 transition-all group-hover:border-sky-500 group-hover:bg-sky-500 group-hover:text-white"
                  title="Add to canvas"
                >
                  <Plus size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
