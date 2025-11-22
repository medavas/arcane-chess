# Fix remaining relative Button imports

$projectRoot = "c:\Users\rubix\OneDrive\Documents\projects\arcane-chess\src\features"

Write-Host "Fixing Button imports in feature components..."

$files = Get-ChildItem -Path $projectRoot -Recurse -Include *.tsx -File

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # Button is in shared components
    $content = $content -replace "from ['\`"]\.\.\/Button\/Button", "from 'src/shared/components/Button/Button"
    $content = $content -replace "from ['\`"]\.\.\/Select\/Select", "from 'src/shared/components/Select/Select"
    $content = $content -replace "from ['\`"]\.\.\/Input\/Input", "from 'src/shared/components/Input/Input"
    $content = $content -replace "from ['\`"]\.\.\/Toggle\/Toggle", "from 'src/shared/components/Toggle/Toggle"
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Fixed: $($file.Name)"
    }
}

Write-Host "Button import fix complete!"
