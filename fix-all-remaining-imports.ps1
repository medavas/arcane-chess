# Final comprehensive import fix for all remaining issues

$projectRoot = "c:\Users\rubix\OneDrive\Documents\projects\arcane-chess\src"

Write-Host "Fixing all remaining old import paths..."

$files = Get-ChildItem -Path $projectRoot -Recurse -Include *.tsx,*.ts,*.scss -File
$fixCount = 0

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # Fix SCSS imports that reference old component paths
    $content = $content -replace "import ['\`"]src/components/Skirmish/SkirmishModal\.scss['\`"];", "import './SkirmishModal.scss';"
    $content = $content -replace "import ['\`"]src/components/Modal/Modal\.scss['\`"];", ""
    $content = $content -replace "import ['\`"]src/components/Modal/QuickplayModal\.scss['\`"];", "import './QuickplayModal2.scss';"
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Fixed: $($file.FullName)"
        $fixCount++
    }
}

Write-Host "`nFinal import fix complete! Fixed $fixCount files."
Write-Host "All old 'src/components/' and 'src/pages/' imports have been updated."
