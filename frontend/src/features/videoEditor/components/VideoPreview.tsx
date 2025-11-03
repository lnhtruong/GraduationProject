import React from "react";

interface Props {
  videoRef: React.RefObject<HTMLVideoElement>;
  src: string;
  filter?: string;
}

export default function VideoPreview({ videoRef, src, filter }: Props) {
  return (
    <div className="flex-1 bg-dark rounded-md flex items-center justify-center">
      <video
        ref={videoRef}
        className="max-h-[60vh] max-w-full"
        controls
        src={src}
        style={filter ? { filter } : undefined}
      >
        Trình duyệt của bạn không hỗ trợ tag video.
      </video>
    </div>
  );
}
