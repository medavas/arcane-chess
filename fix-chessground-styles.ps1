# Fix chessground styles imports

$projectRoot = "c:\Users\rubix\OneDrive\Documents\projects\arcane-chess\src"

Write-Host "Fixing chessground styles imports..."

$files = Get-ChildItem -Path $projectRoot -Recurse -Include *.ts,*.tsx -File

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    $content = $content -replace "import ['\`"]src/chessground/styles/", "import 'src/features/game/board/styles/"
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Fixed: $($file.Name)"
    }
}

Write-Host "Chessground styles import fix complete!"
