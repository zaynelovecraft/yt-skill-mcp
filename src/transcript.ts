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

/**
 * Fetches caption tracks directly from a YouTube watch page without an API key.
 */
export async function fetchTranscript(videoUrlOrId: string, lang = "en"): Promise<{
  videoId: string;
  title: string;
  segments: TranscriptSegment[];
  fullText: string;
}> {
  const videoId = extractVideoId(videoUrlOrId);
  const watchRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "Accept-Language": `${lang},en;q=0.9`,
    },
  });

  if (!watchRes.ok) {
    throw new Error(`Failed to fetch YouTube watch page (${watchRes.status})`);
  }

  const html = await watchRes.text();
  const titleMatch = html.match(/<title>(.*?) - YouTube<\/title>/);
  const title = titleMatch ? titleMatch[1] : videoId;

  const playerMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});/s);
  if (!playerMatch) {
    throw new Error("Could not locate ytInitialPlayerResponse in watch page.");
  }

  const playerResponse = JSON.parse(playerMatch[1]);
  const tracks =
    playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];

  if (!tracks.length) {
    throw new Error(`No captions available for video ${videoId}`);
  }

  const selectedTrack =
    tracks.find((t: { languageCode: string }) => t.languageCode === lang) ?? tracks[0];

  const captionRes = await fetch(`${selectedTrack.baseUrl}&fmt=json3`);
  const captionJson = await captionRes.json();

  const segments: TranscriptSegment[] = (captionJson.events ?? [])
    .filter((ev: { segs?: Array<{ utf8: string }> }) => Array.isArray(ev.segs))
    .map((ev: { tStartMs?: number; dDurationMs?: number; segs: Array<{ utf8: string }> }) => ({
      startSeconds: Math.floor((ev.tStartMs ?? 0) / 1000),
      durationSeconds: Math.floor((ev.dDurationMs ?? 0) / 1000),
      text: ev.segs
        .map((s) => s.utf8)
        .join("")
        .replace(/\n+/g, " ")
        .trim(),
    }))
    .filter((seg: TranscriptSegment) => seg.text.length > 0);

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
