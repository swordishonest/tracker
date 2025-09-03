/**
 * @fileoverview This file acts as the central store for the application.
 * It defines constants, manages the global application state, holds translation data,
 * and handles all interactions with `localStorage` for data persistence.
 * It is the single source of truth for all application data.
 */

// --- CONSTANTS ---

/** The available Shadowverse classes. */
export const CLASSES = ['Forest', 'Sword', 'Rune', 'Dragon', 'Abyss', 'Haven', 'Portal'];

/** A map of class names to their corresponding Tailwind CSS classes for styling. */
export const classStyles = {
    Forest: { border: 'border-green-500', bg: 'bg-green-100', text: 'text-green-600', button: 'bg-green-500', ring: 'ring-green-500', chart: '#86efac', tag: 'bg-green-200 text-green-800 dark:bg-green-800/50 dark:text-green-200' },
    Sword:  { border: 'border-yellow-500', bg: 'bg-yellow-100', text: 'text-yellow-600', button: 'bg-yellow-500', ring: 'ring-yellow-500', chart: '#fde047', tag: 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800/50 dark:text-yellow-200' },
    Rune:   { border: 'border-blue-500', bg: 'bg-blue-100', text: 'text-blue-600', button: 'bg-blue-500', ring: 'ring-blue-500', chart: '#93c5fd', tag: 'bg-blue-200 text-blue-800 dark:bg-blue-800/50 dark:text-blue-200' },
    Dragon: { border: 'border-orange-500', bg: 'bg-orange-100', text: 'text-orange-600', button: 'bg-orange-500', ring: 'ring-orange-500', chart: '#fdba74', tag: 'bg-orange-200 text-orange-800 dark:bg-orange-800/50 dark:text-orange-200' },
    Abyss:  { border: 'border-red-500', bg: 'bg-red-100', text: 'text-red-600', button: 'bg-red-500', ring: 'ring-red-500', chart: '#fca5a5', tag: 'bg-red-200 text-red-800 dark:bg-red-800/50 dark:text-red-200' },
    Haven:  { border: 'border-gray-400', bg: 'bg-gray-100', text: 'text-gray-600', button: 'bg-gray-400', ring: 'ring-gray-400', chart: '#e5e7eb', tag: 'bg-gray-200 text-gray-800 dark:bg-gray-800/50 dark:text-gray-200' },
    Portal: { border: 'border-cyan-500', bg: 'bg-cyan-100', text: 'text-cyan-600', button: 'bg-cyan-500', ring: 'ring-cyan-500', chart: '#67e8f9', tag: 'bg-cyan-200 text-cyan-800 dark:bg-cyan-800/50 dark:text-cyan-200' },
    All: { border: 'border-gray-500', bg: 'bg-gray-100', text: 'text-gray-800 dark:text-gray-200', button: 'bg-gray-500', ring: 'ring-gray-500' },
    Neutral: { text: 'text-gray-600 dark:text-gray-300', tag: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
};

/** Keys for storing data in `localStorage`. */
export const STORAGE_KEY_DECKS = 'svwb-deck-tracker-decks';
export const STORAGE_KEY_TAKE_TWO_DECKS = 'svwb-deck-tracker-decks-take-two';
export const STORAGE_KEY_SETTINGS = 'svwb-tracker-settings';
export const STORAGE_KEY_TAGS = 'svwb-deck-tracker-tags';
export const STORAGE_KEY_TAG_USAGE = 'svwb-deck-tracker-tag-usage';

// --- TRANSLATIONS ---

/** An object containing all UI strings for different languages. */
export const translations = {
    en: {
        // General
        'cancel': 'Cancel', 'delete': 'Delete', 'class': 'Class', 'wins': 'Wins', 'losses': 'Losses',
        'back': 'Back', 'import': 'Import', 'export': 'Export', 'reset': 'Reset',
        'save': 'Save', 'merge': 'Merge', 'overwrite': 'Overwrite', 'edit': 'Edit', 'close': 'Close',
        'appName': 'SVWB Win Tracker', 'appSubtitle': 'All data is saved in your browser.',
        'allDecks': 'All Decks', 'allClasses': 'All Classes', 'allClassDecks': 'All {class} Decks', 'addNewDeck': 'Add New Deck', 'addGame': 'Add Game', 'stats': 'Stats',
        // Deck List
        'noDecks': 'No decks added yet', 'noDecksHint': 'Get started by creating a new deck.',
        'resetAll': 'Reset All', 'deckAriaDelete': 'Delete deck {name}', 'renameDeck': 'Rename deck {name}',
        'saveName': 'Save name', 'cancelEdit': 'Cancel edit', 'lastPlayed': 'Last played',
        'notes': 'Notes', 'saveNotes': 'Save Notes', 'editNotes': 'Edit Notes', 'addNotes': 'Add Notes',
        'notesFor': 'Notes for {name}', 'noNotesYet': 'No notes yet.',
        // Modes
        'takeTwoMode': 'Take Two', 'normalMode': 'Normal Mode',
        'resetClassTitle': 'Reset Class Data',
        'resetClassAria': 'Reset data for class {name}',
        'resetClassConfirm': 'Are you sure you want to reset all Take Two matches for {name}? This cannot be undone.',
        'addResult': 'Add Result',
        // Modals
        'deckName': 'Deck Name', 'deckNamePlaceholder': 'e.g. Aggro Forest', 'saveDeck': 'Save Deck',
        'deleteDeckTitle': 'Delete Deck',
        'deleteDeckConfirm': 'Are you sure you want to delete the deck "{name}"? All associated match data will be permanently removed. This action cannot be undone.',
        'deleteMatchTitle': 'Delete Match',
        'deleteMatchConfirm': 'Are you sure you want to delete this match record? This action cannot be undone.',
        'deleteResultTitle': 'Delete Result',
        'deleteResultConfirm': 'Are you sure you want to delete this result record? This action cannot be undone.',
        'importTitle': 'Import Data',
        'importConfirm': 'How would you like to import this file? Merging adds new decks and matches to your existing data. Overwriting replaces all current data.',
        'resetTitle': 'Reset All Data',
        'resetConfirm': 'Are you sure you want to reset all data? All decks, match history, tags, and Take Two records will be permanently deleted. This action cannot be undone.',
        'matchDetails': 'Match Details', 'recordedAt': 'Recorded at', 'noTagsForMatch': 'No tags were added to this match.',
        'addTakeTwoResultTitle': 'Add Take Two Result', 'saveResult': 'Save Result',
        // Add/Edit Game
        'addGameTitle': 'Add Game for {name}',
        'editMatchTitle': 'Edit Match',
        'saveChanges': 'Save Changes',
        'opponentClass': "Opponent's Class", 'turn': 'Turn', 'result': 'Result',
        'saveGame': 'Save Game', 'gameSaved': 'Game Saved!',
        'tags': 'Tags', 'myTags': 'My Tags', 'opponentTags': "Opponent's Tags", 'addTagPlaceholder': 'Search or create tags...',
        'createTag': 'Create tag "{name}"', 'create': 'Create',
        'recentTags': 'Recently Used Tags', 'matchingTags': 'Matching Tags', 'noTagsFound': 'No tags found.',
        'createTagButton': 'Create', 'selectTagButton': 'Select',
        // Stats
        'statsFor': '{name}', 'toggleDateFilter': 'Filter by Date', 'from': 'From', 'to': 'To',
        'apply': 'Apply', 'clear': 'Clear', 'filterOpponent': 'Opponent: {name}', 'filterPeriod': 'Period: {start} to {end}',
        'noGames': 'No Games Played', 'noGamesHint': 'Play some games to see your stats.',
        'winRate': 'Win Rate', 'firstWinRate': '1st WR', 'secondWinRate': '2nd WR', 'longestStreak': 'Best Streak',
        'winsShort': 'W', 'lossesShort': 'L', 'gamesShort': 'G', 'na': 'N/A', 'games': 'Games',
        'opponentBreakdown': 'Opponent Breakdown', 'showAllClasses': '[Show All Classes]',
        'opponent': 'Opponent Class', 'playRate': 'Play Rate', 'matchHistory': 'Match History',
        'resultHistory': 'Result History',
        'vs': '(vs {name})', 'wentTurn': 'Went {turn}', 'matchAriaDelete': 'Delete match', 'matchInfo': 'Match info',
        'noMatchesFilter': 'No data found.',
        'barChartTitle': 'Win Rate vs Opponent', 'pieChartTitle': 'Opponent Play Rate', 'toggleChartType': 'Toggle chart type',
        'averageWins': 'Average Wins', 'winsHistogramTitle': 'Wins Distribution',
        'paginationResults': 'Showing <span class="font-medium">{from}</span> to <span class="font-medium">{to}</span> of <span class="font-medium">{total}</span> results',
        'paginationPrevious': 'Previous',
        'paginationNext': 'Next',
        'filterByTags': 'Filter by Tags', 'clearTagFilters': 'Clear Tag Filters', 'applyTagFilters': 'Apply Filters',
        'tagFilterTitle': 'Filter by Tags', 'tagFilterMy': 'My Tags', 'tagFilterOpponent': "Opponent's Tags",
        'tagFilterInclude': 'Include games with these tags:',
        'tagFilterExclude': 'Exclude games with these tags:',
        'tagFiltersActive': '{count} tag filters active',
        // Tag Management
        'manageTags': 'Manage Tags', 'addNewTag': 'Add New Tag', 'tagName': 'Tag Name', 'backToStats': 'Back to Stats',
        'deleteTagTitle': 'Delete Tag',
        'deleteTagConfirm': 'Are you sure you want to delete the tag "{name}"? It will be removed from all matches. This action cannot be undone.',
        'mergeTagsTitle': 'Merge Tags',
        'mergeTagsConfirm': 'A tag named "{targetName}" already exists. Do you want to merge "{sourceName}" into it? This will update all games using the old tag and cannot be undone.',
        'noTagsDefined': 'No tags have been created yet.',
        'addOrSearchTags': 'Add New Tag / Search Tags', 'tagSearchPlaceholder': 'Enter tag name to add or search...',
    },
    ja: {
        'cancel': 'キャンセル', 'delete': '削除', 'class': 'クラス', 'wins': '勝利数', 'losses': '敗北数',
        'back': '戻る', 'import': 'インポート', 'export': 'エクスポート', 'reset': 'リセット',
        'save': '保存', 'merge': 'マージ', 'overwrite': '上書き', 'edit': '編集', 'close': '閉じる',
        'appName': 'SVWB 勝敗トラッカー', 'appSubtitle': 'すべてのデータはブラウザに保存されます。',
        'allDecks': 'すべてのデッキ', 'allClasses': 'すべてのクラス', 'allClassDecks': 'すべての{class}デッキ', 'addNewDeck': '新規デッキ追加', 'addGame': '対戦を追加', 'stats': '戦績',
        'noDecks': 'まだデッキがありません', 'noDecksHint': '新しいデッキを作成して始めましょう。',
        'resetAll': 'すべてリセット', 'deckAriaDelete': 'デッキ「{name}」を削除', 'renameDeck': 'デッキ「{name}」の名前を変更',
        'saveName': '名前を保存', 'cancelEdit': '編集をキャンセル', 'lastPlayed': '最終プレイ日',
        'notes': 'メモ', 'saveNotes': 'メモを保存', 'editNotes': 'メモを編集', 'addNotes': 'メモを追加',
        'notesFor': '{name}のメモ', 'noNotesYet': 'まだメモがありません。',
        'takeTwoMode': '2Pick', 'normalMode': '通常モード',
        'resetClassTitle': 'クラスデータのリセット',
        'resetClassAria': 'クラス「{name}」のデータをリセット',
        'resetClassConfirm': 'クラス「{name}」の2Pick対戦記録をすべてリセットしますか？この操作は元に戻せません。',
        'addResult': '結果を追加',
        'deckName': 'デッキ名', 'deckNamePlaceholder': '例: アグロエルフ', 'saveDeck': 'デッキを保存',
        'deleteDeckTitle': 'デッキを削除',
        'deleteDeckConfirm': 'デッキ「{name}」を削除しますか？関連するすべての対戦データが完全に削除されます。この操作は元に戻せません。',
        'deleteMatchTitle': '対戦を削除',
        'deleteMatchConfirm': 'この対戦記録を削除しますか？この操作は元に戻せません。',
        'deleteResultTitle': '結果を削除',
        'deleteResultConfirm': 'この結果記録を削除しますか？この操作は元に戻せません。',
        'importTitle': 'データインポート',
        'importConfirm': 'このファイルをインポートする方法を選択してください。マージは既存のデータに新しいデッキと対戦を追加します。上書きは現在のすべてのデータを置き換えます。',
        'resetTitle': 'すべてのデータをリセット',
        'resetConfirm': 'すべてのデータをリセットしますか？すべてのデッキ、対戦履歴、タグ、2Pickの記録が完全に削除されます。この操作は元に戻せません。',
        'matchDetails': '対戦の詳細', 'recordedAt': '記録日時', 'noTagsForMatch': 'この対戦にはタグが追加されていません。',
        'addTakeTwoResultTitle': '2Pickの結果を追加', 'saveResult': '結果を保存',
        'addGameTitle': '{name}の対戦を追加',
        'editMatchTitle': '対戦を編集',
        'saveChanges': '変更を保存',
        'opponentClass': '対戦相手のクラス', 'turn': '先行/後攻', 'result': '勝敗',
        'saveGame': '対戦を記録', 'gameSaved': '対戦を記録しました！',
        'tags': 'タグ', 'myTags': '自分のタグ', 'opponentTags': "相手のタグ", 'addTagPlaceholder': 'タグを検索または作成...',
        'createTag': 'タグ「{name}」を作成', 'create': '作成',
        'recentTags': '最近使ったタグ', 'matchingTags': '一致するタグ', 'noTagsFound': 'タグが見つかりません。',
        'createTagButton': '作成', 'selectTagButton': '選択',
        'statsFor': '{name}', 'toggleDateFilter': '日付でフィルター', 'from': '開始日', 'to': '終了日',
        'apply': '適用', 'clear': 'クリア', 'filterOpponent': '相手: {name}', 'filterPeriod': '期間: {start} ～ {end}',
        'noGames': '対戦記録がありません', 'noGamesHint': '対戦を記録して戦績を確認しましょう。',
        'winRate': '勝率', 'firstWinRate': '先行 勝率', 'secondWinRate': '後攻 勝率', 'longestStreak': '最大連勝',
        'winsShort': '勝', 'lossesShort': '敗', 'gamesShort': '戦', 'na': 'データなし', 'games': '対戦',
        'opponentBreakdown': 'クラス別内訳', 'showAllClasses': '[すべてのクラスを表示]',
        'opponent': '相手クラス', 'playRate': '使用率', 'matchHistory': '対戦履歴',
        'resultHistory': '結果履歴',
        'vs': ' (vs {name})', 'wentTurn': '{turn}', 'matchAriaDelete': '対戦を削除', 'matchInfo': '対戦情報',
        'noMatchesFilter': 'データが見つかりません。',
        'barChartTitle': 'クラス別勝率', 'pieChartTitle': 'クラス別使用率', 'toggleChartType': 'グラフの種類を切り替え',
        'averageWins': '平均勝利数', 'winsHistogramTitle': '勝利数分布',
        'paginationResults': '全<span class="font-medium">{total}</span>件中 <span class="font-medium">{from}</span>〜<span class="font-medium">{to}</span>件を表示',
        'paginationPrevious': '前へ',
        'paginationNext': '次へ',
        'filterByTags': 'タグでフィルター', 'clearTagFilters': 'タグフィルターをクリア', 'applyTagFilters': 'フィルターを適用',
        'tagFilterTitle': 'タグでフィルター', 'tagFilterMy': '自分のタグ', 'tagFilterOpponent': "相手のタグ",
        'tagFilterInclude': '次のタグを含む対戦:',
        'tagFilterExclude': '次のタグを含まない対戦:',
        'tagFiltersActive': '{count}個のタグフィルターが有効',
        // Tag Management
        'manageTags': 'タグ管理', 'addNewTag': '新規タグ追加', 'tagName': 'タグ名', 'backToStats': '戦績に戻る',
        'deleteTagTitle': 'タグを削除',
        'deleteTagConfirm': 'タグ「{name}」を削除してもよろしいですか？すべての対戦からこのタグが削除されます。この操作は元に戻せません。',
        'mergeTagsTitle': 'タグをマージ',
        'mergeTagsConfirm': '「{targetName}」という名前のタグは既に存在します。「{sourceName}」をそのタグにマージしますか？この操作により、すべての対戦が更新され、元に戻すことはできません。',
        'noTagsDefined': 'まだタグが作成されていません。',
        'addOrSearchTags': '新規タグ追加 / タグ検索', 'tagSearchPlaceholder': 'タグ名を入力して追加または検索...',
    }
};
/** Translations for class names. */
export const CLASS_NAMES = {
    en: { Forest: 'Forest', Sword: 'Sword', Rune: 'Rune', Dragon: 'Dragon', Abyss: 'Abyss', Haven: 'Haven', Portal: 'Portal', All: 'All', Neutral: 'Neutral' },
    ja: { Forest: 'エルフ', Sword: 'ロイヤル', Rune: 'ウィッチ', Dragon: 'ドラゴン', Abyss: 'ナイトメア', Haven: 'ビショップ', Portal: 'ネメシス', All: 'すべて', Neutral: 'ニュートラル' },
};
/** Translations for turn names. */
export const TURN_NAMES = {
    en: { '1st': '1st', '2nd': '2nd' },
    ja: { '1st': '先攻', '2nd': '後攻' },
};
/** Translations for result names. */
export const RESULT_NAMES = {
    en: { 'Win': 'Win', 'Loss': 'Loss' },
    ja: { 'Win': '勝利', 'Loss': '敗北' },
};

// --- STATE MANAGEMENT ---

/**
 * The global state object for the entire application.
 * @property {Array<object>} decks - The list of user-created decks for Normal mode.
 * @property {Array<object>} takeTwoDecks - The list of class-based decks for Take Two mode.
 * @property {Array<object>} tags - The list of all user-created tags.
 * @property {Object.<string, number>} tagUsage - A map of tag IDs to timestamps for sorting by recency.
 * @property {'normal'|'takeTwo'} mode - The current game mode.
 * @property {'en'|'ja'} language - The current language.
 * @property {'light'|'dark'} theme - The current color theme.
 * @property {'pie'|'bar'|'histogram'} chartType - The currently selected chart type in the stats view.
 * @property {object} view - The current view state, controlling what is rendered on the screen.
 * @property {object} globalDateFilter - The date filter settings applied across the app.
 * @property {object} globalTagFilter - The tag filter settings applied across the app.
 * @property {boolean} addGameTagsExpanded - Whether the tag section in the Add Game view is expanded.
 * @property {boolean} matchHistoryCollapsed - Whether the match history list in stats is collapsed.
 * @property {boolean} resultHistoryCollapsed - Whether the result history list in stats is collapsed.
 * @property {string|null} newDeckClass - The class selected when creating a new deck.
 * @property {object} newTakeTwoResult - The state for the "Add Result" modal form.
 * @property {string|null} deckToDeleteId - The ID of the deck currently staged for deletion.
 * @property {string|null} tagToDeleteId - The ID of the tag currently staged for deletion.
 * @property {object|null} tagToMerge - Data for a pending tag merge operation.
 * @property {object|null} matchToDelete - Data for a match currently staged for deletion.
 * @property {object|null} runToDelete - Data for a Take Two run currently staged for deletion.
 * @property {object|null} matchInfoToShow - Data for the match whose details are being shown in a modal.
 * @property {File|null} fileToImport - The file object staged for import.
 * @property {object} deckNotesState - The state for the deck notes modal (which deck and if it's being edited).
 */
export let state = {
    decks: [],
    takeTwoDecks: [],
    tags: [],
    tagUsage: {}, // { [tagId]: timestamp }
    mode: 'normal', // 'normal' | 'takeTwo'
    language: 'en',
    theme: 'light',
    chartType: 'pie',
    view: { type: 'list', editingDeckId: null }, // { type: 'list', ... } | { type: 'add_game', ... } | { type: 'stats', ... } | { type: 'manage_tags', ... }
    globalDateFilter: { start: null, end: null },
    globalTagFilter: { my: { include: [], exclude: [] }, opp: { include: [], exclude: [] } },
    addGameTagsExpanded: false,
    matchHistoryCollapsed: false,
    resultHistoryCollapsed: false,
    newDeckClass: null,
    newTakeTwoResult: { class: null, wins: null, losses: null },
    deckToDeleteId: null,
    tagToDeleteId: null,
    tagToMerge: null, // { sourceTag: obj, targetTag: obj }
    matchToDelete: null, // { deckId: '...', gameId: '...' }
    runToDelete: null, // { deckId: '...', runId: '...' }
    matchInfoToShow: null, // { deckId: '...', gameId: '...' }
    fileToImport: null,
    deckNotesState: { deckId: null, isEditing: false },
};

// --- HELPERS ---

/**
 * Gets the translated string for a given key and translation object type.
 * @param {object} type - The translation object (e.g., CLASS_NAMES, RESULT_NAMES).
 * @param {string} key - The key to translate.
 * @returns {string} The translated string.
 */
export const getTranslated = (type, key) => (type[state.language] && type[state.language][key]) || type.en[key] || key;
/**
 * Gets the translated name for a specific class.
 * @param {string} key - The class name (e.g., 'Forest').
 * @returns {string} The translated class name.
 */
export const getTranslatedClassName = (key) => getTranslated(CLASS_NAMES, key);

// --- STATE MUTATORS ---
// These functions are the designated way to modify the application state.

/**
 * Sets the current view of the application.
 * @param {object} newView The new view object.
 */
export const setView = (newView) => {
    state.view = newView;
};

/**
 * Sets the current game mode ('normal' or 'takeTwo').
 * @param {'normal'|'takeTwo'} mode The new mode.
 */
export const setMode = (mode) => {
    state.mode = mode;
    saveSettings();
};

/**
 * Sets the ID of the deck that is currently being edited.
 * @param {string|null} id The ID of the deck to edit, or null.
 */
export const setEditingDeckId = (id) => {
    if (state.view.type === 'list') {
        state.view.editingDeckId = id;
    }
};

/**
 * Sets whether the tags section in the "Add Game" view is expanded.
 * @param {boolean} isExpanded True if expanded, false otherwise.
 */
export const setAddGameTagsExpanded = (isExpanded) => {
    state.addGameTagsExpanded = isExpanded;
    saveSettings();
};

/**
 * Sets whether the match history list in the stats view is collapsed.
 * @param {boolean} isCollapsed True if collapsed, false otherwise.
 */
export const setMatchHistoryCollapsed = (isCollapsed) => {
    state.matchHistoryCollapsed = isCollapsed;
    saveSettings();
};

/**
 * Sets whether the result history list in the stats view is collapsed.
 * @param {boolean} isCollapsed True if collapsed, false otherwise.
 */
export const setResultHistoryCollapsed = (isCollapsed) => {
    state.resultHistoryCollapsed = isCollapsed;
    saveSettings();
};

/**
 * Sets the state for the deck notes modal.
 * @param {{deckId: string|null, isEditing: boolean}} newState The new state for the modal.
 */
export const setDeckNotesState = (newState) => {
    state.deckNotesState = newState;
};

/**
 * Sets the class for a new deck being created.
 * @param {string|null} cls The selected class.
 */
export const setNewDeckClass = (cls) => {
    state.newDeckClass = cls;
};

/**
 * Sets the data for a new Take Two result being added.
 * @param {object} result The result data.
 */
export const setNewTakeTwoResult = (result) => {
    state.newTakeTwoResult = result;
};

/**
 * Stages a deck for deletion.
 * @param {string|null} id The ID of the deck to delete.
 */
export const setDeckToDeleteId = (id) => {
    state.deckToDeleteId = id;
};

/**
 * Stages a tag for deletion.
 * @param {string|null} id The ID of the tag to delete.
 */
export const setTagToDeleteId = (id) => {
    state.tagToDeleteId = id;
};

/**
 * Stages two tags for a merge operation.
 * @param {object|null} data The merge data, containing source and target tags.
 */
export const setTagToMerge = (data) => {
    state.tagToMerge = data;
};

/**
 * Stages a match for deletion.
 * @param {object|null} match The match data { deckId, gameId }.
 */
export const setMatchToDelete = (match) => {
    state.matchToDelete = match;
};

/**
 * Stages a Take Two run for deletion.
 * @param {object|null} run The run data { deckId, runId }.
 */
export const setRunToDelete = (run) => {
    state.runToDelete = run;
};

/**
 * Sets the match to show in the match info modal.
 * @param {object|null} match The match data { deckId, gameId }.
 */
export const setMatchInfoToShow = (match) => {
    state.matchInfoToShow = match;
};

/**
 * Stages a file for import.
 * @param {File|null} file The file object to import.
 */
export const setFileToImport = (file) => {
    state.fileToImport = file;
};

/**
 * Adds a new tag to the global list and saves.
 * @param {object} tag The new tag object.
 */
export const addTag = (tag) => {
    state.tags.push(tag);
    saveTags();
};

/**
 * Updates the usage timestamp for a list of tags.
 * @param {string[]} tagIds An array of tag IDs to update.
 */
export const updateTagUsage = (tagIds) => {
    const now = Date.now();
    tagIds.forEach(id => {
        state.tagUsage[id] = now;
    });
    saveTagUsage();
};

// --- STORAGE ---
// Functions for loading from and saving to localStorage.

/**
 * Loads decks for Normal mode from localStorage.
 * @returns {Array<object>} The loaded decks.
 */
export const loadDecks = () => {
    try {
        const savedDecks = localStorage.getItem(STORAGE_KEY_DECKS);
        return savedDecks ? JSON.parse(savedDecks) : [];
    } catch (error) {
        console.error("Could not parse decks from localStorage", error);
        return [];
    }
};

/** Saves the current Normal mode decks to localStorage. */
export const saveDecks = () => {
    try {
        localStorage.setItem(STORAGE_KEY_DECKS, JSON.stringify(state.decks));
    } catch (error) {
        console.error("Could not save decks to localStorage", error);
    }
};

/**
 * Loads decks for Take Two mode from localStorage.
 * @returns {Array<object>} The loaded Take Two decks.
 */
export const loadTakeTwoDecks = () => {
    try {
        const savedDecks = localStorage.getItem(STORAGE_KEY_TAKE_TWO_DECKS);
        return savedDecks ? JSON.parse(savedDecks) : [];
    } catch (error) {
        console.error("Could not parse Take Two decks from localStorage", error);
        return [];
    }
};

/** Saves the current Take Two mode decks to localStorage. */
export const saveTakeTwoDecks = () => {
    try {
        localStorage.setItem(STORAGE_KEY_TAKE_TWO_DECKS, JSON.stringify(state.takeTwoDecks));
    } catch (error) {
        console.error("Could not save Take Two decks to localStorage", error);
    }
};

/**
 * Initializes the Take Two decks. Ensures a deck exists for each class and
 * updates names if the language has changed.
 */
export const initializeTakeTwoDecks = () => {
    const existingDecks = new Map(state.takeTwoDecks.map(d => [d.id, d]));
    const newDecks = [];
    let needsSave = false;

    for (const cls of CLASSES) {
        const translatedName = getTranslatedClassName(cls);
        if (existingDecks.has(cls)) {
            const deck = existingDecks.get(cls);
            if (deck.name !== translatedName) {
                deck.name = translatedName;
                needsSave = true;
            }
            if (!deck.runs) {
                deck.runs = [];
                needsSave = true;
            }
            newDecks.push(deck);
        } else {
            newDecks.push({
                id: cls,
                name: translatedName,
                class: cls,
                games: [],
                runs: [],
                notes: '',
            });
            needsSave = true;
        }
    }

    state.takeTwoDecks = newDecks;
    if (needsSave) {
        saveTakeTwoDecks();
    }
};

/**
 * Loads all tags from localStorage.
 * @returns {Array<object>} The loaded tags.
 */
export const loadTags = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY_TAGS);
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error("Could not parse tags from localStorage", error);
        return [];
    }
};

