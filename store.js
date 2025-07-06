

// --- CONSTANTS ---
export const CLASSES = ['Forest', 'Sword', 'Rune', 'Dragon', 'Abyss', 'Haven', 'Portal'];
export const classStyles = {
    Forest: { border: 'border-green-500', bg: 'bg-green-100', text: 'text-green-600', button: 'bg-green-500', ring: 'ring-green-500', chart: '#86efac' },
    Sword:  { border: 'border-yellow-500', bg: 'bg-yellow-100', text: 'text-yellow-600', button: 'bg-yellow-500', ring: 'ring-yellow-500', chart: '#fde047' },
    Rune:   { border: 'border-blue-500', bg: 'bg-blue-100', text: 'text-blue-600', button: 'bg-blue-500', ring: 'ring-blue-500', chart: '#93c5fd' },
    Dragon: { border: 'border-orange-500', bg: 'bg-orange-100', text: 'text-orange-600', button: 'bg-orange-500', ring: 'ring-orange-500', chart: '#fdba74' },
    Abyss:  { border: 'border-red-500', bg: 'bg-red-100', text: 'text-red-600', button: 'bg-red-500', ring: 'ring-red-500', chart: '#fca5a5' },
    Haven:  { border: 'border-gray-400', bg: 'bg-gray-100', text: 'text-gray-600', button: 'bg-gray-400', ring: 'ring-gray-400', chart: '#e5e7eb' },
    Portal: { border: 'border-cyan-500', bg: 'bg-cyan-100', text: 'text-cyan-600', button: 'bg-cyan-500', ring: 'ring-cyan-500', chart: '#67e8f9' },
    All: { border: 'border-gray-500', bg: 'bg-gray-100', text: 'text-gray-800 dark:text-gray-200', button: 'bg-gray-500', ring: 'ring-gray-500' },
};
export const STORAGE_KEY_DECKS = 'svwb-deck-tracker-decks';
export const STORAGE_KEY_SETTINGS = 'svwb-tracker-settings';

