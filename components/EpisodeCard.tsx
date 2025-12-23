'use client';

import { useState } from 'react';
import { EpisodeWithLanguage } from '@/lib/episodes';
import VideoPlayer from './VideoPlayer';
import { format } from 'date-fns';

interface EpisodeCardProps {
  episode: EpisodeWithLanguage;
}

export default function EpisodeCard({ episode }: EpisodeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const description = episode.displayDescription || '';
  const shouldTruncate = description.length > 150;

  const dateStr = episode.timestamp
    ? format(new Date(episode.timestamp * 1000), 'dd.MM.yyyy')
    : '—';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-md overflow-hidden">
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2 text-white">
          {episode.displayTitle}
        </h3>
        <p className="text-sm text-slate-400 mb-3">
          {dateStr} · {episode.displayLanguage}
        </p>

        {description && (
          <div className="mb-3">
            <p className={`text-sm text-slate-200 ${!expanded && shouldTruncate ? 'line-clamp-2' : ''}`}>
              {description}
            </p>
            {shouldTruncate && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-emerald-300 hover:underline mt-1"
              >
                {expanded ? 'Weniger' : 'Mehr lesen'}
              </button>
            )}
          </div>
        )}

        {episode.url_video ? (
          <VideoPlayer url={episode.url_video} />
        ) : (
          <a
            href={episode.url_website}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <div className="w-full aspect-video bg-slate-800 rounded flex items-center justify-center">
              <span className="text-slate-400">Vorschau</span>
            </div>
          </a>
        )}

        <div className="mt-3">
          <a
            href={episode.url_website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-emerald-300 hover:underline"
          >
            Zur Website →
          </a>
        </div>
      </div>
    </div>
  );
}