/** Saves the current list of tags to localStorage. */
export const saveTags = () => {
    try {
        localStorage.setItem(STORAGE_KEY_TAGS, JSON.stringify(state.tags));
    } catch (error) {
        console.error("Could not save tags to localStorage", error);
    }
};

/**
 * Loads tag usage data from localStorage.
 * @returns {Object.<string, number>} The loaded tag usage map.
 */
export const loadTagUsage = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY_TAG_USAGE);
        return saved ? JSON.parse(saved) : {};
    } catch (error) {
        console.error("Could not parse tag usage from localStorage", error);
        return {};
    }
};

/** Saves the current tag usage data to localStorage. */
export const saveTagUsage = () => {
    try {
        localStorage.setItem(STORAGE_KEY_TAG_USAGE, JSON.stringify(state.tagUsage));
    } catch (error) {
        console.error("Could not save tag usage to localStorage", error);
    }
};

/**
 * Loads user settings from localStorage.
 * @returns {object} The loaded settings object.
 */
export const loadSettings = () => {
    try {
        const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
        return savedSettings ? JSON.parse(savedSettings) : {};
    } catch (error) {
        console.error("Could not parse settings from localStorage", error);
        return {};
    }
};

/** Saves the current user settings to localStorage. */
export const saveSettings = () => {
    try {
        const settings = {
            language: state.language,
            theme: state.theme,
            mode: state.mode,
            chartType: state.chartType,
            addGameTagsExpanded: state.addGameTagsExpanded,
            globalDateFilter: state.globalDateFilter,
            globalTagFilter: state.globalTagFilter,
            matchHistoryCollapsed: state.matchHistoryCollapsed,
            resultHistoryCollapsed: state.resultHistoryCollapsed,
        };
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (error) {
        console.error("Could not save settings to localStorage", error);
    }
};