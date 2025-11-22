# Fix Modal component imports that were moved to features

$projectRoot = "c:\Users\rubix\OneDrive\Documents\projects\arcane-chess\src"

$modalMappings = @{
    "from 'src/components/Modal/CampaignSettingsModal'" = "from 'src/features/campaign/components/CampaignSettingsModal/CampaignSettingsModal'"
}

Write-Host "Fixing modal component imports..."

$files = Get-ChildItem -Path $projectRoot -Recurse -Include *.ts,*.tsx -File

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    foreach ($mapping in $modalMappings.GetEnumerator()) {
        $oldPath = $mapping.Key
        $newPath = $mapping.Value
        
        if ($content -match [regex]::Escape($oldPath)) {
            $content = $content -replace [regex]::Escape($oldPath), $newPath
        }
    }
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Fixed: $($file.Name)"
    }
}

Write-Host "Modal import fix complete!"
