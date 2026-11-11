$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
$repository = 'tontinnazo/guildsafio2-mods'
$gh = Join-Path $PSScriptRoot 'gh.exe'
if (-not (Test-Path -LiteralPath $gh)) { throw 'Falta gh.exe junto a esta herramienta.' }
function Run-Gh([string[]]$Arguments) {
    & $gh @Arguments
    if ($LASTEXITCODE -ne 0) { throw 'GitHub no pudo completar la operacion. La version anterior sigue activa si no se publico la nueva.' }
}
& $gh auth status *> $null
if ($LASTEXITCODE -ne 0) { Run-Gh -Arguments @('auth','login','--hostname','github.com','--git-protocol','https','--web','--skip-ssh-key') }
$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
$dialog.Description = 'Selecciona la carpeta COMPLETA de mods que deben tener los jugadores'
$defaultFolder = Join-Path $env:LOCALAPPDATA 'Guildsafio2Launcher\data\Forge 1.20.1\mods'
if (Test-Path -LiteralPath $defaultFolder) { $dialog.SelectedPath = $defaultFolder }
if ($dialog.ShowDialog() -ne [Windows.Forms.DialogResult]::OK) { exit 0 }
$source = $dialog.SelectedPath
$mods = @(Get-ChildItem -LiteralPath $source -File | Where-Object { $_.Extension -ieq '.jar' } | Sort-Object Name)
if ($mods.Count -eq 0) { throw 'La carpeta no contiene mods .jar. Se cancelo la publicacion.' }
if ($mods.Count -gt 990) { throw 'Demasiados mods para una sola Release de GitHub.' }
$answer = [Windows.Forms.MessageBox]::Show("Se publicaran $($mods.Count) mods desde:`n$source`n`nLos jugadores recibiran esta lista completa. Los mods que falten se retiraran de su carpeta activa y quedaran en respaldo. Continuar?", 'Publicar actualizacion de Guildsafio 2', 'YesNo', 'Question')
if ($answer -ne [Windows.Forms.DialogResult]::Yes) { exit 0 }
$tag = 'mods-' + (Get-Date).ToUniversalTime().ToString('yyyyMMdd-HHmmss') + '-' + [guid]::NewGuid().ToString('N').Substring(0,6)
$staging = Join-Path ([IO.Path]::GetTempPath()) ('Guildsafio-publicar-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $staging | Out-Null
$files = @()
foreach ($mod in $mods) {
    if ($mod.Name.Length -gt 180 -or $mod.Name -cnotmatch '^[a-zA-Z0-9][a-zA-Z0-9._+() -]*\.jar$' -or $mod.Name -match '^(con|prn|aux|nul|com[0-9]|lpt[0-9])\.') { throw "Nombre de mod no compatible: $($mod.Name)" }
    if ($mod.Length -lt 1 -or $mod.Length -ge 2GB) { throw "Tamano de mod no compatible: $($mod.Name)" }
    Write-Host ('Preparando ' + $mod.Name)
    $hash = (Get-FileHash -LiteralPath $mod.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    $asset = $hash + '.jar'
    $copy = Join-Path $staging $asset
    Copy-Item -LiteralPath $mod.FullName -Destination $copy
    if ((Get-FileHash -LiteralPath $copy -Algorithm SHA256).Hash.ToLowerInvariant() -ne $hash) { throw 'Un mod cambio durante la preparacion. Ejecuta de nuevo.' }
    $files += @{name=$mod.Name;size=$mod.Length;sha256=$hash;url="https://github.com/$repository/releases/download/$tag/$asset"}
}
$manifest = @{schemaVersion=1;version=$tag;files=$files} | ConvertTo-Json -Depth 10
[IO.File]::WriteAllText((Join-Path $staging 'mods-manifest.json'), $manifest, (New-Object Text.UTF8Encoding($false)))
$notes = Join-Path $staging 'notes.txt'
[IO.File]::WriteAllText($notes, "Paquete de $($mods.Count) mods de Guildsafio 2. Descarga y sincronizacion automatica desde el launcher v11.")
Run-Gh -Arguments @('release','create',$tag,'--repo',$repository,'--draft','--title',"Mods Guildsafio 2 - $tag",'--notes-file',$notes)
foreach ($asset in (Get-ChildItem -LiteralPath $staging -File | Where-Object { $_.Extension -eq '.jar' -or $_.Name -eq 'mods-manifest.json' })) {
    Write-Host ('Subiendo ' + $asset.Name)
    Run-Gh -Arguments @('release','upload',$tag,$asset.FullName,'--repo',$repository)
}
Run-Gh -Arguments @('release','edit',$tag,'--repo',$repository,'--draft=false','--latest')
Write-Host "Actualizacion publicada: https://github.com/$repository/releases/tag/$tag" -ForegroundColor Green
Write-Host "Copia temporal conservada en: $staging"
[Windows.Forms.MessageBox]::Show('Actualizacion publicada. Los jugadores la recibiran al abrir el launcher o antes de jugar.', 'Guildsafio 2') | Out-Null
