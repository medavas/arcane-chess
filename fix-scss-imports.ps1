# Fix SCSS import paths

$projectRoot = "c:\Users\rubix\OneDrive\Documents\projects\arcane-chess\src"

Write-Host "Fixing SCSS import paths..."

# Get all SCSS files
$scssFiles = Get-ChildItem -Path $projectRoot -Recurse -Include *.scss -File

foreach ($file in $scssFiles) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # Calculate the relative path depth from current file to src/shared/styles
    $relativePath = $file.DirectoryName.Replace($projectRoot, "").TrimStart("\")
    $depth = ($relativePath -split "\\").Count
    
    if ($depth -eq 0) {
        $pathToStyles = "shared/styles"
    } else {
        $upLevels = "../" * $depth
        $pathToStyles = "${upLevels}shared/styles"
    }
    
    # Replace various common SCSS import patterns
    $content = $content -replace "@import\s+['\`"]\.\.\/\.\.\/styles\/", "@import '${pathToStyles}/"
    $content = $content -replace "@import\s+['\`"]\.\.\/styles\/", "@import '${pathToStyles}/"
    $content = $content -replace "@import\s+['\`"]\.\.\/\.\.\/\.\.\/styles\/", "@import '${pathToStyles}/"
    $content = $content -replace "@import\s+['\`"]\.\.\/\.\.\/\.\.\/\.\.\/styles\/", "@import '${pathToStyles}/"
    $content = $content -replace "@import\s+['\`"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/styles\/", "@import '${pathToStyles}/"
    $content = $content -replace "@import\s+['\`"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/styles\/", "@import '${pathToStyles}/"
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Fixed: $($file.FullName)"
    }
}

Write-Host "SCSS import fix complete!"
