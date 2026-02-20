#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { SkillsManager } from './skills-manager.js';

const skillsManager = new SkillsManager();

const server = new Server(
  {
    name: '@skullrender/mcp-skills',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'skills_list',
        description: 'List all available AI agent skills with their metadata.',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'skills_get',
        description: 'Get the full content of a specific skill by name. Returns the complete SKILL.md content including all patterns, examples, and instructions.',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'The name of the skill to retrieve (e.g., "angular", "typescript", "pytest")',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'skills_search',
        description: 'Search for skills by query text. Searches in skill names, descriptions, and content.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query (e.g., "testing", "react forms", "API validation")',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optional tags to filter results',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results to return (default: 5)',
            },
          },
          required: ['query'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'skills_list': {
      const skills = skillsManager.list();
      const formatted = skills.map(s => 
        `• **${s.name}** (v${s.version || '1.0'})\n  ${s.description}`
      ).join('\n\n');
      
      return {
        content: [
          {
            type: 'text',
            text: `# Available Skills (${skills.length})\n\n${formatted}`,
          },
        ],
      };
    }

    case 'skills_get': {
      const skillName = (args as { name: string }).name;
      const skill = skillsManager.get(skillName);
      
      if (!skill) {
        const available = skillsManager.list().map(s => s.name).join(', ');
        return {
          content: [
            {
              type: 'text',
              text: `Skill "${skillName}" not found.\n\nAvailable skills: ${available}`,
            },
          ],
          isError: true,
        };
      }
      
      return {
        content: [
          {
            type: 'text',
            text: skill.rawContent,
          },
        ],
      };
    }

    case 'skills_search': {
      const { query, tags, limit } = args as { query: string; tags?: string[]; limit?: number };
      const results = skillsManager.search(query, tags, limit || 5);
      
      if (results.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `No skills found matching "${query}".`,
            },
          ],
        };
      }
      
      const formatted = results.map((s, i) => 
        `${i + 1}. **${s.name}**\n   ${s.description}`
      ).join('\n\n');
      
      return {
        content: [
          {
            type: 'text',
            text: `# Search Results for "${query}" (${results.length})\n\n${formatted}\n\nUse \`skills_get\` with the skill name to get the full content.`,
          },
        ],
      };
    }

    default:
      return {
        content: [
          {
            type: 'text',
            text: `Unknown tool: ${name}`,
          },
        ],
        isError: true,
      };
  }
});

export async function runMcpServer() {
  console.error('Starting @skullrender/mcp-skills server...');
  console.error(`Skills path: ${skillsManager.getSkillsPath()}`);
  
  await skillsManager.loadSkills();
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('MCP Skills Server running on stdio');
}

