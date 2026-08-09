---
name: openclaw-local-setup
description: >
  Configura OpenClaw en una máquina nueva con Ollama local: detectar hardware (VRAM/RAM),
  elegir modelo y política de herramientas, validar JSON, Telegram pairing y checklist rápido.
  Usar cuando el usuario pida instalar OpenClaw, migrar a Ollama, optimizar modelo según GPU,
  o dejar un equipo listo para chatear por web/Telegram sin errores típicos.
license: Apache-2.0
metadata:
  author: skullrender
  version: "1.0.0"
compatibility: OpenClaw CLI 2026.x, Ollama, Windows/macOS/Linux.
---

# OpenClaw — setup local rápido (Ollama + hardware)

Guía para dejar **OpenClaw + Ollama** funcionando en una sola pasada, eligiendo **modelo** y **tools profile** según **VRAM/RAM**, y evitando fallos frecuentes (JSON basura, timeouts, Telegram sin respuesta).

---

## Cuándo usar esta skill

- Onboarding de un PC nuevo con OpenClaw.
- Cambiar de nube a **Ollama local** o ajustar modelo tras cambiar GPU.
- El bot **no responde** en Telegram o la UI muestra timeouts / `lane wait exceeded`.
- El modelo escupe **JSON de herramientas** en lugar de texto.

---

## 1. Recolectar hardware (obligatorio antes de elegir modelo)

Pide al usuario (o ejecuta en su máquina) estos datos:

| Dato | Windows | macOS / Linux |
|------|---------|----------------|
| VRAM dedicada | Administrador de tareas → GPU → “Memoria de GPU dedicada” | `system_profiler SPDisplaysDataType` o specs |
| RAM | Administrador de tareas → Memoria | `sysctl hw.memsize` / Acerca de |
| GPU modelo | Misma pantalla de GPU | Igual |

**Regla práctica (Ollama, cuantización típica Q4):**

| VRAM aprox. | Modelo recomendado (Ollama) | Alias sugerido | Notas |
|-------------|----------------------------|----------------|--------|
| ≤ 6 GB | `llama3.2:3b` o `phi3:mini` | `Local-Ligero-*` | Rápido; mal tool-calling → perfil `minimal` para chat |
| 8–10 GB | `llama3.1:8b`, `qwen2.5:7b`, `mistral` | `Modelo-medio-*` | Buen equilibrio calidad/velocidad |
| 12 GB | `llama3.1:8b` o `qwen2.5:14b` | `Modelo-medio-*` / `LocalPotente-*` | 14B suele caber; algo más lento |
| 16+ GB | `qwen2.5:14b`, `llama3.1:70b` no suele caber entero en 16 GB | subir según prueba | Probar con `ollama ps` y uso VRAM |

Si **CPU fuerte pero poca VRAM**, Ollama puede usar RAM (más lento); documentar el trade-off.

---

## 2. Instalación mínima (orden)

1. Instalar **Ollama** y comprobar: `ollama --version`, `ollama serve` (o servicio).
2. Instalar **OpenClaw CLI** según la doc oficial del proyecto.
3. **Modelo en Ollama:** `ollama pull <modelo>` (el elegido en la tabla).
4. Config global: `~/.openclaw/openclaw.json` (Windows: `%USERPROFILE%\.openclaw\openclaw.json`).
5. Validar: `openclaw config validate`.
6. Arrancar: `openclaw gateway` (y dejar **Ollama** corriendo).

---

## 3. Elegir modelo en OpenClaw (JSON)

Estructura recomendada en `agents.defaults`:

- `model.primary`: `"ollama/<tag-ollama>"` (ej. `ollama/qwen2.5:14b`).
- `model.fallbacks`: lista de respaldo (ej. `8b` → `3b`).
- `agents.defaults.models["ollama/<tag>"]`:
  - `alias`: nombre visible (ej. `LocalPotente-qwen2.5-14b`, `Modelo-medio-llama3.1-8b`).
  - `params` opcional: `num_ctx` (8192–32768 según VRAM), `num_predict` (máx. tokens de salida).

**Timeout de turno largo (local lento):**

- `agents.defaults.timeoutSeconds`: `600`–`900` si hay herramientas + modelo grande.

Tras editar: `openclaw config validate` y reiniciar gateway.

---

## 4. Política de herramientas (evitar JSON basura)

OpenClaw expone muchas tools en perfil `coding`. Modelos **pequeños (≤3B)** suelen **inventar** llamadas JSON.

| Situación | `tools.profile` global | `tools.byProvider.ollama` |
|-----------|-------------------------|---------------------------|
| Solo chat estable, modelo 3B | `coding` o `minimal` | **`minimal`** |
| Modelo ≥ 8B, quieres leer/editar archivos | `coding` | **`coding`** |
| Telegram / uso ligero | `coding` | `minimal` o `coding` según modelo |

Referencia de perfiles (doc OpenClaw): `minimal` ≈ casi solo estado de sesión; `coding` incluye fs, exec, sesiones, memoria, etc.

---

## 5. Ollama + OpenClaw (errores que rompen tool-calling)

- **URL base Ollama:** `http://127.0.0.1:11434` **sin** sufijo `/v1`. El modo OpenAI-compatible en local suele provocar **JSON de tools como texto plano**.
- **Auth del agente:** si aparece `No API key found for provider "ollama"`, en el `agentDir` del agente (`~/.openclaw/agents/<id>/agent/auth-profiles.json`) debe existir perfil coherente con `ollama:default` y orden:  
  `openclaw models auth order set --agent main --provider ollama ollama:default`  
  (ajustar `--agent` si no es `main`).

---

## 6. Telegram (silencio = casi siempre política DM)

1. `plugins.entries.telegram.enabled: true` y `channels.telegram.enabled: true`.
2. `channels.telegram.botToken`: token completo de BotFather.
3. **`dmPolicy: "pairing"` (default):** el usuario debe aparecer en `openclaw pairing list` y aprobar:  
   `openclaw pairing approve --channel telegram --notify <CODIGO>`
4. Grupos: si `groupPolicy: "allowlist"`, rellenar `groupAllowFrom` o usar `open` solo si se acepta el riesgo.
5. Reiniciar **gateway** tras cambiar token o flags.

---

## 7. Comandos de verificación (copiar/pegar)

```bash
openclaw config validate
openclaw models status --plain
openclaw channels list
openclaw pairing list
ollama list
```

Si hay problemas de canal:

```bash
openclaw channels status --probe
openclaw logs --follow
```

---

## 8. Checklist final (Definition of Done)

- [ ] Ollama sirve en `11434` y el modelo está en `ollama list`.
- [ ] `openclaw config validate` sin errores.
- [ ] `openclaw models status` muestra el modelo elegido.
- [ ] UI webchat responde en conversación **nueva** (contexto viejo puede confundir).
- [ ] Si Telegram: pairing aprobado o `allowlist` con IDs explícitos.
- [ ] Ningún token de bot ni API key pegado en chats públicos (rotar si se filtró).

---

## 9. Referencias externas

- OpenClaw CLI / config: `https://docs.openclaw.ai`
- Ollama: `https://ollama.com` — tags exactos de modelos pueden cambiar; confirmar con `ollama pull` / `ollama list`.

---

## Assets

- Plantilla opcional de fragmento JSON: ver [assets/openclaw-snippet.json](assets/openclaw-snippet.json).
