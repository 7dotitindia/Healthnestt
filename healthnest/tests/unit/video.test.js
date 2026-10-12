import { describe, it, expect } from "vitest";
import { parseYouTubeId, isYouTubeId, youTubeEmbedUrl, youTubeShortUrl, youTubeWatchUrl } from "@/lib/video";

const ID = "dQw4w9WgXcQ";

describe("parseYouTubeId: accepts real YouTube video links", () => {
  it.each([
    [`https://www.youtube.com/watch?v=${ID}`],
    [`https://youtube.com/watch?v=${ID}&t=42s`],
    [`https://www.youtube.com/watch?feature=share&v=${ID}`],
    [`https://m.youtube.com/watch?v=${ID}`],
    [`https://youtu.be/${ID}`],
    [`https://youtu.be/${ID}?si=abc123`],
    [`https://www.youtube.com/embed/${ID}`],
    [`https://www.youtube-nocookie.com/embed/${ID}`],
    [`https://www.youtube.com/shorts/${ID}`],
    [`https://www.youtube.com/live/${ID}`],
    [`http://youtu.be/${ID}`],
    [`  youtu.be/${ID}  `],
    [`WWW.YOUTUBE.COM/watch?v=${ID}`],
  ])("%s", (input) => expect(parseYouTubeId(input)).toBe(ID));

  it("keeps ids that contain - and _", () => {
    expect(parseYouTubeId("https://youtu.be/a-B_c1D2e3F")).toBe("a-B_c1D2e3F");
  });
});

describe("parseYouTubeId: rejects everything else", () => {
  it.each([
    ["empty", ""],
    ["spaces", "   "],
    ["a bare id", ID],
    ["another site", `https://vimeo.com/${ID}`],
    ["a look-alike host", `https://youtube.com.evil.example/watch?v=${ID}`],
    ["a look-alike prefix", `https://notyoutube.com/watch?v=${ID}`],
    ["a subdomain trick", `https://evil.example/?u=youtube.com/watch?v=${ID}`],
    ["credentials in the address", `https://youtube.com@evil.example/watch?v=${ID}`],
    ["user info on the right host", `https://user:pw@www.youtube.com/watch?v=${ID}`],
    ["a custom port", `https://www.youtube.com:8443/watch?v=${ID}`],
    ["javascript:", `javascript:alert(1)//youtube.com/watch?v=${ID}`],
    ["data:", "data:text/html,<script>alert(1)</script>"],
    ["ftp", `ftp://youtu.be/${ID}`],
    ["a playlist, not a video", "https://www.youtube.com/playlist?list=PL1234567890A"],
    ["a channel", "https://www.youtube.com/@somechannel"],
    ["the home page", "https://www.youtube.com/"],
    ["a too-short id", "https://youtu.be/abc"],
    ["a too-long id", `https://youtu.be/${ID}X`],
    ["an id with markup", 'https://www.youtube.com/watch?v="><script>x</script>'],
    ["an id with a quote", `https://www.youtube.com/watch?v=${ID.slice(0, 10)}"`],
    ["a path trick", `https://www.youtube.com/watch/${ID}`],
    ["a very long string", `https://youtu.be/${ID}?${"a".repeat(400)}`],
    ["a number", 12345678901],
    ["null", null],
    ["undefined", undefined],
    ["an object", { v: ID }],
  ])("%s", (_label, input) => expect(parseYouTubeId(input)).toBeNull());
});

describe("embed addresses", () => {
  it("are rebuilt from the id on YouTube's privacy host", () => {
    expect(youTubeEmbedUrl(ID)).toBe(`https://www.youtube-nocookie.com/embed/${ID}?autoplay=1&rel=0&modestbranding=1`);
    expect(youTubeWatchUrl(ID)).toBe(`https://www.youtube.com/watch?v=${ID}`);
    expect(youTubeShortUrl(ID)).toBe(`https://youtu.be/${ID}`);
  });
  it("isYouTubeId guards what the page will render", () => {
    expect(isYouTubeId(ID)).toBe(true);
    for (const bad of ["", "short", `${ID}!`, `${ID}/../x`, null, undefined, 5]) expect(isYouTubeId(bad)).toBe(false);
  });
});
