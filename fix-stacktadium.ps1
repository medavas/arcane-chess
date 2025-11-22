# Fix stacktadium imports - they should reference engine folder

$projectRoot = "c:\Users\rubix\OneDrive\Documents\projects\arcane-chess\src"

Write-Host "Fixing stacktadium imports (should be engine)..."

$files = Get-ChildItem -Path $projectRoot -Recurse -Include *.tsx,*.ts -File

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    $content = $content -replace "from 'src/features/game/stacktadium/", "from 'src/features/game/engine/"
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Fixed: $($file.Name)"
    }
}

Write-Host "Stacktadium import fix complete!"
