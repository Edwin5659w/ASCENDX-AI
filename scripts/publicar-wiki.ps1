# Publica las páginas de docs/wiki en la wiki de GitHub del proyecto.
# Requisito: haber creado una primera página de la wiki desde github.com (una sola vez).
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$wikiUrl = 'https://github.com/Edwin5659w/ASCENDX-AI.wiki.git'
$tmp = Join-Path $env:TEMP 'ascendx-wiki'

if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
Write-Host 'Descargando la wiki...'
git clone -q $wikiUrl $tmp
if ($LASTEXITCODE -ne 0) {
  Write-Host ''
  Write-Host 'No se pudo descargar la wiki. Entra a https://github.com/Edwin5659w/ASCENDX-AI/wiki,'
  Write-Host 'pulsa "Create the first page", guarda la pagina tal cual y vuelve a ejecutar este archivo.'
  exit 1
}

Copy-Item (Join-Path $repo 'docs\wiki\*.md') $tmp -Force
Push-Location $tmp
git add -A
git commit -q -m 'Wiki: documentacion de planeacion del proyecto'
git push -q origin HEAD
Pop-Location
Write-Host ''
Write-Host 'Listo. Wiki publicada en https://github.com/Edwin5659w/ASCENDX-AI/wiki'
