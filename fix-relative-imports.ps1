# Fix remaining relative imports

$projectRoot = "c:\Users\rubix\OneDrive\Documents\projects\arcane-chess\src"

Write-Host "Fixing remaining relative imports..."

$files = Get-ChildItem -Path $projectRoot -Recurse -Include *.ts,*.tsx,*.js,*.mjs -File

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # Fix chessground relative imports
    $content = $content -replace "from ['\`"]\.\.\/\.\.\/chessground\/", "from 'src/features/game/board/"
    $content = $content -replace "from ['\`"]\.\.\/\.\.\/\.\.\/chessground\/", "from 'src/features/game/board/"
    $content = $content -replace "from ['\`"]\.\.\/arcaneChess\/", "from 'src/features/game/engine/"
    $content = $content -replace "from ['\`"]\.\.\/\.\.\/arcaneChess\/", "from 'src/features/game/engine/"
    
    # Fix component relative imports that should be absolute
    $content = $content -replace "from ['\`"]\.\.\/\.\.\/\.\.\/components\/Button\/Button", "from 'src/shared/components/Button/Button"
    $content = $content -replace "from ['\`"]\.\.\/\.\.\/components\/Button\/Button", "from 'src/shared/components/Button/Button"
    $content = $content -replace "from ['\`"]\.\.\/components\/withRouter\/withRouter", "from 'src/shared/hooks/withRouter/withRouter"
    $content = $content -replace "from ['\`"]\.\.\/\.\.\/components\/withRouter\/withRouter", "from 'src/shared/hooks/withRouter/withRouter"
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Fixed: $($file.FullName)"
    }
}

Write-Host "Relative import fix complete!"
