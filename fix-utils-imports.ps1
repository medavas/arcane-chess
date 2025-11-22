# Fix remaining utils imports

$projectRoot = "c:\Users\rubix\OneDrive\Documents\projects\arcane-chess\src"

Write-Host "Fixing utils imports..."

$files = Get-ChildItem -Path $projectRoot -Recurse -Include *.tsx,*.ts -File

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    $content = $content -replace "from ['\`"]src/utils/", "from 'src/shared/utils/"
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Fixed: $($file.Name)"
    }
}

Write-Host "Utils import fix complete!"
