#!/usr/bin/env node
import { fetchTranscript } from "./transcript.js";

const [urlOrId, lang = "en"] = process.argv.slice(2);

if (!urlOrId || urlOrId === "--help" || urlOrId === "-h") {
  console.log("Usage: yt-skill-mcp <youtube-url-or-id> [lang]");
  process.exit(urlOrId ? 0 : 1);
}

const data = await fetchTranscript(urlOrId, lang);
console.log(`# ${data.title} (${data.videoId})\n`);
console.log(data.fullText);
