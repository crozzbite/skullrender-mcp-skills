@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo    SkullRender Skills Pack - Installer
echo ==========================================
echo.

:: Obtener la ruta absoluta de la carpeta actual
set "PACK_PATH=%~dp0"
set "EXE_PATH=%PACK_PATH%bin\mcp-skills.exe"
set "SKILLS_PATH=%PACK_PATH%skills"

:: Normalizar rutas para JSON (cambiar \ por /)
set "EXE_PATH_JSON=%EXE_PATH:\=/%"
set "SKILLS_PATH_JSON=%SKILLS_PATH:\=/%"

:: Ruta del config de Claude Desktop
set "CLAUDE_CONFIG=%APPDATA%\Claude\claude_desktop_config.json"

echo [+] Detectando Claude Desktop...
if not exist "%CLAUDE_CONFIG%" (
    echo [!] No se encontro el archivo de configuracion de Claude.
    echo [!] Asegurate de haber instalado Claude Desktop primero.
    pause
    exit /b
)

echo [+] Creando copia de seguridad...
copy "%CLAUDE_CONFIG%" "%CLAUDE_CONFIG%.bak" > nul

echo [+] Instalando SkullRender Skills...
echo.

:: NOTA: Esto es una simplificación. Un script real de PowerShell es mejor para editar JSON.
powershell -Command "$config = Get-Content -Raw '%CLAUDE_CONFIG%' | ConvertFrom-Json; if (-not $config.mcpServers) { $config | Add-Member -MemberType NoteProperty -Name 'mcpServers' -Value @{} }; $config.mcpServers | Add-Member -MemberType NoteProperty -Name 'skullrender-skills' -Value @{ command = '%EXE_PATH_JSON%'; args = @(); env = @{ SKILLS_PATH = '%SKILLS_PATH_JSON%' } } -Force; $config | ConvertTo-Json -Depth 10 | Set-Content '%CLAUDE_CONFIG%'"

if %ERRORLEVEL% EQU 0 (
    echo [OK] Instalacion completada con exito.
    echo [!] Por favor, REINICIA Claude Desktop para activar las nuevas skills.
) else (
    echo [X] Error durante la instalacion. Verifica los permisos.
)

echo.
pause
