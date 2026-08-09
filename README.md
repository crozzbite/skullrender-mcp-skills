# 💀 SkullRender Skills Pack MVP (Node Version)

Professional AI Skills ecosystem for Claude. Inspired by the zero-friction deployment of tools like `engram`, this MCP server configures itself automatically into your AI Agent of choice.

## 🚀 Easy Installation (Global Bun)

1. **Clone** this repository to your computer.
2. **Install globally**:
```bash
bun link
```
3. **Setup your agent** (skills from this repo's `./skills`):
```bash
bun run skullrender-skills setup claude-code
# OR
skullrender-skills setup claude-desktop
```

   **Usar skills/rules desde WorkSpace (una sola fuente de verdad):** antes del setup, define `SKILLS_PATH` apuntando a la carpeta de skills de WorkSpace; el MCP cargará desde ahí:
```powershell
# PowerShell (Windows)
$env:SKILLS_PATH = "C:\path\to\WorkSpace\.agents\skills"
bun run skullrender-skills setup claude-code
```
```bash
# Bash
export SKILLS_PATH="/ruta/a/WorkSpace/.agents/skills"
bun run skullrender-skills setup claude-code
```
4. **Rebuild** si cambiaste `src/`: `bun run bundle`. Luego reinicia el agente o Claude Desktop.

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
