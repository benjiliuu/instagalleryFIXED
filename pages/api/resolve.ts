// pages/api/resolve.ts
import type { NextApiRequest, NextApiResponse } from "next";

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { rows } = req.body as { rows: Row[] };
  if (!rows || !Array.isArray(rows)) return res.status(400).json({ error: "rows missing" });

  try {
    const out: MediaItem[] = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const permalink = stripHash(r.link || "");
      // Step 1: oEmbed to get media_id (works without IG business ownership)
      const mediaId = await getMediaIdFromOEmbed(permalink);
      // Step 2: Query Graph for media info
      const media = await getMedia(mediaId);
      out.push({
        id: mediaId || `row_${i}`,
        permalink,
        label: r.name,
        thumbnail_url: media.thumbnail_url || media.media_url,
        preview: media.thumbnail_url || media.media_url,
        video_url: media.media_type === "VIDEO" ? media.media_url : undefined,
        stats: { results: r.results, cpr: r.cpr },
      });
    }
    res.status(200).json(out);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e?.message || "resolver failed" });
  }
}

function stripHash(url: string) {
  const i = url.indexOf("#");
  return i >= 0 ? url.slice(0, i) : url;
}

async function getMediaIdFromOEmbed(url: string): Promise<string> {
  const appId = process.env.IG_APP_ID;
  const clientToken = process.env.IG_CLIENT_TOKEN;
  if (!appId || !clientToken) throw new Error("Missing IG_APP_ID/IG_CLIENT_TOKEN");
  const qs = new URLSearchParams({ url, access_token: `${appId}|${clientToken}` });
  const resp = await fetch(`https://graph.facebook.com/v19.0/instagram_oembed?${qs.toString()}`);
  if (!resp.ok) throw new Error(`oEmbed failed ${resp.status}`);
  const data = await resp.json();
  // media_id present for many post types; if absent, you may need to parse via other means or fallback
  if (!data.media_id) throw new Error("No media_id returned; ensure the URL is a post/reel and app is configured.");
  return data.media_id;
}

async function getMedia(mediaId: string): Promise<any> {
  const token = process.env.IG_ACCESS_TOKEN;
  if (!token) throw new Error("Missing IG_ACCESS_TOKEN");
  const fields = "media_type,media_url,thumbnail_url,permalink,caption,timestamp";
  const resp = await fetch(`https://graph.facebook.com/v19.0/${mediaId}?fields=${fields}&access_token=${token}`);
  if (!resp.ok) throw new Error(`Media fetch failed ${resp.status}`);
  return await resp.json();
}
