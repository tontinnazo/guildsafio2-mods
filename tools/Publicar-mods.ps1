$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
$repository = 'tontinnazo/guildsafio2-mods'
$gh = Join-Path $PSScriptRoot 'gh.exe'
function Run-Gh([string[]]$Arguments) {
    & $gh @Arguments
    if ($LASTEXITCODE -ne 0) { throw 'GitHub no pudo completar la operacion. La publicacion nueva permanece en borrador.' }
}
& $gh auth status *> $null
if ($LASTEXITCODE -ne 0) { Run-Gh -Arguments @('auth','login','--hostname','github.com','--git-protocol','https','--web','--skip-ssh-key') }
$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
$dialog.Description = 'Selecciona la instancia que contiene mods, resourcepacks y shaderpacks'
$dialog.SelectedPath = Join-Path $env:LOCALAPPDATA 'Guildsafio2Launcher\data\Forge 1.20.1'
if ($dialog.ShowDialog() -ne [Windows.Forms.DialogResult]::OK) { exit 0 }
$source = $dialog.SelectedPath
$files = @()
foreach ($directory in @('mods','resourcepacks','shaderpacks')) {
    $folder = Join-Path $source $directory
    if (-not (Test-Path -LiteralPath $folder)) { continue }
    $extension = if ($directory -eq 'mods') { '.jar' } else { '.zip' }
    foreach ($file in (Get-ChildItem -LiteralPath $folder -File | Where-Object { $_.Extension -ieq $extension })) {
        if ($file.Length -lt 1 -or $file.Length -ge 2GB -or $file.Name.Length -gt 180 -or $file.Name -match '[<>:"/\\|?*\x00-\x1f]' -or $file.Name -match '^(con|prn|aux|nul|com[0-9]|lpt[0-9])\.') { throw "Archivo no compatible: $($file.Name)" }
        $files += @{source=$file.FullName;name=$file.Name;directory=$directory;extension=$extension}
    }
}
if (@($files | Where-Object { $_.directory -eq 'mods' }).Count -eq 0) { throw 'La instancia seleccionada no contiene mods .jar.' }
if ($files.Count -gt 990) { throw 'Demasiados archivos para una Release.' }
$answer = [Windows.Forms.MessageBox]::Show("Se publicaran $($files.Count) archivos: mods, texturas y shaders.`n$source`n`nEsta sera la lista completa de los jugadores. Los archivos que falten se retiraran de sus carpetas activas y quedaran en respaldo. Continuar?", 'Publicar paquete Guildsafio 2', 'YesNo', 'Question')
if ($answer -ne [Windows.Forms.DialogResult]::Yes) { exit 0 }
$tag = 'pack-' + (Get-Date).ToUniversalTime().ToString('yyyyMMdd-HHmmss') + '-' + [guid]::NewGuid().ToString('N').Substring(0,6)
$staging = Join-Path ([IO.Path]::GetTempPath()) ('Guildsafio-publicar-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $staging | Out-Null
foreach ($file in $files) {
    Write-Host ('Preparando ' + $file.directory + '/' + $file.name)
    $hash = (Get-FileHash -LiteralPath $file.source -Algorithm SHA256).Hash.ToLowerInvariant()
    $file.copy = Join-Path $staging ($file.directory + '-' + $hash + $file.extension)
    Copy-Item -LiteralPath $file.source -Destination $file.copy
    if ((Get-FileHash -LiteralPath $file.copy -Algorithm SHA256).Hash.ToLowerInvariant() -ne $hash) { throw 'Un archivo cambio durante la preparacion. Ejecuta de nuevo.' }
}
$notes = Join-Path $staging 'notes.txt'
[IO.File]::WriteAllText($notes, "Paquete completo de Guildsafio 2: $($files.Count) archivos de mods, texturas y shaders.")
Run-Gh -Arguments @('release','create',$tag,'--repo',$repository,'--draft','--title',"Paquete Guildsafio 2 - $tag",'--notes-file',$notes)
foreach ($file in $files) {
    Write-Host ('Subiendo ' + $file.directory + '/' + $file.name)
    Run-Gh -Arguments @('release','upload',$tag,($file.copy + '#' + $file.directory + '/' + $file.name),'--repo',$repository)
}
Run-Gh -Arguments @('release','edit',$tag,'--repo',$repository,'--draft=false','--latest')
Write-Host "Paquete publicado: https://github.com/$repository/releases/tag/$tag" -ForegroundColor Green
[Windows.Forms.MessageBox]::Show('Paquete publicado. Los jugadores lo verificaran antes de jugar.', 'Guildsafio 2') | Out-Null
