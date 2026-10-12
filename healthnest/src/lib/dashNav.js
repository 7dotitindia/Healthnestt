// Picks which link is "current": the longest matching path wins; two links with the same path
// (Review queue and All articles) are told apart by their ?status= query.
export function pickActive(links, pathname, search) {
  const parsed = links.map((l) => {
    const [path, query = ""] = l.href.split("?");
    return { ...l, path, query };
  });
  const matches = parsed.filter((l) => pathname === l.path || (l.path.split("/").length > 2 && pathname.startsWith(l.path + "/")));
  if (matches.length === 0) {
    // e.g. /freelancer/articles/abc belongs under the root link "/freelancer".
    const root = parsed.find((l) => pathname.startsWith(l.path + "/"));
    return root ? root.href : null;
  }
  const longest = Math.max(...matches.map((m) => m.path.length));
  const best = matches.filter((m) => m.path.length === longest);
  if (best.length === 1) return best[0].href;
  const exact = best.find((m) => m.query && m.query === search);
  return (exact || best.find((m) => !m.query) || best[0]).href;
}
