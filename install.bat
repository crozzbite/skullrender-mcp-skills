@echo off
setlocal

echo ==========================================
echo    SkullRender Skills Pack - v1.1
echo ==========================================
echo.

:: Obtener la ruta absoluta de la carpeta actual
set "BASE_DIR=%~dp0"
:: Quitar la barra invertida final
set "BASE_DIR=%BASE_DIR:~0,-1%"

set "EXE_PATH=%BASE_DIR%\bin\mcp-skills.exe"
set "SKILLS_DIR=%BASE_DIR%\skills"

:: Ruta del config de Claude Desktop
set "CLAUDE_CONFIG=%APPDATA%\Claude\claude_desktop_config.json"

echo [+] Configurando SkullRender Skills...
echo [+] Directorio detectado: %BASE_DIR%

:: Verificar que el ejecutable existe
if not exist "%EXE_PATH%" (
    echo [X] Error: No se encuentra el archivo bin\mcp-skills.exe
    echo [!] Asegurate de haber extraído el ZIP por completo.
    pause
    exit /b
)

:: Usar PowerShell para actualizar el JSON de forma segura
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$path = [System.Environment]::ExpandEnvironmentVariables('%%APPDATA%%\Claude\claude_desktop_config.json');" ^
    "$exe = '%EXE_PATH%'.Replace('\', '\\');" ^
    "$skills = '%SKILLS_DIR%'.Replace('\', '\\');" ^
    "if (-not (Test-Path $path)) { '{}' | Set-Content $path -Encoding UTF8 };" ^
    "$config = Get-Content $path | Out-String | ConvertFrom-Json;" ^
    "if (-not $config.mcpServers) { $config | Add-Member -MemberType NoteProperty -Name 'mcpServers' -Value @{} };" ^
    "$mcp = @{ command = $exe; env = @{ SKILLS_PATH = $skills } };" ^
    "if ($config.mcpServers.PSObject.Properties['skullrender-skills']) { $config.mcpServers.'skullrender-skills' = $mcp } else { $config.mcpServers | Add-Member -MemberType NoteProperty -Name 'skullrender-skills' -Value $mcp };" ^
    "$json = $config | ConvertTo-Json -Depth 20;" ^
    "[System.IO.File]::WriteAllText($path, $json, [System.Text.Encoding]::UTF8);"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [OK] Configuracion actualizada exitosamente en:
    echo      %CLAUDE_CONFIG%
    echo.
    echo [!] IMPORTANTE: Reinicia Claude Desktop completamente.
    echo.
) else (
    echo.
    echo [X] Error durante la instalacion. Verifica los permisos.
    echo.
)

pause
