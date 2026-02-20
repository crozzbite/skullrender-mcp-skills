#!/usr/bin/env node

// src/index.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

// src/skills-manager.ts
import * as fs from "fs";
import * as path from "path";
import matter from "gray-matter";
import { glob } from "glob";
var SkillsManager = class {
  skills = /* @__PURE__ */ new Map();
  skillsPath;
  constructor(skillsPath) {
    this.skillsPath = skillsPath || process.env.SKILLS_PATH || "./skills";
  }
  async loadSkills() {
    const pattern = path.join(this.skillsPath, "**/SKILL.md").replace(/\\/g, "/");
    const files = await glob(pattern);
    for (const file of files) {
      try {
        const skill = await this.parseSkillFile(file);
        if (skill) {
          this.skills.set(skill.name, skill);
        }
      } catch (error) {
        console.error(`Error loading skill from ${file}:`, error);
      }
    }
    console.error(`Loaded ${this.skills.size} skills from ${this.skillsPath}`);
  }
  async parseSkillFile(filePath) {
    const rawContent = await fs.promises.readFile(filePath, "utf-8");
    const { data, content } = matter(rawContent);
    if (!data.name) {
      console.error(`Skill at ${filePath} missing 'name' in frontmatter`);
      return null;
    }
    const metadata = data.metadata || {};
    return {
      name: data.name,
      description: data.description || "",
      author: metadata.author || data.author,
      version: metadata.version || data.version,
      license: data.license,
      tags: this.extractTags(data, content),
      path: filePath,
      content: content.trim(),
      rawContent
    };
  }
  extractTags(frontmatter, content) {
    const tags = /* @__PURE__ */ new Set();
    if (Array.isArray(frontmatter.tags)) {
      frontmatter.tags.forEach((tag) => tags.add(tag.toLowerCase()));
    }
    const description = String(frontmatter.description || "");
    const triggerMatch = description.match(/trigger:\s*(.+)/i);
    if (triggerMatch) {
      const triggerWords = triggerMatch[1].toLowerCase().split(/[,\s]+/).filter((word) => word.length > 3);
      triggerWords.forEach((word) => tags.add(word));
    }
    return Array.from(tags);
  }
  list() {
    return Array.from(this.skills.values()).map((skill) => ({
      name: skill.name,
      description: skill.description,
      author: skill.author,
      version: skill.version,
      license: skill.license,
      tags: skill.tags
    }));
  }
  get(name) {
    return this.skills.get(name);
  }
  search(query, tags, limit = 5) {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);
    const results = [];
    for (const skill of this.skills.values()) {
      let score = 0;
      if (skill.name.toLowerCase().includes(queryLower)) {
        score += 10;
      }
      const descLower = skill.description.toLowerCase();
      for (const word of queryWords) {
        if (descLower.includes(word)) {
          score += 3;
        }
      }
      const contentLower = skill.content.toLowerCase();
      for (const word of queryWords) {
        if (contentLower.includes(word)) {
          score += 1;
        }
      }
      if (tags && tags.length > 0 && skill.tags) {
        const matchingTags = tags.filter(
          (tag) => skill.tags.some((t) => t.includes(tag.toLowerCase()))
        );
        score += matchingTags.length * 2;
      }
      if (score > 0) {
        results.push({ skill, score });
      }
    }
    return results.sort((a, b) => b.score - a.score).slice(0, limit).map((r) => r.skill);
  }
  getSkillsPath() {
    return this.skillsPath;
  }
};

