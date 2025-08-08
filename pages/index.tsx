// pages/index.tsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Volume2, VolumeX, Loader2 } from "lucide-react";

type Row = { name?: string; results?: number; cpr?: number; link: string };
type MediaItem = {
  id: string;
  permalink: string;
  label?: string;
  video_url?: string;
  thumbnail_url?: string;
  preview?: string;
  stats?: { results?: number; cpr?: number };
};

const DEFAULT_TSV = `Name\tResults\tCPR\tVideo Link
American Psycho\t2\t0.2\thttps://www.instagram.com/p/DMBhlKcJHK4/#advertiser
Jake WOrk\t30\t0.12\thttps://www.instagram.com/p/DMBhlgJMmCN/#advertiser`;

export default function HomePage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadFromTSV(DEFAULT_TSV); }, []);

  async function loadFromTSV(text: string) {
    setLoading(true); setError(null);
    try {
      const rows = parseTable(text);
      const res = await fetch("/api/resolve", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ rows })
      });
      if (!res.ok) throw new Error(`Resolver error ${res.status}`);
      const data: MediaItem[] = await res.json();
      setItems(data);
    } catch (e:any) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen" style={{background:"#fafafa", color:"#111", padding:"1.5rem"}}>
      <div style={{maxWidth:"72rem", margin:"0 auto"}}>
        <h1 style={{fontSize:"1.75rem", fontWeight:600, marginBottom:"1rem"}}>Instagram Video Gallery</h1>
        {error && <div style={{color:"#dc2626"}}>{error}</div>}
        {loading ? (
          <div style={{display:"flex", alignItems:"center", gap:8}}><Loader2 className="animate-spin" /> Loading…</div>
        ) : (
          <section style={{display:"grid", gap:"20px", gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))"}}>
            {items.map((m) => <MediaCard key={m.id} item={m} />)}
          </section>
        )}
      </div>
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
    <motion.article initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} style={{background:"#fff", borderRadius:16, boxShadow:"0 1px 2px rgba(0,0,0,.06),0 1px 3px rgba(0,0,0,.1)", overflow:"hidden"}} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <div style={{position:"relative"}}>
        <div style={{position:"relative", paddingBottom:"177.77%", height:0, background:"#f5f5f5"}}>
          {item.video_url ? (
            <video ref={videoRef} src={item.video_url} poster={item.thumbnail_url || item.preview} style={{position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover"}} muted={muted} playsInline preload="metadata" loop />
          ) : (
            <img src={item.thumbnail_url || item.preview} alt={item.label || "Instagram"} style={{position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover"}} />
          )}
        </div>

        <div style={{position:"absolute", left:0, right:0, top:0, padding:12, color:"#fff", display:"flex", justifyContent:"space-between", fontSize:12,
          background:"linear-gradient(to bottom, rgba(0,0,0,.4), transparent)"}}>
          <div>{typeof item.stats?.results === "number" ? `${formatNum(item.stats.results)} results` : ""} {typeof item.stats?.cpr === "number" ? `· CPR ${item.stats.cpr}` : ""}</div>
          <a href={item.permalink} target="_blank" rel="noreferrer" style={{textDecoration:"underline", color:"#fff"}}>Open</a>
        </div>

        <div style={{position:"absolute", left:0, right:0, bottom:0, padding:12, color:"#fff", display:"flex", justifyContent:"space-between", fontSize:12,
          background:"linear-gradient(to top, rgba(0,0,0,.4), transparent)"}}>
          <button onClick={toggleMute} style={{background:"rgba(0,0,0,.5)", borderRadius:9999, padding:"6px 10px"}}>
            {muted ? "Sound off" : "Sound on"}
          </button>
          <div>{isHovering ? (isPlaying ? "Playing" : "Paused") : "Hover to preview"}</div>
        </div>
      </div>
      <div style={{padding:12, fontSize:14, fontWeight:500}}>{item.label || "Post"}</div>
    </motion.article>
  );
}

function formatNum(n?: number) {
  if (typeof n !== "number") return "-";
  return new Intl.NumberFormat(undefined, { notation: "compact" }).format(n);
}

function parseTable(text: string): Row[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const header = lines.shift() || "";
  const delim = header.includes("\t") ? "\t" : ",";
  const cells = header.split(delim).map((s) => s.trim().toLowerCase());
  const idx = {
    name: cells.findIndex((c) => c === "name"),
    results: cells.findIndex((c) => c === "results"),
    cpr: cells.findIndex((c) => c === "cpr"),
    link: cells.findIndex((c) => c.includes("video") && c.includes("link"))
  };
  return lines.map((line) => {
    const parts = line.split(delim);
    return { name: parts[idx.name]?.trim(), results: Number(parts[idx.results]), cpr: Number(parts[idx.cpr]), link: parts[idx.link]?.trim() };
  });
}
