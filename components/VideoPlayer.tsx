'use client';

import { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  url: string;
  poster?: string | null;
}

export default function VideoPlayer({ url, poster }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    const isHLS = url.toLowerCase().endsWith('.m3u8');

    if (isHLS) {
      // Load HLS.js dynamically
      import('hls.js').then((Hls) => {
        if (Hls.default.isSupported()) {
          const hls = new Hls.default();
          hls.loadSource(url);
          hls.attachMedia(video);
          hlsRef.current = hls;
        } else if (video.canPlayType('application/vnd.apple.mpegURL')) {
          // Native HLS support (Safari)
          video.src = url;
        }
      });
    } else {
      // Regular MP4
      video.src = url;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [url]);

  return (
    <div className="w-full">
      <video
        ref={videoRef}
        controls
        preload="none"
        playsInline
        poster={poster || undefined}
        className="w-full h-auto rounded"
      >
        Dein Browser unterstützt das Video-Tag nicht.
      </video>
    </div>
  );
}
