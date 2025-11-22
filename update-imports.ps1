# PowerShell script to update import paths after refactoring

$projectRoot = "c:\Users\rubix\OneDrive\Documents\projects\arcane-chess\src"

# Define all path mappings (old -> new)
$pathMappings = @{
    # Store/reducers
    "from 'src/store/configureStore'" = "from 'src/app/store/configureStore'"
    "from 'src/store/logger'" = "from 'src/app/store/logger'"
    "from '../reducers'" = "from 'src/app/store/rootReducer'"
    "from './reducers'" = "from 'src/app/store/rootReducer'"
    
    # Auth
    "from './actions/authActions'" = "from 'src/features/auth/store/authActions'"
    "from 'src/actions/authActions'" = "from 'src/features/auth/store/authActions'"
    "from '../actions/authActions'" = "from 'src/features/auth/store/authActions'"
    "from '../../actions/authActions'" = "from 'src/features/auth/store/authActions'"
    "from './authActions'" = "from 'src/features/auth/store/authActions'"
    "from './authReducer'" = "from 'src/features/auth/store/authReducer'"
    "from './authError'" = "from 'src/features/auth/store/authError'"
    "from 'src/components/PrivateRoute/PrivateRoute'" = "from 'src/features/auth/components/PrivateRoute/PrivateRoute'"
    "from '././pages/loginRegister/Login'" = "from 'src/features/auth/pages/Login'"
    "from '././pages/loginRegister/Register'" = "from 'src/features/auth/pages/Register'"
    
    # Game store
    "from './actions/gameActions'" = "from 'src/features/game/store/gameActions'"
    "from 'src/actions/gameActions'" = "from 'src/features/game/store/gameActions'"
    "from '../actions/gameActions'" = "from 'src/features/game/store/gameActions'"
    "from './actions/saveRoomActions'" = "from 'src/features/game/store/saveRoomActions'"
    "from 'src/actions/saveRoomActions'" = "from 'src/features/game/store/saveRoomActions'"
    "from './actions/tournamentActions'" = "from 'src/features/game/store/tournamentActions'"
    "from 'src/actions/tournamentActions'" = "from 'src/features/game/store/tournamentActions'"
    "from './gameReducer'" = "from 'src/features/game/store/gameReducer'"
    "from './saveRoom'" = "from 'src/features/game/store/saveRoom'"
    "from './tournamentReducer'" = "from 'src/features/game/store/tournamentReducer'"
    
    # Game engine/board
    "from 'src/arcaneChess/" = "from 'src/features/game/engine/"
    "from 'src/chessground/" = "from 'src/features/game/board/"
    "from '../arcaneChess/" = "from 'src/features/game/engine/"
    "from '../../arcaneChess/" = "from 'src/features/game/engine/"
    
    # Game components
    "from 'src/components/PromotionModal/PromotionModal'" = "from 'src/features/game/components/PromotionModal/PromotionModal'"
    "from 'src/components/Clock/Clock'" = "from 'src/features/game/components/Clock/Clock'"
    
    # Game pages
    "from '././pages/quickPlay/QuickPlay'" = "from 'src/features/game/pages/quickPlay/QuickPlay'"
    "from '././pages/skirmish/Skirmish'" = "from 'src/features/game/pages/skirmish/Skirmish'"
    "from '././pages/stackQuickplay/StackQuickplay'" = "from 'src/features/game/pages/stackQuickplay/StackQuickplay'"
    "from 'src/pages/stackQuickplay/StackQuickplayModal'" = "from 'src/features/game/pages/stackQuickplay/StackQuickplayModal'"
    
    # Campaign
    "from '././pages/campaign/Campaign'" = "from 'src/features/campaign/pages/campaign/Campaign'"
    "from '././pages/book/Book'" = "from 'src/features/campaign/pages/book/Book'"
    "from '././pages/lessonView/LessonView'" = "from 'src/features/campaign/pages/lessonView/LessonView'"
    "from '././pages/templeView/TempleView'" = "from 'src/features/campaign/pages/templeView/TempleView'"
    "from '././pages/missionView/MissionView'" = "from 'src/features/campaign/pages/missionView/MissionView'"
    "from 'src/components/Modal/Modal'" = "from 'src/shared/components/Modal/Modal'"
    
    # Dashboard
    "from '././pages/dashboard/Dashboard'" = "from 'src/features/dashboard/pages/Dashboard'"
    
    # Lexicon
    "from '././pages/lexicon/Lexicon'" = "from 'src/features/lexicon/pages/lexicon/Lexicon'"
    "from '././pages/manifest/Manifest'" = "from 'src/features/lexicon/pages/manifest/Manifest'"
    
    # Leaderboard
    "from '././pages/leaderboard/LeaderBoard'" = "from 'src/features/leaderboard/pages/leaderboard/LeaderBoard'"
    
    # Landing
    "from '././pages/frontPage/FrontPage'" = "from 'src/features/landing/pages/frontPage/FrontPage'"
    "from '././pages/notFound/NotFound'" = "from 'src/features/landing/pages/notFound/NotFound'"
    
    # Shared components
    "from 'src/components/withRouter/withRouter'" = "from 'src/shared/hooks/withRouter/withRouter'"
    "from 'src/components/hero2/Hero'" = "from 'src/shared/components/hero2/Hero'"
    "from '../../components/Button/Button'" = "from 'src/shared/components/Button/Button'"
    "from '../components/Button/Button'" = "from 'src/shared/components/Button/Button'"
    
    # Shared utils
    "from './utils/setAuthToken'" = "from 'src/shared/utils/setAuthToken'"
    "from '../utils/setAuthToken'" = "from 'src/shared/utils/setAuthToken'"
    "from 'src/utils/handleLocalStorage'" = "from 'src/shared/utils/handleLocalStorage'"
    "from './utils/audio/ConditionalAudioPlayer'" = "from 'src/shared/utils/audio/ConditionalAudioPlayer'"
    "from 'src/utils/audio/ConditionalAudioPlayer'" = "from 'src/shared/utils/audio/ConditionalAudioPlayer'"
    "from 'src/utils/audio/AudioManager'" = "from 'src/shared/utils/audio/AudioManager'"
    "from 'src/utils/audio/GlobalVolumeControl'" = "from 'src/shared/utils/audio/GlobalVolumeControl'"
    
    # Shared data
    "from 'src/data/" = "from 'src/shared/data/"
    
    # Action types
    "from './types'" = "from 'src/shared/types/actionTypes'"
    "from './actions/types'" = "from 'src/shared/types/actionTypes'"
    "from '../actions/types'" = "from 'src/shared/types/actionTypes'"
}

Write-Host "Starting import path updates..."
$totalReplacements = 0

# Get all TypeScript/JavaScript files
$files = Get-ChildItem -Path $projectRoot -Recurse -Include *.ts,*.tsx,*.js,*.mjs -File

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    foreach ($mapping in $pathMappings.GetEnumerator()) {
        $oldPath = $mapping.Key
        $newPath = $mapping.Value
        
        if ($content -match [regex]::Escape($oldPath)) {
            $content = $content -replace [regex]::Escape($oldPath), $newPath
            $totalReplacements++
        }
    }
    
    # Only write if content changed
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "Import path update complete!"
Write-Host "Total replacements made: $totalReplacements"
