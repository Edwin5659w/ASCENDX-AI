# ASCENDX AI - detiene la base de datos local iniciada por iniciar.ps1.
# La API y la app se detienen cerrando sus ventanas.
$Backend = Join-Path (Split-Path -Parent $PSScriptRoot) 'backend'
Push-Location $Backend
try {
  cmd /c 'npx prisma dev stop ascendx'
  Write-Host 'Base de datos detenida. Tus datos se conservan para la próxima vez.' -ForegroundColor Green
} finally {
  Pop-Location
}
