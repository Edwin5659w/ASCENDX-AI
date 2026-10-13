#Requires -Version 5.1
<#
  ASCENDX AI - abre solo la app, conectada al servidor en la nube (Render + Neon).
  No inicia la base de datos ni la API en este computador.

  La dirección del servidor se guarda en scripts\servidor-nube.txt.
#>

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$Mobile = Join-Path $Root 'apps\mobile'
$UrlFile = Join-Path $PSScriptRoot 'servidor-nube.txt'

function Paso($texto) { Write-Host "`n==> $texto" -ForegroundColor Cyan }
function Ok($texto) { Write-Host "    $texto" -ForegroundColor Green }
function Aviso($texto) { Write-Host "    $texto" -ForegroundColor Yellow }

Write-Host '==============================================' -ForegroundColor Cyan
Write-Host '     ASCENDX AI - App conectada a la nube     ' -ForegroundColor Cyan
Write-Host '==============================================' -ForegroundColor Cyan

# 1. Dirección del servidor ----------------------------------------------------
Paso 'Leyendo la dirección del servidor en la nube'
$url = ''
if (Test-Path $UrlFile) {
  $url = (Get-Content $UrlFile | Where-Object { $_ -match '^https://' } | Select-Object -First 1)
}
if (-not $url) {
  Aviso 'Todavía no hay dirección guardada.'
  $url = Read-Host '    Pega la dirección de Render (por ejemplo https://ascendx-api.onrender.com)'
}
$url = $url.Trim().TrimEnd('/')
if ($url -notmatch '^https://') { Aviso 'La dirección debe empezar por https://'; exit 1 }
if ($url -notmatch '/api$') { $url = "$url/api" }
Set-Content -Path $UrlFile -Value $url -Encoding ascii
Ok "Servidor: $url"

# 2. Despertar el servidor (el plan gratis se duerme tras 15 min sin uso) ------
Paso 'Despertando el servidor (puede tardar hasta 1 minuto)'
$listo = $false
for ($i = 0; $i -lt 12 -and -not $listo; $i++) {
  try {
    $r = Invoke-RestMethod -Uri "$url/health" -TimeoutSec 15
    if ($r.status -eq 'ok') { $listo = $true }
  } catch { Start-Sleep -Seconds 5 }
}
if ($listo) { Ok 'El servidor respondió' } else { Aviso 'El servidor no respondió todavía; la app lo intentará de nuevo.' }

# 3. Configurar y abrir la app -------------------------------------------------
@(
  '# Generado por scripts/iniciar-nube.ps1: la app usa el servidor en la nube.',
  "EXPO_PUBLIC_API_URL=$url"
) | Set-Content -Path (Join-Path $Mobile '.env') -Encoding ascii

Paso 'Revisando dependencias'
Push-Location $Root
try { cmd /c 'npm install --no-audit --no-fund'; if ($LASTEXITCODE -ne 0) { throw 'Falló npm install' } } finally { Pop-Location }

Paso 'Abriendo la app'
Start-Process powershell -WorkingDirectory $Mobile -ArgumentList @(
  '-NoExit', '-Command', "`$Host.UI.RawUI.WindowTitle = 'ASCENDX - App (nube)'; npx expo start -c"
)

Write-Host ''
Write-Host '==============================================' -ForegroundColor Green
Write-Host '  Listo. Escanea el código QR de la ventana' -ForegroundColor Green
Write-Host '  "ASCENDX - App (nube)" con Expo Go.'
Write-Host '  Los datos se guardan en la nube: no necesitas la ventana API.'
Write-Host '==============================================' -ForegroundColor Green
