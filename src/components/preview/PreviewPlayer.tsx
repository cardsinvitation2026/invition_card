'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';

interface Props {
  thumbnail: string;
  videoUrl: string | null;
  alt: string;
}

export function PreviewPlayer({ thumbnail, videoUrl, alt }: Props) {
  const [playing, setPlaying] = useState(false);

  if (!videoUrl) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src={thumbnail} alt={alt} className="size-full rounded-lg object-cover" />
    );
  }

  if (!playing) {
    return (
      <button
        type="button"
        onClick={() => setPlaying(true)}
        className="group relative size-full overflow-hidden rounded-lg"
        aria-label="Play preview"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumbnail} alt={alt} className="size-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition group-hover:bg-black/40">
          <span className="flex size-16 items-center justify-center rounded-full bg-white/95 text-foreground shadow-xl transition group-hover:scale-105">
            <Play className="ml-1 size-7 fill-current" />
          </span>
        </div>
      </button>
    );
  }

  return (
    <video
      src={videoUrl}
      poster={thumbnail}
      controls
      autoPlay
      playsInline
      className="size-full rounded-lg object-cover"
    />
  );
}