// src/index.ts
var skillsManager = new SkillsManager();
var server = new Server(
  {
    name: "@skullrender/mcp-skills",
    version: "1.0.0"
  },
  {
    capabilities: {
      tools: {}
    }
  }
);
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "skills_list",
        description: "List all available AI agent skills with their metadata.",
        inputSchema: {
          type: "object",
          properties: {},
          required: []
        }
      },
      {
        name: "skills_get",
        description: "Get the full content of a specific skill by name. Returns the complete SKILL.md content including all patterns, examples, and instructions.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: 'The name of the skill to retrieve (e.g., "angular", "typescript", "pytest")'
            }
          },
          required: ["name"]
        }
      },
      {
        name: "skills_search",
        description: "Search for skills by query text. Searches in skill names, descriptions, and content.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: 'Search query (e.g., "testing", "react forms", "API validation")'
            },
            tags: {
              type: "array",
              items: { type: "string" },
              description: "Optional tags to filter results"
            },
            limit: {
              type: "number",
              description: "Maximum number of results to return (default: 5)"
            }
          },
          required: ["query"]
        }
      }
    ]
  };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args2 } = request.params;
  switch (name) {
    case "skills_list": {
      const skills = skillsManager.list();
      const formatted = skills.map(
        (s) => `\u2022 **${s.name}** (v${s.version || "1.0"})
  ${s.description}`
      ).join("\n\n");
      return {
        content: [
          {
            type: "text",
            text: `# Available Skills (${skills.length})

${formatted}`
          }
        ]
      };
    }
    case "skills_get": {
      const skillName = args2.name;
      const skill = skillsManager.get(skillName);
      if (!skill) {
        const available = skillsManager.list().map((s) => s.name).join(", ");
        return {
          content: [
            {
              type: "text",
              text: `Skill "${skillName}" not found.

Available skills: ${available}`
            }
          ],
          isError: true
        };
      }
      return {
        content: [
          {
            type: "text",
            text: skill.rawContent
          }
        ]
      };
    }
    case "skills_search": {
      const { query, tags, limit } = args2;
      const results = skillsManager.search(query, tags, limit || 5);
      if (results.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No skills found matching "${query}".`
            }
          ]
        };
      }
      const formatted = results.map(
        (s, i) => `${i + 1}. **${s.name}**
   ${s.description}`
      ).join("\n\n");
      return {
        content: [
          {
            type: "text",
            text: `# Search Results for "${query}" (${results.length})

${formatted}

Use \`skills_get\` with the skill name to get the full content.`
          }
        ]
      };
    }
    default:
      return {
        content: [
          {
            type: "text",
            text: `Unknown tool: ${name}`
          }
        ],
        isError: true
      };
  }
});
async function runMcpServer() {
  console.error("Starting @skullrender/mcp-skills server...");
  console.error(`Skills path: ${skillsManager.getSkillsPath()}`);
  await skillsManager.loadSkills();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Skills Server running on stdio");
}

// src/cli.ts
import * as fs2 from "fs";
import * as path2 from "path";
import * as os from "os";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
var [, , command, ...args] = process.argv;
async function setupClaudeCode() {
  const configDir = path2.join(os.homedir(), ".claude");
  const configPath = path2.join(configDir, "settings.json");
  if (!fs2.existsSync(configDir)) {
    fs2.mkdirSync(configDir, { recursive: true });
  }
  let config = {};
  if (fs2.existsSync(configPath)) {
    try {
      const current = fs2.readFileSync(configPath, "utf8");
      config = JSON.parse(current);
    } catch (e) {
      console.error("Failed to parse settings.json", e);
    }
  }
  if (!config.mcpServers)
    config.mcpServers = {};
  const executablePath = path2.resolve(__dirname, "cli.js");
  const skillsPath = path2.resolve(__dirname, "../skills");
  config.mcpServers["skullrender-skills"] = {
    command: "node",
    args: [executablePath, "mcp"],
    env: {
      SKILLS_PATH: skillsPath
    }
  };
  fs2.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
  console.log(`[+] Added skullrender-skills to Claude Code MCP config at ${configPath}`);
}
async function setupClaudeDesktop() {
  const appData = process.env.APPDATA || (process.platform === "darwin" ? process.env.HOME + "/Library/Application Support" : "/var/local");
  const configDir = path2.join(appData, "Claude");
  const configPath = path2.join(configDir, "claude_desktop_config.json");
  if (!fs2.existsSync(configDir)) {
    fs2.mkdirSync(configDir, { recursive: true });
  }
  let config = {};
  if (fs2.existsSync(configPath)) {
    try {
      config = JSON.parse(fs2.readFileSync(configPath, "utf8"));
    } catch (e) {
    }
  }
  if (!config.mcpServers)
    config.mcpServers = {};
  const executablePath = path2.resolve(__dirname, "cli.js");
  const skillsPath = path2.resolve(__dirname, "../skills");
  config.mcpServers["skullrender-skills"] = {
    command: "node",
    args: [executablePath, "mcp"],
    env: {
      SKILLS_PATH: skillsPath
    }
  };
  fs2.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
  console.log(`[+] Added skullrender-skills to Claude Desktop at ${configPath}`);
  console.log("[!] Please restart Claude Desktop completely.");
}
async function main() {
  if (command === "mcp") {
    await runMcpServer();
  } else if (command === "setup") {
    const agent = args[0];
    if (agent === "claude-code") {
      await setupClaudeCode();
    } else if (agent === "claude-desktop") {
      await setupClaudeDesktop();
    } else {
      console.log("Supported agents: claude-code, claude-desktop");
    }
  } else {
    console.log(`SkullRender MCP Skills Server`);
    console.log(`Usage:`);
    console.log(`  skullrender-skills mcp                      Start the MCP Server`);
    console.log(`  skullrender-skills setup claude-code        Configure Claude Code (CLI)`);
    console.log(`  skullrender-skills setup claude-desktop     Configure Claude Desktop`);
  }
}
main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
