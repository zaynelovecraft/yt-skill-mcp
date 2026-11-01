export interface TranscriptSegment {
  startSeconds: number;
  durationSeconds: number;
  text: string;
}

/**
 * Extracts an 11-character YouTube video ID from watch URLs, short URLs, or raw IDs.
 */
export function extractVideoId(input: string): string {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  const url = new URL(trimmed);
  if (url.hostname === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    if (id && id.length === 11) return id;
  }
  const v = url.searchParams.get("v");
  if (v && v.length === 11) return v;

  const parts = url.pathname.split("/").filter(Boolean);
  const embedOrShortsIdx = parts.findIndex((p) => p === "embed" || p === "shorts" || p === "v");
  if (embedOrShortsIdx !== -1 && parts[embedOrShortsIdx + 1]) {
    return parts[embedOrShortsIdx + 1];
  }

  throw new Error(`Unable to parse YouTube video ID from: ${input}`);
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/**
 * Fetches caption tracks via YouTube's internal player API (no API key needed).
 * The watch-page caption URLs now return empty bodies, so the ANDROID client is used instead.
 */
export async function fetchTranscript(videoUrlOrId: string, lang = "en"): Promise<{
  videoId: string;
  title: string;
  segments: TranscriptSegment[];
  fullText: string;
}> {
  const videoId = extractVideoId(videoUrlOrId);
  const watchRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: { "Accept-Language": `${lang},en;q=0.9` },
  });
  if (!watchRes.ok) {
    throw new Error(`Failed to fetch YouTube watch page (${watchRes.status})`);
  }

  const html = await watchRes.text();
  const apiKey = html.match(/"INNERTUBE_API_KEY":\s*"([^"]+)"/)?.[1];
  if (!apiKey) {
    throw new Error("Could not find YouTube API key on watch page.");
  }

  const playerRes = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      context: { client: { clientName: "ANDROID", clientVersion: "20.10.38" } },
      videoId,
    }),
  });
  const player = await playerRes.json();
  const title: string = player?.videoDetails?.title ?? videoId;
  const tracks: Array<{ languageCode: string; baseUrl: string }> =
    player?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];

  if (!tracks.length) {
    throw new Error(`No captions available for video ${videoId}`);
  }

  const track = tracks.find((t) => t.languageCode === lang) ?? tracks[0];
  const xml = await (await fetch(track.baseUrl.replace("&fmt=srv3", ""))).text();

  const segments: TranscriptSegment[] = [...xml.matchAll(/<text start="([\d.]+)" dur="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g)]
    .map((m) => ({
      startSeconds: Math.floor(Number(m[1])),
      durationSeconds: Math.floor(Number(m[2])),
      text: decodeEntities(decodeEntities(m[3])).replace(/\s+/g, " ").trim(),
    }))
    .filter((seg) => seg.text.length > 0);

  const fullText = segments.map((s) => `[${s.startSeconds}s] ${s.text}`).join("\n");

  return { videoId, title, segments, fullText };
}

/**
 * Generates a structured Cursor SKILL.md template from a transcript payload.
 */
export function buildSkillMarkdown(opts: {
  skillName: string;
  description: string;
  videoId: string;
  title: string;
  steps: string[];
}): string {
  const stepLines = opts.steps.map((s, i) => `### Step ${i + 1}\n\n${s}`).join("\n\n");

  return `---
name: ${opts.skillName}
description: ${opts.description} (Source: ${opts.title} - https://youtu.be/${opts.videoId})
---

# ${opts.title}

> Generated from https://www.youtube.com/watch?v=${opts.videoId}

## Workflow

${stepLines}
`;
}
