"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { isYouTubeId, youTubeEmbedUrl, youTubeWatchUrl } from "@/lib/video";

// Click-to-play YouTube video. Nothing is requested from YouTube until the reader presses play, so a page
// with a video loads as fast, and shares as little, as a page without one.
export default function VideoEmbed({ videoId, title }) {
  const [playing, setPlaying] = useState(false);
  if (!isYouTubeId(videoId)) return null;

  return (
    <figure className="video" aria-label={`Video: ${title}`}>
      <div className="video-frame">
        {playing ? (
          <iframe
            src={youTubeEmbedUrl(videoId)}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
          />
        ) : (
          <button type="button" className="video-play" onClick={() => setPlaying(true)} aria-label={`Play video: ${title}`}>
            <span className="video-play-icon"><Play aria-hidden="true" fill="currentColor" /></span>
            <span className="video-play-label">Play video</span>
          </button>
        )}
      </div>
      <figcaption className="meta">
        Plays from YouTube, which learns that you visited once you press play.{" "}
        <a href={youTubeWatchUrl(videoId)} target="_blank" rel="noopener noreferrer">Watch on YouTube</a>
      </figcaption>
    </figure>
  );
}
