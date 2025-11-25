"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";
import { useState } from "react";

interface VideoPreviewProps {
  src?: string;
  title?: string;
}

export default function VideoPreview({
  src,
  title = "Video Preview",
}: VideoPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Video Container */}
        <div className="bg-black rounded-lg aspect-video flex items-center justify-center">
          {src ? (
            <video
              src={src}
              className="w-full h-full rounded-lg"
              controls={false}
              // Add video element controls here
            />
          ) : (
            <div className="text-white text-lg">No video selected</div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          <Button
            onClick={handlePlayPause}
            variant="outline"
            size="sm"
            disabled={!src}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>

          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
            disabled={!src}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Timeline placeholder */}
        <div className="bg-muted rounded-lg h-20 flex items-center justify-center">
          <span className="text-muted-foreground text-sm">
            Timeline will appear here
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
