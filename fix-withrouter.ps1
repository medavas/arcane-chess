# Fix withRouter imports

$projectRoot = "c:\Users\rubix\OneDrive\Documents\projects\arcane-chess\src"

Write-Host "Fixing withRouter imports..."

$files = Get-ChildItem -Path $projectRoot -Recurse -Include *.tsx -File

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    $content = $content -replace "from ['\`"]\.\.\/withRouter\/withRouter", "from 'src/shared/hooks/withRouter/withRouter"
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Fixed: $($file.Name)"
    }
}

Write-Host "withRouter import fix complete!"
