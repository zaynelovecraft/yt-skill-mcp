# yt-skill-mcp 🎬 -> 🧠

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Case Study](https://img.shields.io/badge/Case_Study-zaynelovecraft.com-6366f1)](https://www.zaynelovecraft.com/work/yt-skill-mcp)
[![Article](https://img.shields.io/badge/Deep_Dive-Read_Post-10b981)](https://www.zaynelovecraft.com/articles/building-custom-mcp-servers-typescript-youtube-skills)

A Model Context Protocol (MCP) server and CLI that fetches timestamped YouTube transcripts (no API key needed) and turns technical talks into reusable Cursor / Claude Code `SKILL.md` files.

> 📖 **Engineering write-up:** [Building Custom MCP Servers in TypeScript for Cursor](https://www.zaynelovecraft.com/articles/building-custom-mcp-servers-typescript-youtube-skills)

## Requirements

- Node.js 18 or newer
- The video must have captions (auto-generated captions are fine)

## Quick start (CLI)

Print a timestamped transcript for any video. The first run downloads and compiles the package, which takes about 10 seconds.

```bash
npx -y github:zaynelovecraft/yt-skill-mcp "https://www.youtube.com/watch?v=mMP-BPWsNqA"
```

```text
# I cracked the tech job market (mMP-BPWsNqA)

[0s] So, yeah, basically what's creamy? I
[1s] wanted to talk about how I cheesed my
...
```

Pass a language code as a second argument to pick a caption track: `... <url> es`.

## Use it as an MCP server in Cursor

Add this to `.cursor/mcp.json` (project) or `~/.cursor/mcp.json` (global):

```json
{
  "mcpServers": {
    "yt-skill": {
      "command": "npx",
      "args": ["-y", "-p", "github:zaynelovecraft/yt-skill-mcp", "yt-skill-mcp-server"]
    }
  }
}
```

Restart Cursor, then ask the agent something like:

> Pull the transcript for https://youtu.be/mMP-BPWsNqA and turn the main workflow into a skill in `.cursor/skills/`.

### Claude Desktop / Claude Code

The same `command` and `args` work in `claude_desktop_config.json`, or with Claude Code:

```bash
claude mcp add yt-skill -- npx -y -p github:zaynelovecraft/yt-skill-mcp yt-skill-mcp-server
```

## Tools

| Tool | Input | Output |
|------|-------|--------|
| `fetch_youtube_transcript` | `url` (watch URL, `youtu.be` link, or 11-char ID), optional `lang` | JSON with `videoId`, `title`, `segmentCount`, and the `[123s] ...` transcript |
| `compile_cursor_skill` | `skillName`, `description`, `videoId`, `title`, `steps[]` | A `SKILL.md` string with YAML frontmatter, ready to save to `.cursor/skills/<skillName>/SKILL.md` |

## Develop locally

```bash
git clone https://github.com/zaynelovecraft/yt-skill-mcp.git
cd yt-skill-mcp
npm install          # also compiles to dist/
node dist/cli.js "https://youtu.be/mMP-BPWsNqA"
node dist/mcp.js     # starts the MCP server on stdio
```

## Troubleshooting

- **`No captions available`**: the video has captions turned off. Try another video.
- **Transcript stops working**: YouTube changes its internal API from time to time. Open an issue with the video URL.

## License

MIT
