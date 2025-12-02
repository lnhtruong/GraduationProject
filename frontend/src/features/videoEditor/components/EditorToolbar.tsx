import { Play, Pause, Download, RotateCw, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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
    <div className="flex flex-col gap-2 p-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-lg border shadow-sm">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        aria-label="Play/Pause"
        className="hover:bg-primary/10 hover:text-primary transition-colors"
      >
        {isPlaying ? (
          <Pause className="w-5 h-5" />
        ) : (
          <Play className="w-5 h-5" />
        )}
      </Button>

      <Separator />

      <Button 
        variant="ghost" 
        size="icon" 
        aria-label="Trim"
        className="hover:bg-primary/10 hover:text-primary transition-colors"
      >
        <Scissors className="w-5 h-5" />
      </Button>

      <Button 
        variant="ghost" 
        size="icon" 
        aria-label="Rotate"
        className="hover:bg-primary/10 hover:text-primary transition-colors"
      >
        <RotateCw className="w-5 h-5" />
      </Button>

      <Separator />

      <Button
        variant="ghost"
        size="icon"
        aria-label="Export"
        onClick={() => {
          void onDownload();
        }}
        className="hover:bg-primary/10 hover:text-primary transition-colors"
      >
        <Download className="w-5 h-5" />
      </Button>
    </div>
  );
}