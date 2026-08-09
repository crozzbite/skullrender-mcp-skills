#!/usr/bin/env node
import { runMcpServer } from './index.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const [, , command, ...args] = process.argv;

const DEFAULT_SKILLS_PATH = path.resolve(__dirname, '../skills');

function resolveSkillsPath(): string {
  // Explicit arg: --skills-path <path> or single positional path
  if (args[0] === '--skills-path' && args[1]) {
    return path.resolve(args[1]);
  }
  if (args[0] && args[0] !== '--skills-path' && (args[0].includes(path.sep) || args[0].startsWith('C:'))) {
    return path.resolve(args[0]);
  }
  return process.env.SKILLS_PATH || DEFAULT_SKILLS_PATH;
}

async function setupClaudeCode() {
  const configDir = path.join(os.homedir(), '.claude');
  const configPath = path.join(configDir, 'settings.json');

  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  let config: any = {};
  if (fs.existsSync(configPath)) {
    try {
      const current = fs.readFileSync(configPath, 'utf8');
      config = JSON.parse(current);
    } catch (e) {
      console.error('Failed to parse settings.json', e);
    }
  }

  if (!config.mcpServers) config.mcpServers = {};

  const executablePath = path.resolve(__dirname, 'cli.js');
  const skillsPath = process.env.SKILLS_PATH || path.resolve(__dirname, '../skills');

  // Pass path as argument so it works even if the host doesn't inject env
  config.mcpServers['skullrender-skills'] = {
    command: 'node',
    args: [executablePath, 'mcp', skillsPath],
    env: {
      SKILLS_PATH: skillsPath
    }
  };

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  console.log(`[+] Added skullrender-skills to Claude Code MCP config at ${configPath}`);
  console.log(`[+] SKILLS_PATH = ${skillsPath}`);
}

async function setupClaudeDesktop() {
  const appData = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : '/var/local');
  const configDir = path.join(appData, 'Claude');
  const configPath = path.join(configDir, 'claude_desktop_config.json');

  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  let config: any = {};
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (e) {}
  }

  if (!config.mcpServers) config.mcpServers = {};

  const executablePath = path.resolve(__dirname, 'cli.js');
  const skillsPath = process.env.SKILLS_PATH || path.resolve(__dirname, '../skills');

  // Pass path as argument so Claude Desktop doesn't need to inject env
  config.mcpServers['skullrender-skills'] = {
    command: 'node',
    args: [executablePath, 'mcp', skillsPath],
    env: {
      SKILLS_PATH: skillsPath
    }
  };

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  console.log(`[+] Added skullrender-skills to Claude Desktop at ${configPath}`);
  console.log(`[+] SKILLS_PATH = ${skillsPath}`);
  console.log('[!] Please restart Claude Desktop completely.');
}

async function main() {
  if (command === 'mcp') {
    const skillsPath = resolveSkillsPath();
    await runMcpServer(skillsPath);
  } else if (command === 'setup') {
    const agent = args[0];
    if (agent === 'claude-code') {
      await setupClaudeCode();
    } else if (agent === 'claude-desktop') {
      await setupClaudeDesktop();
    } else {
      console.log('Supported agents: claude-code, claude-desktop');
    }
  } else {
    console.log(`SkullRender MCP Skills Server`);
    console.log(`Usage:`);
    console.log(`  node cli.js mcp [path]              Start MCP (path = SKILLS_PATH or env or ./skills)`);
    console.log(`  node cli.js mcp --skills-path <path>`);
    console.log(`  node cli.js setup claude-code      Configure Claude Code`);
    console.log(`  node cli.js setup claude-desktop  Configure Claude Desktop`);
  }
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
