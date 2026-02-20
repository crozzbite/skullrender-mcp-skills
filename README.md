# 💀 SkullRender Skills Pack MVP (Node Version)

Professional AI Skills ecosystem for Claude. Inspired by the zero-friction deployment of tools like `engram`, this MCP server configures itself automatically into your AI Agent of choice.

## 🚀 Easy Installation (Global Bun)

1. **Clone** this repository to your computer.
2. **Install globally**:
```bash
bun link
```
3. **Setup your agent**:
```bash
bun run skullrender-skills setup claude-code
# OR
skullrender-skills setup claude-desktop
```
4. **Done!** The server is now registered correctly. (Restart your agent or Claude Desktop).

## 📦 Architecture
- Uses ESBuild to compile a single lightweight javascript chunk.
- Auto-injects configuration into `~/.claude/settings.json` or `%APPDATA%\Claude\claude_desktop_config.json`.
- Dynamically resolves the `SKILLS_PATH` so you don't need to copy files into system folders.
- **Node.js** is required.

## 📝 Available Skills
- **pensamiento-socratico**: Deep creativity and problem solving.
- **impresion-3d**: Troubleshooting and 3D print optimization.
- **arte-digital**: Color theory, composition, and digital workflow.
- **angular / typescript / react / nextjs**: Modern software development.
- ... and 11 more professional skills.

## 🛠️ Usage Examples
Ask Claude:
- *"Use the socratic thinking skill to help me with my new project."*
- *"I have a 3D printing issue, what does the skill suggest?"*
- *"Analyze my composition using the digital art skill."*

---

**Developed by SkullRender**
*Rational Creativity: Bones + Brain.*
