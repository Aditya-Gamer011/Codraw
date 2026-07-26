import { MousePointer2 } from "lucide-react";

type Props = {
  visualEditEnabled: boolean;
  onVisualEditChange: (enabled: boolean) => void;
};

export default function Toolbar({
  visualEditEnabled,
  onVisualEditChange,
}: Props) {
  return (
    <div className="sleek-panel flex h-12 items-center gap-3 border-b px-4 text-white">
      <div className="text-sm font-semibold tracking-wide text-zinc-100">
        Codraw
      </div>

      <div className="h-5 w-px bg-zinc-700" />

      <button
        type="button"
        aria-label="Toggle visual editing"
        title="Toggle visual editing"
        aria-pressed={visualEditEnabled}
        onClick={() =>
          onVisualEditChange(!visualEditEnabled)
        }
        className={`grid h-8 w-8 place-items-center rounded border transition ${
          visualEditEnabled
            ? "sleek-button-active"
            : "sleek-button"
        }`}
      >
        <MousePointer2 size={16} />
      </button>
    </div>
  );
}
