import { MousePointer2, Waves } from "lucide-react";

type Props = {
  visualEditEnabled: boolean;
  onVisualEditChange: (enabled: boolean) => void;
};

export default function Toolbar({
  visualEditEnabled,
  onVisualEditChange,
}: Props) {
  return (
    <div className="ocean-glass flex h-12 items-center gap-3 border-b px-4 text-white">
      <div className="flex items-center gap-2 text-sm font-semibold tracking-wide text-cyan-100">
        <Waves size={17} className="text-cyan-300" />
        Codraw
      </div>

      <div className="h-5 w-px bg-cyan-200/20" />

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
            ? "ocean-button-active"
            : "ocean-button"
        }`}
      >
        <MousePointer2 size={16} />
      </button>
    </div>
  );
}
