# @skullrender/mcp-skills

MCP server that exposes AI agent skills to Claude Desktop and other MCP clients.

## Features

- 📋 **List Skills** - Get all available skills with metadata
- 📖 **Get Skill** - Retrieve the full content of any skill
- 🔍 **Search Skills** - Find skills by query or tags

## Installation

```bash
npm install @skullrender/mcp-skills
```

Or run directly:

```bash
npx @skullrender/mcp-skills
```

## Configuration

### Claude Desktop

Add to your `%APPDATA%\Claude\claude_desktop_config.json` (Windows) or `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac):

```json
{
  "mcpServers": {
    "skills": {
      "command": "npx",
      "args": ["@skullrender/mcp-skills"],
      "env": {
        "SKILLS_PATH": "C:/path/to/your/skills"
      }
    }
  }
}
```

### Local Development

```json
{
  "mcpServers": {
    "skills": {
      "command": "node",
      "args": ["C:/Users/HP/.gemini/antigravity/playground/skullrender-mcp-skills/dist/index.js"],
      "env": {
        "SKILLS_PATH": "C:/Users/HP/.gemini/antigravity/playground/phylactery/brain/Gentleman-Skills/curated"
      }
    }
  }
}
```

## Tools

### `skills_list`

List all available skills.

**Example Response:**
```
# Available Skills (16)

• **angular** (v1.0)
  Angular 17+ with Signals, Standalone Components, and modern Control Flow.

• **typescript** (v1.0)
  TypeScript best practices and patterns.
...
```

### `skills_get`

Get the full content of a specific skill.

**Input:**
```json
{
  "name": "angular"
}
```

**Response:** Full SKILL.md content with all patterns and examples.

### `skills_search`

Search for skills by query.

**Input:**
```json
{
  "query": "testing",
  "limit": 5
}
```

**Response:** List of matching skills ordered by relevance.

## Skill Format

Skills must follow this format:

```markdown
---
name: skill-name
description: >
  What the skill does.
  Trigger: When to use this skill.
metadata:
  author: your-name
  version: "1.0"
---

## When to Use
...

## Critical Patterns
...
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Test with MCP Inspector
npm run inspect

# Run in development mode
npm run dev
```

## License

MIT - SkullRender
