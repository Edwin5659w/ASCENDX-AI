#Requires -Version 5.1
<#
  ASCENDX AI - arranque de desarrollo en Windows con un solo clic.

  Hace todo lo necesario para correr el proyecto en este computador:
    1. Verifica Node.js (lo instala con winget si falta).
    2. Crea los archivos .env si no existen.
    3. Instala dependencias (solo la primera vez).
    4. Inicia una base de datos PostgreSQL local con "prisma dev" (no hay que instalar PostgreSQL).
    5. Crea las tablas y carga las categorías iniciales.
    6. Abre la API y la app en ventanas separadas.
#>

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $Root 'apps\api'
$Mobile = Join-Path $Root 'apps\mobile'
$DatabaseUrl = 'postgres://postgres:postgres@localhost:51214/template1?sslmode=disable'

function Paso($texto) { Write-Host "`n==> $texto" -ForegroundColor Cyan }
function Ok($texto) { Write-Host "    $texto" -ForegroundColor Green }
function Aviso($texto) { Write-Host "    $texto" -ForegroundColor Yellow }

function Actualizar-Path {
  $env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' +
              [System.Environment]::GetEnvironmentVariable('Path', 'User')
}

function Ejecutar($comando, $carpeta) {
  Push-Location $carpeta
  try {
    cmd /c $comando
    if ($LASTEXITCODE -ne 0) { throw "Falló el comando: $comando" }
  } finally {
    Pop-Location
  }
}

function Secreto-Aleatorio {
  $bytes = New-Object byte[] 48
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  return ([Convert]::ToBase64String($bytes) -replace '[+/=]', 'x')
}

function IP-Local {
  $ip = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object {
      $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and
      $_.InterfaceAlias -notmatch 'vEthernet|WSL|VirtualBox|VMware|Loopback|Bluetooth'
    } |
    Sort-Object -Property @{ Expression = { if ($_.InterfaceAlias -match 'Wi-?Fi|Wireless|Ethernet') { 0 } else { 1 } } } |
    Select-Object -First 1 -ExpandProperty IPAddress
  if (-not $ip) { $ip = 'localhost' }
  return $ip
}

Write-Host '==============================================' -ForegroundColor Cyan
Write-Host '           ASCENDX AI - Iniciar proyecto      ' -ForegroundColor Cyan
Write-Host '==============================================' -ForegroundColor Cyan

# 1. Node.js -----------------------------------------------------------------
Paso 'Verificando Node.js'
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Aviso 'Node.js no está instalado. Instalándolo con winget (puede pedir permiso)...'
  winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
  Actualizar-Path
  if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Aviso 'Node.js se instaló, pero esta ventana no lo detecta todavía.'
    Aviso 'Cierra esta ventana y vuelve a abrir INICIAR.bat.'
    exit 1
  }
}
$nodeVersion = (node -v)
$nodeMajor = [int]($nodeVersion.TrimStart('v').Split('.')[0])
if ($nodeMajor -lt 20) {
  Aviso "Tienes Node.js $nodeVersion. Se necesita la versión 20 o superior."
  Aviso 'Actualízalo con: winget upgrade OpenJS.NodeJS.LTS'
  exit 1
}
Ok "Node.js $nodeVersion"

# 2. Archivos .env -----------------------------------------------------------
Paso 'Configurando variables de entorno'
$backendEnv = Join-Path $Backend '.env'
# Migración desde la estructura anterior (backend/ y mobile/ en la raíz).
$oldEnv = Join-Path $Root 'backend\.env'
if ((Test-Path $oldEnv) -and -not (Test-Path $backendEnv)) {
  Move-Item $oldEnv $backendEnv
  Ok 'Se movió backend\.env a apps\api\.env (nueva estructura del proyecto)'
}
if (-not (Test-Path $backendEnv)) {
  $secreto = Secreto-Aleatorio
  @(
    'NODE_ENV=development',
    'PORT=4000',
    "DATABASE_URL=`"$DatabaseUrl`"",
    "JWT_ACCESS_SECRET=$secreto",
    'ACCESS_TOKEN_TTL_MINUTES=15',
    'REFRESH_TOKEN_TTL_DAYS=30',
    'CORS_ORIGINS=http://localhost:8081',
    'LOG_LEVEL=info'
  ) | Set-Content -Path $backendEnv -Encoding ascii
  Ok 'apps\api\.env creado'
} else {
  Ok 'apps\api\.env ya existe (no se modifica)'
}

$ip = IP-Local
@(
  '# Generado por scripts/iniciar.ps1 con la IP actual de este computador.',
  "EXPO_PUBLIC_API_URL=http://${ip}:4000/api"
) | Set-Content -Path (Join-Path $Mobile '.env') -Encoding ascii
Ok "apps\mobile\.env apunta a http://${ip}:4000/api"

# 3. Dependencias --------------------------------------------------------------
Paso 'Revisando dependencias (la primera vez tarda unos minutos)'
# Monorepo: una sola instalación en la raíz para apps/api, apps/mobile y
# packages/finance-core. Se ejecuta siempre: si no hay cambios tarda segundos,
# y si se agregaron librerías (por ejemplo tras un git pull) las instala.
# Al instalar también se compila packages/finance-core.
Ejecutar 'npm install --no-audit --no-fund' $Root

# 4. Base de datos -------------------------------------------------------------
Paso 'Iniciando la base de datos local (prisma dev)'
Ejecutar 'npx prisma dev -n ascendx --detach' $Backend
Ok 'Base de datos en localhost:51214'

# 5. Tablas y datos iniciales --------------------------------------------------
Paso 'Preparando tablas y categorías'
Ejecutar 'npx prisma generate' $Backend
Ejecutar 'npx prisma migrate deploy' $Backend
Ejecutar 'npm run db:seed' $Backend

# 6. API y app -----------------------------------------------------------------
Paso 'Abriendo la API y la app'
Start-Process powershell -WorkingDirectory $Backend -ArgumentList @(
  '-NoExit', '-Command', "`$Host.UI.RawUI.WindowTitle = 'ASCENDX - API'; npm run dev"
)
Start-Sleep -Seconds 4
Start-Process powershell -WorkingDirectory $Mobile -ArgumentList @(
  '-NoExit', '-Command', "`$Host.UI.RawUI.WindowTitle = 'ASCENDX - App'; npx expo start -c --web"
)

Write-Host ''
Write-Host '==============================================' -ForegroundColor Green
Write-Host '  Listo. Se abrieron dos ventanas:' -ForegroundColor Green
Write-Host '   - "ASCENDX - API": el servidor (http://localhost:4000/api/health)'
Write-Host '   - "ASCENDX - App": la app. Se abrirá en el navegador.'
Write-Host ''
Write-Host '  Para verla en tu celular: instala Expo Go desde Play Store,'
Write-Host '  conéctate al mismo Wi-Fi y escanea el código QR de la ventana "App".'
Write-Host ''
Write-Host '  Para apagar todo: cierra las dos ventanas y ejecuta DETENER.bat'
Write-Host '==============================================' -ForegroundColor Green
