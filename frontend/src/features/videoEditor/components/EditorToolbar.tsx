import { Play, Pause, Download, RotateCw, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onToggle: () => void;
  onDownload: () => Promise<void> | void;
}

export default function EditorToolbar(props: Props) {
  const { isPlaying, onToggle, onDownload } = props;
  return (
    <div className="flex flex-col gap-3">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        aria-label="Play/Pause"
      >
        {isPlaying ? (
          <Pause className="w-5 h-5" />
        ) : (
          <Play className="w-5 h-5" />
        )}
      </Button>

      <Button variant="ghost" size="icon" aria-label="Trim">
        <Scissors className="w-5 h-5" />
      </Button>

      <Button variant="ghost" size="icon" aria-label="Rotate">
        <RotateCw className="w-5 h-5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        aria-label="Export"
        onClick={() => {
          void onDownload();
        }}
      >
        <Download className="w-5 h-5" />
      </Button>
    </div>
  );
}