// --- TRANSLATIONS ---
export const translations = {
    en: {
        // General
        'cancel': 'Cancel', 'delete': 'Delete', 'class': 'Class', 'wins': 'Wins', 'losses': 'Losses',
        'back': 'Back', 'import': 'Import', 'export': 'Export', 'reset': 'Reset',
        'save': 'Save',
        'appName': 'SVWB Win Tracker', 'appSubtitle': 'All data is saved in your browser.',
        'allDecks': 'All Decks', 'addNewDeck': 'Add New Deck', 'addGame': 'Add Game', 'stats': 'Stats',
        // Deck List
        'noDecks': 'No decks added yet', 'noDecksHint': 'Get started by creating a new deck.',
        'resetAll': 'Reset All', 'deckAriaDelete': 'Delete deck {name}', 'renameDeck': 'Rename deck {name}',
        'saveName': 'Save name', 'cancelEdit': 'Cancel edit', 'lastPlayed': 'Last played',
        // Modals
        'deckName': 'Deck Name', 'deckNamePlaceholder': 'e.g. Aggro Forest', 'saveDeck': 'Save Deck',
        'deleteDeckTitle': 'Delete Deck',
        'deleteDeckConfirm': 'Are you sure you want to delete the deck "{name}"? All associated match data will be permanently removed. This action cannot be undone.',
        'deleteMatchTitle': 'Delete Match',
        'deleteMatchConfirm': 'Are you sure you want to delete this match record? This action cannot be undone.',
        'importTitle': 'Overwrite Existing Data?',
        'importConfirm': 'Importing this file will overwrite all your existing decks and match data. This action cannot be undone. Are you sure you want to continue?',
        'importAndOverwrite': 'Import & Overwrite',
        'resetTitle': 'Reset All Data',
        'resetConfirm': 'Are you sure you want to reset all data? All decks and match history will be permanently deleted. This action cannot be undone.',
        // Add Game
        'addGameTitle': 'Add Game for {name}',
        'opponentClass': "Opponent's Class", 'turn': 'Turn', 'result': 'Result',
        'saveGame': 'Save Game', 'gameSaved': 'Game Saved!',
        // Stats
        'statsFor': '{name}', 'toggleDateFilter': 'Filter by Date', 'from': 'From', 'to': 'To',
        'apply': 'Apply', 'clear': 'Clear', 'filterOpponent': 'Opponent: {name}', 'filterPeriod': 'Period: {start} to {end}',
        'noGames': 'No Games Played', 'noGamesHint': 'Play some games to see your stats.',
        'winRate': 'Win Rate', 'firstWinRate': '1st WR', 'secondWinRate': '2nd WR',
        'winsShort': 'W', 'lossesShort': 'L', 'gamesShort': 'G', 'na': 'N/A', 'games': 'Games',
        'opponentBreakdown': 'Opponent Breakdown', 'showAllClasses': '[Show All Classes]',
        'opponent': 'Opponent Class', 'playRate': 'Play Rate', 'matchHistory': 'Match History',
        'vs': '(vs {name})', 'wentTurn': 'Went {turn}', 'matchAriaDelete': 'Delete match',
        'noMatchesFilter': 'No matches found for this filter.',
        'barChartTitle': 'Win Rate vs Opponent', 'pieChartTitle': 'Opponent Play Rate', 'toggleChartType': 'Toggle chart type',
    },
    ja: {
        'cancel': 'キャンセル', 'delete': '削除', 'class': 'クラス', 'wins': '勝利数', 'losses': '敗北数',
        'back': '戻る', 'import': 'インポート', 'export': 'エクスポート', 'reset': 'リセット',
        'save': '保存',
        'appName': 'SVWB 勝敗トラッカー', 'appSubtitle': 'すべてのデータはブラウザに保存されます。',
        'allDecks': 'すべてのデッキ', 'addNewDeck': '新規デッキ追加', 'addGame': '対戦を追加', 'stats': '戦績',
        'noDecks': 'まだデッキがありません', 'noDecksHint': '新しいデッキを作成して始めましょう。',
        'resetAll': 'すべてリセット', 'deckAriaDelete': 'デッキ「{name}」を削除', 'renameDeck': 'デッキ「{name}」の名前を変更',
        'saveName': '名前を保存', 'cancelEdit': '編集をキャンセル', 'lastPlayed': '最終プレイ日',
        'deckName': 'デッキ名', 'deckNamePlaceholder': '例: アグロエルフ', 'saveDeck': 'デッキを保存',
        'deleteDeckTitle': 'デッキを削除',
        'deleteDeckConfirm': 'デッキ「{name}」を削除しますか？関連するすべての対戦データが完全に削除されます。この操作は元に戻せません。',
        'deleteMatchTitle': '対戦を削除',
        'deleteMatchConfirm': 'この対戦記録を削除しますか？この操作は元に戻せません。',
        'importTitle': '既存のデータを上書きしますか？',
        'importConfirm': 'このファイルをインポートすると、既存のすべてのデッキと対戦データが上書きされます。この操作は元に戻せません。続行しますか？',
        'importAndOverwrite': 'インポートして上書き',
        'resetTitle': 'すべてのデータをリセット',
        'resetConfirm': 'すべてのデータをリセットしますか？すべてのデッキと対戦履歴が完全に削除されます。この操作は元に戻せません。',
        'addGameTitle': '{name}の対戦を追加',
        'opponentClass': '対戦相手のクラス', 'turn': '先行/後攻', 'result': '勝敗',
        'saveGame': '対戦を記録', 'gameSaved': '対戦を記録しました！',
        'statsFor': '{name}', 'toggleDateFilter': '日付でフィルター', 'from': '開始日', 'to': '終了日',
        'apply': '適用', 'clear': 'クリア', 'filterOpponent': '相手: {name}', 'filterPeriod': '期間: {start} ～ {end}',
        'noGames': '対戦記録がありません', 'noGamesHint': '対戦を記録して戦績を確認しましょう。',
        'winRate': '勝率', 'firstWinRate': '先行 勝率', 'secondWinRate': '後攻 勝率',
        'winsShort': '勝', 'lossesShort': '敗', 'gamesShort': '戦', 'na': 'データなし', 'games': '対戦',
        'opponentBreakdown': 'クラス別内訳', 'showAllClasses': '[すべてのクラスを表示]',
        'opponent': '相手クラス', 'playRate': '使用率', 'matchHistory': '対戦履歴',
        'vs': ' (vs {name})', 'wentTurn': '{turn}', 'matchAriaDelete': '対戦を削除',
        'noMatchesFilter': 'このフィルターに一致する対戦はありません。',
        'barChartTitle': 'クラス別勝率', 'pieChartTitle': 'クラス別使用率', 'toggleChartType': 'グラフの種類を切り替え',
    }
};
export const CLASS_NAMES = {
    en: { Forest: 'Forest', Sword: 'Sword', Rune: 'Rune', Dragon: 'Dragon', Abyss: 'Abyss', Haven: 'Haven', Portal: 'Portal', All: 'All' },
    ja: { Forest: 'エルフ', Sword: 'ロイヤル', Rune: 'ウィッチ', Dragon: 'ドラゴン', Abyss: 'ナイトメア', Haven: 'ビショップ', Portal: 'ネメシス', All: 'すべて' },
};
export const TURN_NAMES = {
    en: { '1st': '1st', '2nd': '2nd' },
    ja: { '1st': '先攻', '2nd': '後攻' },
};
export const RESULT_NAMES = {
    en: { 'Win': 'Win', 'Loss': 'Loss' },
    ja: { 'Win': '勝利', 'Loss': '敗北' },
};

