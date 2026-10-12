// YouTube links. Only the 11-character video id is ever stored; the embed address is rebuilt from it,
// so nothing a writer pastes can end up inside a page except a plain id.
const ID_RE = /^[A-Za-z0-9_-]{11}$/;
const HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com", "youtu.be"]);

// Returns the video id, or null if the text is not a link to a single YouTube video.
export function parseYouTubeId(input) {
  if (typeof input !== "string") return null;
  const raw = input.trim();
  if (!raw || raw.length > 300) return null;

  let url;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.username || url.password || url.port) return null;
  const host = url.hostname.toLowerCase();
  if (!HOSTS.has(host)) return null;

  const parts = url.pathname.split("/").filter(Boolean);
  let id = null;
  if (host === "youtu.be") id = parts[0];
  else if (parts[0] === "watch") id = url.searchParams.get("v");
  else if (["embed", "shorts", "live", "v"].includes(parts[0])) id = parts[1];
  return id && ID_RE.test(id) ? id : null;
}

export const isYouTubeId = (id) => typeof id === "string" && ID_RE.test(id);

export const youTubeWatchUrl = (id) => `https://www.youtube.com/watch?v=${id}`;
export const youTubeShortUrl = (id) => `https://youtu.be/${id}`;
// youtube-nocookie.com is YouTube's privacy-enhanced host: it stores nothing until the viewer presses play.
export const youTubeEmbedUrl = (id) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
