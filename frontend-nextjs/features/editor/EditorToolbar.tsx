"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Scissors, Volume2, Sun, Palette, Download } from "lucide-react";

interface EditorToolbarProps {
  onCut?: () => void;
  onVolumeChange?: (volume: number) => void;
  onBrightnessChange?: (brightness: number) => void;
  onExport?: () => void;
}

export default function EditorToolbar({
  onCut,
  onVolumeChange,
  onBrightnessChange,
  onExport,
}: EditorToolbarProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Editor Tools</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cut Tool */}
        <div className="space-y-2">
          <Button onClick={onCut} className="w-full" variant="outline">
            <Scissors className="h-4 w-4 mr-2" />
            Cut Selected
          </Button>
        </div>

        {/* Volume Control */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            Volume
          </Label>
          <Slider
            defaultValue={[50]}
            max={100}
            step={1}
            onValueChange={(value) => onVolumeChange?.(value[0])}
            className="w-full"
          />
        </div>

        {/* Brightness Control */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Sun className="h-4 w-4" />
            Brightness
          </Label>
          <Slider
            defaultValue={[50]}
            max={100}
            step={1}
            onValueChange={(value) => onBrightnessChange?.(value[0])}
            className="w-full"
          />
        </div>

        {/* Color Grading */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Color Grading
          </Label>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm">
              Warm
            </Button>
            <Button variant="outline" size="sm">
              Cool
            </Button>
            <Button variant="outline" size="sm">
              B&W
            </Button>
          </div>
        </div>

        {/* Export */}
        <div className="pt-4 border-t">
          <Button onClick={onExport} className="w-full" size="lg">
            <Download className="h-4 w-4 mr-2" />
            Export Video
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
