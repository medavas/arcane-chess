# Fix remaining component relative imports in campaign pages

$projectRoot = "c:\Users\rubix\OneDrive\Documents\projects\arcane-chess\src"

Write-Host "Fixing remaining component imports..."

$files = Get-ChildItem -Path "$projectRoot\features\campaign" -Recurse -Include *.tsx -File

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # Clock is in game components
    $content = $content -replace "from ['\`"]\.\.\/\.\.\/components\/Clock\/Clock", "from 'src/features/game/components/Clock/Clock"
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Fixed: $($file.Name)"
    }
}

Write-Host "Component import fix complete!"
