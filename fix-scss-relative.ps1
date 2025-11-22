# Fix relative SCSS imports in TSX files

$projectRoot = "c:\Users\rubix\OneDrive\Documents\projects\arcane-chess\src\features"

Write-Host "Fixing relative .scss imports in TSX files..."

$files = Get-ChildItem -Path $projectRoot -Recurse -Include *.tsx -File

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # Each component folder has its own SCSS file - use relative path ./ComponentName.scss
    $filename = $file.BaseName
    $content = $content -replace "import ['\`"].+/$filename\.scss['\`"];", "import './$filename.scss';"
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Fixed: $($file.Name)"
    }
}

Write-Host "Relative SCSS import fix complete!"
