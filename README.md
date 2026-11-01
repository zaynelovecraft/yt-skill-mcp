# yt-skill-mcp 🎬 -> 🧠

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Case Study](https://img.shields.io/badge/Case_Study-zaynelovecraft.com-6366f1)](https://www.zaynelovecraft.com/work/yt-skill-mcp)
[![Article](https://img.shields.io/badge/Deep_Dive-Read_Post-10b981)](https://www.zaynelovecraft.com/articles/building-custom-mcp-servers-typescript-youtube-skills)

A Model Context Protocol (MCP) server and CLI that fetches timestamped YouTube transcripts (zero API key required) and compiles technical tutorials into repeatable Cursor & Claude Code `SKILL.md` workflows.

> 📖 **Read the full engineering breakdown:** [Building Custom MCP Servers in TypeScript for Cursor](https://www.zaynelovecraft.com/articles/building-custom-mcp-servers-typescript-youtube-skills)

## Why?

Watching a 25-minute engineering talk is useless if your coding agent forgets the pattern tomorrow. `yt-skill-mcp` exposes two MCP tools to Cursor / Claude Desktop:
1. `fetch_youtube_transcript` — pulls timestamped `[142s] ...` transcript segments directly from YouTube's player tracklist.
2. `compile_cursor_skill` — formats the extracted steps into a valid `.cursor/skills/<slug>/SKILL.md` file with YAML trigger frontmatter.

## Quick Start

### 1. Add to Cursor (`.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "yt-skill": {
      "command": "npx",
      "args": ["-y", "github:zaynelovecraft/yt-skill-mcp"]
    }
  }
}
```

### 2. CLI Usage

```bash
npx github:zaynelovecraft/yt-skill-mcp https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

## Example Output (`SKILL.md`)

```markdown
---
name: next-cache-audit
description: Audit Next.js App Router fetch caching and ISR revalidation boundaries.
---

# Next.js Caching Deep Dive

### Step 1
Inspect all route handlers for missing `revalidate` exports...
```

## License

MIT
