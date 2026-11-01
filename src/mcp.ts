#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { buildSkillMarkdown, fetchTranscript } from "./transcript.js";

const server = new Server(
  { name: "yt-skill-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "fetch_youtube_transcript",
      description:
        "Fetch timestamped transcript segments from a YouTube URL or video ID for agent analysis.",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "YouTube watch URL, youtu.be link, or 11-char ID" },
          lang: { type: "string", description: "Caption language code (default: en)" },
        },
        required: ["url"],
      },
    },
    {
      name: "compile_cursor_skill",
      description:
        "Format extracted video frameworks into a Cursor Agent SKILL.md file with YAML frontmatter.",
      inputSchema: {
        type: "object",
        properties: {
          skillName: { type: "string", description: "Kebab-case skill slug" },
          description: { type: "string", description: "One-line trigger description for the agent" },
          videoId: { type: "string", description: "Source YouTube video ID" },
          title: { type: "string", description: "Title of the workflow" },
          steps: {
            type: "array",
            items: { type: "string" },
            description: "Ordered actionable steps extracted from the video",
          },
        },
        required: ["skillName", "description", "videoId", "title", "steps"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;

  if (name === "fetch_youtube_transcript") {
    const url = String(args?.url ?? "");
    const lang = String(args?.lang ?? "en");
    const result = await fetchTranscript(url, lang);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              videoId: result.videoId,
              title: result.title,
              segmentCount: result.segments.length,
              transcript: result.fullText,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  if (name === "compile_cursor_skill") {
    const md = buildSkillMarkdown({
      skillName: String(args?.skillName),
      description: String(args?.description),
      videoId: String(args?.videoId),
      title: String(args?.title),
      steps: Array.isArray(args?.steps) ? args.steps.map(String) : [],
    });
    return { content: [{ type: "text", text: md }] };
  }

  throw new Error(`Unknown tool: ${name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
