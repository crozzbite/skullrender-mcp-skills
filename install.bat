@echo off
setlocal

echo ===========================================
echo    SkullRender Skills Pack v1.2 (PRO)
echo ===========================================
echo.

:: 1. Definir rutas permanentes
set "TARGET_ROOT=%LOCALAPPDATA%\SkullRender"
set "INSTALL_DIR=%TARGET_ROOT%\mcp-skills"
set "SOURCE_DIR=%~dp0"
set "SOURCE_DIR=%SOURCE_DIR:~0,-1%"

echo [+] Iniciando instalacion en: %INSTALL_DIR%

:: 2. Crear directorios si no existen
if not exist "%TARGET_ROOT%" mkdir "%TARGET_ROOT%"
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

:: 3. Desplegar archivos (si no estamos ya en la carpeta de destino)
if /I "%SOURCE_DIR%" NEQ "%INSTALL_DIR%" (
    echo [+] Copiando archivos del sistema...
    xcopy /S /E /Y /I "%SOURCE_DIR%\*" "%INSTALL_DIR%\" >nul
)

:: 4. Validar archivos criticos en el destino
set "EXE_PATH=%INSTALL_DIR%\bin\mcp-skills.exe"
set "SKILLS_DIR=%INSTALL_DIR%\skills"

if not exist "%EXE_PATH%" (
    echo [X] Error: No se pudo verificar el ejecutable en el destino.
    echo     Ruta esperada: %EXE_PATH%
    pause
    exit /b
)

echo [+] Archivos verificados. Configurando Claude Desktop...

:: 5. Usar PowerShell para actualizar el JSON de forma segura (Rutas Permanentes)
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$path = \"$env:APPDATA\Claude\claude_desktop_config.json\";" ^
    "$exe = '%EXE_PATH%';" ^
    "$skills = '%SKILLS_DIR%';" ^
    "if (-not (Test-Path $path)) { " ^
    "  if (-not (Test-Path (Split-Path $path))) { New-Item -ItemType Directory -Path (Split-Path $path) -Force | Out-Null };" ^
    "  '{}' | Set-Content $path -Encoding UTF8" ^
    "};" ^
    "$config = Get-Content $path -Raw | ConvertFrom-Json;" ^
    "if ($null -eq $config) { $config = @{} };" ^
    "if (-not $config.mcpServers) { $config | Add-Member -MemberType NoteProperty -Name 'mcpServers' -Value @{} };" ^
    "$mcp = @{ command = $exe; env = @{ SKILLS_PATH = $skills } };" ^
    "if ($config.mcpServers.PSObject.Properties['skullrender-skills']) { " ^
    "  $config.mcpServers.'skullrender-skills' = $mcp " ^
    "} else { " ^
    "  $config.mcpServers | Add-Member -MemberType NoteProperty -Name 'skullrender-skills' -Value $mcp " ^
    "};" ^
    "$json = $config | ConvertTo-Json -Depth 20;" ^
    "[System.IO.File]::WriteAllText($path, $json, [System.Text.Encoding]::UTF8);"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===========================================
    echo [OK] INSTALACION FINALIZADA CON EXITO
    echo ===========================================
    echo.
    echo [+] Ubicacion del Pack: %INSTALL_DIR%
    echo [+] JSON Configurado en: %%APPDATA%%\Claude\
    echo.
    echo [!] IMPORTANTE: Reinicia Claude Desktop completamente.
    echo [!] Ya puedes borrar la carpeta de Descargas/Escritorio si quieres.
    echo.
) else (
    echo.
    echo [X] Error durante la instalacion. Verifica permisos de escritura.
    echo.
)

pause
