// pages/index.tsx
import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Play, Volume2, VolumeX, Loader2, Link as LinkIcon } from "lucide-react";

interface MediaItem {
  id: string;
  permalink: string;
  label?: string;
  video_url?: string;
  thumbnail_url?: string;
  preview?: string;
  stats?: {
    results?: number;
    cpr?: number;
  };
}

export default function HomePage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const defaultData = `Name\tResults\tCPR\tVideo Link
American Psycho\t2\t0.2\thttps://www.instagram.com/p/DMBhlKcJHK4/#advertiser
Jake WOrk\t30\t0.12\thttps://www.instagram.com/p/DMBhlgJMmCN/#advertiser`;
  const rows = useMemo(() => defaultData.split(/\r?\n/).filter(Boolean), []);

  React.useEffect(() => {
    const parsed = parseTable(rows);
    mockResolveFromTable(parsed).then(setItems);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-semibold">Instagram Video Gallery</h1>
          <a href="#" onClick={(e) => e.preventDefault()} className="text-sm underline opacity-70 hover:opacity-100 flex items-center gap-1">
            <LinkIcon className="w-4 h-4" /> How this works
          </a>
        </header>
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((m) => (
            <MediaCard key={m.id} item={m} />
          ))}
        </section>
      </div>
      <style jsx global>{`
        /* lightweight utility styles (no Tailwind needed) */
        body { margin:0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; }
        .min-h-screen{min-height:100vh;}
        .bg-neutral-50{background-color:#fafafa;}
        .text-neutral-900{color:#111;}
        .p-6{padding:1.5rem;}
        .max-w-6xl{max-width:72rem;}
        .mx-auto{margin-left:auto;margin-right:auto;}
        .space-y-6 > * + * { margin-top:1.5rem; }
        .flex{display:flex;}
        .items-center{align-items:center;}
        .justify-between{justify-content:space-between;}
        .text-2xl{font-size:1.5rem;}
        .sm\:text-3xl{font-size:1.875rem;}
        .font-semibold{font-weight:600;}
        .underline{text-decoration:underline;}
        .opacity-70{opacity:.7;}
        .hover\:opacity-100:hover{opacity:1;}
        .gap-1{gap:.25rem;}
        .grid{display:grid;}
        .gap-5{gap:1.25rem;}
        .grid-cols-1{grid-template-columns:repeat(1,minmax(0,1fr));}
        @media (min-width:640px){.sm\:grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr));}}
        @media (min-width:1024px){.lg\:grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr));}}
        .bg-white{background-color:#fff;}
        .rounded-2xl{border-radius:1rem;}
        .shadow{box-shadow:0 1px 2px rgba(0,0,0,.06),0 1px 3px rgba(0,0,0,.1);}
        .overflow-hidden{overflow:hidden;}
        .relative{position:relative;}
        .aspect-\[9\/16\]{position:relative;padding-bottom:177.77%;height:0;}
        .aspect-\[9\/16\]>*{position:absolute;inset:0;width:100%;height:100%;}
        .bg-neutral-100{background-color:#f5f5f5;}
        .object-cover{object-fit:cover;}
        .absolute{position:absolute;}
        .inset-x-0{left:0;right:0;}
        .top-0{top:0;}
        .p-3{padding:.75rem;}
        .text-white{color:#fff;}
        .bg-gradient-to-b{background:linear-gradient(to bottom,rgba(0,0,0,.4),transparent);}
        .from-black\/40{}
        .to-transparent{}
        .text-xs{font-size:.75rem;}
      `}</style>
    </div>
  );
}

function MediaCard({ item }: { item: MediaItem }) {
  const [muted, setMuted] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  function onMouseEnter() {
    setIsHovering(true);
    videoRef.current?.play().then(() => setIsPlaying(true)).catch(() => {});
  }
  function onMouseLeave() {
    setIsHovering(false);
    videoRef.current?.pause();
    setIsPlaying(false);
  }
  function toggleMute() {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setMuted(videoRef.current.muted);
    if (!videoRef.current.paused) videoRef.current.play().catch(() => {});
  }

  return (
    <motion.article className="bg-white rounded-2xl shadow overflow-hidden group relative" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <div className="relative aspect-[9/16] bg-neutral-100">
        {item.video_url ? (
          <video
            ref={videoRef}
            src={item.video_url}
            poster={item.thumbnail_url || item.preview}
            className="w-full h-full object-cover"
            muted={muted}
            playsInline
            preload="metadata"
            loop
          />
        ) : (
          <img src={item.thumbnail_url || item.preview} alt={item.label || "Instagram"} className="w-full h-full object-cover" />
        )}

        <div className="absolute inset-x-0 top-0 p-3 bg-gradient-to-b from-black/40 to-transparent text-white flex items-start justify-between">
          <div className="flex gap-3 text-xs">
            {typeof item.stats?.results === "number" && <span>{formatNum(item.stats.results)} results</span>}
            {typeof item.stats?.cpr === "number" && <span>· CPR {item.stats.cpr}</span>}
          </div>
          <a href={item.permalink} target="_blank" rel="noreferrer" className="text-xs underline">Open</a>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-b from-black/40 to-transparent text-white flex items-center justify-between">
          <button onClick={toggleMute} className="text-xs underline">Toggle sound</button>
          <div className="text-xs">{isHovering ? (isPlaying ? "Playing" : "Paused") : "Hover to preview"}</div>
        </div>
      </div>
      <div className="p-3 text-sm font-medium">{item.label || "Post"}</div>
    </motion.article>
  );
}

function parseTable(lines: string[]) {
  const header = lines[0] || "";
  const delim = header.includes("\t") ? "\t" : ",";
  const cells = header.split(delim).map((s) => s.trim().toLowerCase());
  const idx = {
    name: cells.findIndex((c) => c === "name"),
    results: cells.findIndex((c) => c === "results"),
    cpr: cells.findIndex((c) => c === "cpr"),
    link: cells.findIndex((c) => c.includes("video") && c.includes("link"))
  };
  const body = lines.slice(1);
  return body.map((line) => {
    const parts = line.split(delim);
    return {
      name: parts[idx.name]?.trim(),
      results: Number(parts[idx.results]),
      cpr: Number(parts[idx.cpr]),
      link: parts[idx.link]?.trim()
    };
  });
}

async function mockResolveFromTable(rows: { name?: string; results?: number; cpr?: number; link: string }[]): Promise<MediaItem[]> {
  const samplePoster = "https://images.unsplash.com/photo-1549880338-65ddcdfd017b?q=80&w=1080&auto=format&fit=crop";
  const sampleVideo = "https://samplelib.com/lib/preview/mp4/sample-5s.mp4";
  return rows.map((r, i) => ({
    id: `media_${i}`,
    permalink: r.link,
    label: r.name,
    thumbnail_url: samplePoster,
    preview: samplePoster,
    video_url: sampleVideo,
    stats: { results: r.results, cpr: r.cpr }
  }));
}

function formatNum(n?: number) {
  if (typeof n !== "number") return "-";
  return new Intl.NumberFormat(undefined, { notation: "compact" }).format(n);
}
