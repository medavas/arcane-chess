# Additional import path updates

$projectRoot = "c:\Users\rubix\OneDrive\Documents\projects\arcane-chess\src"

$additionalMappings = @{
    # Component imports that moved to game/campaign features
    "from 'src/components/Modal/ArcanaSelect'" = "from 'src/features/campaign/components/ArcanaSelect/ArcanaSelect'"
    "from 'src/components/Modal/ArmySelect'" = "from 'src/features/game/components/ArmySelect/ArmySelect'"
    "from 'src/components/Modal/charactersModes'" = "from 'src/features/game/components/CharacterSelect/charactersModes'"
    
    # Page imports within features
    "from 'src/pages/book/ArcanaSelect'" = "from 'src/features/campaign/pages/book/ArcanaSelect'"
    "from 'src/pages/manifest/ArcanaList'" = "from 'src/features/lexicon/pages/manifest/ArcanaList'"
    "from 'src/pages/manifest/PieceList'" = "from 'src/features/lexicon/pages/manifest/PieceList'"
    
    # Shared component imports
    "from 'src/components/Button/Button'" = "from 'src/shared/components/Button/Button'"
    "from 'src/components/Select/Select'" = "from 'src/shared/components/Select/Select'"
    "from 'src/components/Input/Input'" = "from 'src/shared/components/Input/Input'"
    "from 'src/components/Toggle/Toggle'" = "from 'src/shared/components/Toggle/Toggle'"
    
    # Stacktadium imports (if they exist in src)
    "from 'src/stacktadium/" = "from 'src/features/game/stacktadium/"
}

Write-Host "Starting additional import path updates..."
$totalReplacements = 0

$files = Get-ChildItem -Path $projectRoot -Recurse -Include *.ts,*.tsx,*.js,*.mjs -File

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    foreach ($mapping in $additionalMappings.GetEnumerator()) {
        $oldPath = $mapping.Key
        $newPath = $mapping.Value
        
        if ($content -match [regex]::Escape($oldPath)) {
            $content = $content -replace [regex]::Escape($oldPath), $newPath
            $totalReplacements++
        }
    }
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "Additional import updates complete!"
Write-Host "Total replacements made: $totalReplacements"
