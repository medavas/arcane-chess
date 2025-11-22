# Comprehensive SCSS import fix

$projectRoot = "c:\Users\rubix\OneDrive\Documents\projects\arcane-chess\src"

Write-Host "Fixing all SCSS imports..."

$scssFiles = Get-ChildItem -Path $projectRoot -Recurse -Include *.scss -File
$fixCount = 0

foreach ($file in $scssFiles) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # Fix absolute paths src/styles/ -> src/shared/styles/
    $content = $content -replace "@import\s+['\`"]src/styles/", "@import 'src/shared/styles/"
    
    # Fix overly long relative paths
    $content = $content -replace "@import\s+['\`"]\.\.(/\.\.)+/+/+/+/+/+/+shared/styles/", "@import '../../../../shared/styles/"
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Fixed: $($file.Name)"
        $fixCount++
    }
}

Write-Host "SCSS import fix complete! Fixed $fixCount files."
