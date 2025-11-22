# Fix Login/Register SCSS imports

$projectRoot = "c:\Users\rubix\OneDrive\Documents\projects\arcane-chess\src\features\auth\pages"

Write-Host "Fixing Login/Register SCSS imports..."

$files = Get-ChildItem -Path $projectRoot -Include *.tsx -File

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # Fix the path - LoginRegister.scss is in the current directory
    $content = $content -replace "import ['\`"].+/LoginRegister\.scss['\`"];", "import './LoginRegister.scss';"
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Fixed: $($file.Name)"
    }
}

Write-Host "SCSS import fix complete!"