// --- STATE MANAGEMENT ---
export let state = {
    decks: [],
    language: 'en',
    theme: 'light',
    chartType: 'pie',
    view: { type: 'list', editingDeckId: null }, // { type: 'list', editingDeckId: '...' } | { type: 'add_game', deckId: '...' } | { type: 'stats', deckId: '...', ... }
    newDeckClass: null,
    deckToDeleteId: null,
    matchToDelete: null, // { deckId: '...', gameId: '...' }
    fileToImport: null,
};

// --- STATE MUTATORS ---
export const setView = (newView) => {
    state.view = newView;
};

export const setEditingDeckId = (id) => {
    if (state.view.type === 'list') {
        state.view.editingDeckId = id;
    }
};

export const setNewDeckClass = (cls) => {
    state.newDeckClass = cls;
};

export const setDeckToDeleteId = (id) => {
    state.deckToDeleteId = id;
};

export const setMatchToDelete = (match) => {
    state.matchToDelete = match;
};

export const setFileToImport = (file) => {
    state.fileToImport = file;
}

// --- STORAGE ---
export const loadDecks = () => {
    try {
        const savedDecks = localStorage.getItem(STORAGE_KEY_DECKS);
        return savedDecks ? JSON.parse(savedDecks) : [];
    } catch (error) {
        console.error("Could not parse decks from localStorage", error);
        return [];
    }
};

export const saveDecks = () => {
    try {
        localStorage.setItem(STORAGE_KEY_DECKS, JSON.stringify(state.decks));
    } catch (error) {
        console.error("Could not save decks to localStorage", error);
    }
};

export const loadSettings = () => {
    try {
        const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
        return savedSettings ? JSON.parse(savedSettings) : {};
    } catch (error) {
        console.error("Could not parse settings from localStorage", error);
        return {};
    }
};

export const saveSettings = () => {
    try {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify({ language: state.language, theme: state.theme, chartType: state.chartType }));
    } catch (error) {
        console.error("Could not save settings to localStorage", error);
    }
};