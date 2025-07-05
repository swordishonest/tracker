
document.addEventListener('DOMContentLoaded', () => {
    // --- CONSTANTS ---
    const CLASSES = ['Forest', 'Sword', 'Rune', 'Dragon', 'Abyss', 'Haven', 'Portal'];
    const classStyles = {
        Forest: { border: 'border-green-500', bg: 'bg-green-100', text: 'text-green-600', button: 'bg-green-500', ring: 'ring-green-500', chart: '#86efac' },
        Sword:  { border: 'border-yellow-500', bg: 'bg-yellow-100', text: 'text-yellow-600', button: 'bg-yellow-500', ring: 'ring-yellow-500', chart: '#fde047' },
        Rune:   { border: 'border-blue-500', bg: 'bg-blue-100', text: 'text-blue-600', button: 'bg-blue-500', ring: 'ring-blue-500', chart: '#93c5fd' },
        Dragon: { border: 'border-orange-500', bg: 'bg-orange-100', text: 'text-orange-600', button: 'bg-orange-500', ring: 'ring-orange-500', chart: '#fdba74' },
        Abyss:  { border: 'border-red-500', bg: 'bg-red-100', text: 'text-red-600', button: 'bg-red-500', ring: 'ring-red-500', chart: '#fca5a5' },
        Haven:  { border: 'border-gray-400', bg: 'bg-gray-100', text: 'text-gray-600', button: 'bg-gray-400', ring: 'ring-gray-400', chart: '#e5e7eb' },
        Portal: { border: 'border-cyan-500', bg: 'bg-cyan-100', text: 'text-cyan-600', button: 'bg-cyan-500', ring: 'ring-cyan-500', chart: '#67e8f9' },
        All: { border: 'border-gray-500', bg: 'bg-gray-100', text: 'text-gray-800', button: 'bg-gray-500', ring: 'ring-gray-500' },
    };
    const STORAGE_KEY_DECKS = 'svwb-deck-tracker-decks';
    const STORAGE_KEY_SETTINGS = 'svwb-tracker-settings';

    // --- TRANSLATIONS ---
    const translations = {
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
            'statsFor': 'Stats for {name}', 'toggleDateFilter': 'Filter by Date', 'from': 'From', 'to': 'To',
            'apply': 'Apply', 'clear': 'Clear', 'filterOpponent': 'Opponent: {name}', 'filterPeriod': 'Period: {start} to {end}',
            'noGames': 'No Games Played', 'noGamesHint': 'Play some games to see your stats.',
            'winRate': 'Win Rate', 'firstWinRate': '1st WR', 'secondWinRate': '2nd WR',
            'winsShort': 'W', 'lossesShort': 'L', 'gamesShort': 'G', 'na': 'N/A', 'games': 'Games',
            'opponentBreakdown': 'Opponent Breakdown', 'showAllClasses': '[Show All Classes]',
            'opponent': 'Opponent Class', 'playRate': 'Play Rate', 'matchHistory': 'Match History',
            'vs': '(vs {name})', 'wentTurn': 'Went {turn}', 'matchAriaDelete': 'Delete match',
            'noMatchesFilter': 'No matches found for this filter.',
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
            'statsFor': '{name}の戦績', 'toggleDateFilter': '日付でフィルター', 'from': '開始日', 'to': '終了日',
            'apply': '適用', 'clear': 'クリア', 'filterOpponent': '相手: {name}', 'filterPeriod': '期間: {start} ～ {end}',
            'noGames': '対戦記録がありません', 'noGamesHint': '対戦を記録して戦績を確認しましょう。',
            'winRate': '勝率', 'firstWinRate': '先行 勝率', 'secondWinRate': '後攻 勝率',
            'winsShort': '勝', 'lossesShort': '敗', 'gamesShort': '戦', 'na': 'データなし', 'games': '対戦',
            'opponentBreakdown': 'クラス別内訳', 'showAllClasses': '[すべてのクラスを表示]',
            'opponent': '相手クラス', 'playRate': '使用率', 'matchHistory': '対戦履歴',
            'vs': ' (vs {name})', 'wentTurn': '{turn}', 'matchAriaDelete': '対戦を削除',
            'noMatchesFilter': 'このフィルターに一致する対戦はありません。',
        }
    };
    const CLASS_NAMES = {
        en: { Forest: 'Forest', Sword: 'Sword', Rune: 'Rune', Dragon: 'Dragon', Abyss: 'Abyss', Haven: 'Haven', Portal: 'Portal', All: 'All' },
        ja: { Forest: 'エルフ', Sword: 'ロイヤル', Rune: 'ウィッチ', Dragon: 'ドラゴン', Abyss: 'ナイトメア', Haven: 'ビショップ', Portal: 'ネメシス', All: 'すべて' },
    };
    const TURN_NAMES = {
        en: { '1st': '1st', '2nd': '2nd' },
        ja: { '1st': '先攻', '2nd': '後攻' },
    };
    const RESULT_NAMES = {
        en: { 'Win': 'Win', 'Loss': 'Loss' },
        ja: { 'Win': '勝利', 'Loss': '敗北' },
    };
    
    // --- STATE MANAGEMENT ---
    let state = {
        decks: [],
        language: 'en',
        view: { type: 'list', editingDeckId: null }, // { type: 'list', editingDeckId: '...' } | { type: 'add_game', deckId: '...' } | { type: 'stats', deckId: '...', filterClass: null, dateFilter: { start: null, end: null }, statsDeckSwitcherVisible: false, dateFilterVisible: false }
        newDeckClass: null,
        deckToDeleteId: null,
        matchToDelete: null, // { deckId: '...', gameId: '...' }
        fileToImport: null,
    };
    
    const t = (key, replacements = {}) => {
        let text = (translations[state.language] && translations[state.language][key]) || translations.en[key] || `[${key}]`;
        for (const placeholder in replacements) {
            text = text.replace(`{${placeholder}}`, replacements[placeholder]);
        }
        return text;
    };
    const getTranslated = (type, key) => (type[state.language] && type[state.language][key]) || type.en[key] || key;


    const loadDecks = () => {
        try {
            const savedDecks = localStorage.getItem(STORAGE_KEY_DECKS);
            return savedDecks ? JSON.parse(savedDecks) : [];
        } catch (error) {
            console.error("Could not parse decks from localStorage", error);
            return [];
        }
    };

    const saveDecks = () => {
        try {
            localStorage.setItem(STORAGE_KEY_DECKS, JSON.stringify(state.decks));
        } catch (error) {
            console.error("Could not save decks to localStorage", error);
        }
    };
    
    const loadSettings = () => {
        try {
            const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
            return savedSettings ? JSON.parse(savedSettings) : {};
        } catch (error) {
            console.error("Could not parse settings from localStorage", error);
            return {};
        }
    };
    
    const saveSettings = () => {
        try {
            localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify({ language: state.language }));
        } catch (error) {
            console.error("Could not save settings to localStorage", error);
        }
    };

    // --- DOM ELEMENTS ---
    const appContainer = document.getElementById('app');
    const addDeckModal = document.getElementById('add-deck-modal');
    const modalForm = document.getElementById('add-deck-form');
    const cancelDeckButton = document.getElementById('cancel-deck-button');
    const deckNameInput = document.getElementById('deckName');
    const modalClassSelectorContainer = document.getElementById('modal-class-selector-container');
    const saveDeckButton = document.getElementById('save-deck-button');
    
    const deleteDeckConfirmModal = document.getElementById('delete-deck-confirm-modal');
    const cancelDeleteDeckButton = document.getElementById('cancel-delete-deck-button');
    const confirmDeleteDeckButton = document.getElementById('confirm-delete-deck-button');
    
    const deleteMatchConfirmModal = document.getElementById('delete-match-confirm-modal');
    const cancelDeleteMatchButton = document.getElementById('cancel-delete-match-button');
    const confirmDeleteMatchButton = document.getElementById('confirm-delete-match-button');

    const importFileInput = document.getElementById('import-file-input');
    const importConfirmModal = document.getElementById('import-confirm-modal');
    const cancelImportButton = document.getElementById('cancel-import-button');
    const confirmImportButton = document.getElementById('confirm-import-button');
    
    const resetConfirmModal = document.getElementById('reset-confirm-modal');
    const cancelResetButton = document.getElementById('cancel-reset-button');
    const confirmResetButton = document.getElementById('confirm-reset-button');
    
    // --- UI HELPERS ---

    const checkDeckFormValidity = () => {
        const isNameValid = deckNameInput.value.trim() !== '';
        const isClassValid = state.newDeckClass !== null;
        if (isNameValid && isClassValid) {
            saveDeckButton.disabled = false;
            saveDeckButton.className = 'px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';
        } else {
            saveDeckButton.disabled = true;
            saveDeckButton.className = 'px-4 py-2 bg-gray-400 text-white font-semibold rounded-md shadow-sm cursor-not-allowed';
        }
    };
    
    const createClassSelector = (selectedClass, onSelectCallback) => {
        const container = document.createElement('div');
        container.className = 'grid grid-cols-4 gap-2 mt-2';
        container.setAttribute('role', 'group');

        CLASSES.forEach(cls => {
            const isSelected = selectedClass === cls;
            const style = classStyles[cls];
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = getTranslated(CLASS_NAMES, cls);
            button.setAttribute('aria-pressed', String(isSelected));
            button.className = `w-full text-center px-2 py-2 text-sm font-medium rounded-md focus:outline-none transition-all duration-150 transform hover:-translate-y-px ${
                isSelected
                    ? `${style.button} text-white shadow-md focus:ring-2 focus:ring-offset-2 ${style.ring}`
                    : `${style.bg} ${style.text} hover:brightness-95 focus:ring-2 focus:ring-offset-2 ${style.ring}`
            }`;
            button.addEventListener('click', () => onSelectCallback(cls));
            container.appendChild(button);
        });
        
        return container;
    };
    
    const openAddDeckModal = () => {
        deckNameInput.value = '';
        state.newDeckClass = null;
        renderModalClassSelector();
        checkDeckFormValidity();
        addDeckModal.classList.remove('hidden');
    };
    
    const closeAddDeckModal = () => {
        addDeckModal.classList.add('hidden');
    };

    const openDeleteDeckModal = (deckId) => {
        state.deckToDeleteId = deckId;
        renderModals(); // Have renderModals do the DOM work
        deleteDeckConfirmModal.classList.remove('hidden');
        deleteDeckConfirmModal.querySelector('div').classList.add('animate-fade-in-up');
    };

    const closeDeleteDeckModal = () => {
        state.deckToDeleteId = null;
        deleteDeckConfirmModal.classList.add('hidden');
        deleteDeckConfirmModal.querySelector('div').classList.remove('animate-fade-in-up');
    };

    const openDeleteMatchModal = (deckId, gameId) => {
        state.matchToDelete = { deckId, gameId };
        deleteMatchConfirmModal.classList.remove('hidden');
        deleteMatchConfirmModal.querySelector('div').classList.add('animate-fade-in-up');
    };

    const closeDeleteMatchModal = () => {
        state.matchToDelete = null;
        deleteMatchConfirmModal.classList.add('hidden');
        deleteMatchConfirmModal.querySelector('div').classList.remove('animate-fade-in-up');
    };

    const openImportModal = () => {
        importConfirmModal.classList.remove('hidden');
        importConfirmModal.querySelector('div').classList.add('animate-fade-in-up');
    };

    const closeImportModal = () => {
        state.fileToImport = null;
        importFileInput.value = null; // Reset file input
        importConfirmModal.classList.add('hidden');
        importConfirmModal.querySelector('div').classList.remove('animate-fade-in-up');
    };

    const openResetModal = () => {
        resetConfirmModal.classList.remove('hidden');
        resetConfirmModal.querySelector('div').classList.add('animate-fade-in-up');
    };

    const closeResetModal = () => {
        resetConfirmModal.classList.add('hidden');
        resetConfirmModal.querySelector('div').classList.remove('animate-fade-in-up');
    };

    // --- DATA IMPORT/EXPORT ---
    const handleExport = () => {
        if (state.decks.length === 0) {
            alert("There is no data to export.");
            return;
        }

        const dataStr = JSON.stringify(state.decks, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        link.download = `svwb-tracker-backup-${timestamp}.json`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImport = () => {
        importFileInput.click();
    };
    
    const processImportFile = (file) => {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);

                if (!Array.isArray(importedData)) throw new Error("Data is not an array.");

                const isValid = importedData.every(deck =>
                    typeof deck === 'object' &&
                    deck !== null &&
                    'id' in deck && typeof deck.id === 'string' &&
                    'name' in deck && typeof deck.name === 'string' &&
                    'class' in deck && typeof deck.class === 'string' && CLASSES.includes(deck.class) &&
                    'games' in deck && Array.isArray(deck.games) &&
                    deck.games.every(game =>
                        typeof game === 'object' &&
                        game !== null &&
                        'id' in game && typeof game.id === 'string' &&
                        'timestamp' in game && typeof game.timestamp === 'number' &&
                        'opponentClass' in game && typeof game.opponentClass === 'string' && CLASSES.includes(game.opponentClass) &&
                        'turn' in game && ['1st', '2nd'].includes(game.turn) &&
                        'result' in game && ['Win', 'Loss'].includes(game.result)
                    )
                );

                if (!isValid) {
                    throw new Error("The imported file has an invalid data structure.");
                }

                state.decks = importedData;
                saveDecks();
                render();
                alert("Data imported successfully!");

            } catch (error) {
                console.error("Failed to import data:", error);
                alert(`Import failed: ${error.message}`);
            } finally {
                state.fileToImport = null;
                importFileInput.value = null;
            }
        };
        reader.onerror = () => {
            alert("Failed to read the file.");
            state.fileToImport = null;
            importFileInput.value = null;
        };

        reader.readAsText(file);
    };
    
    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        state.fileToImport = file;

        if (state.decks.length > 0) {
            openImportModal();
        } else {
            processImportFile(file);
        }
    };

    // --- RENDER FUNCTIONS ---
    
    const renderModalClassSelector = () => {
        modalClassSelectorContainer.innerHTML = ''; // Clear previous
        const selector = createClassSelector(state.newDeckClass, (cls) => {
            state.newDeckClass = cls;
            renderModalClassSelector(); // Re-render to show selection
            checkDeckFormValidity();
        });
        modalClassSelectorContainer.appendChild(selector);
    };
    
    const renderDeckList = () => {
        const decks = state.decks;
        let contentHTML;
        
        if (decks.length === 0) {
            contentHTML = `
                <div class="text-center border-2 border-dashed border-gray-300 rounded-lg p-12">
                    <h3 class="text-sm font-medium text-gray-900">${t('noDecks')}</h3>
                    <p class="mt-1 text-sm text-gray-500">${t('noDecksHint')}</p>
                </div>
            `;
        } else {
            const deckCardsHTML = decks.map(deck => {
                const wins = deck.games.filter(g => g.result === 'Win').length;
                const losses = deck.games.filter(g => g.result === 'Loss').length;
                const style = classStyles[deck.class];
                
                const lastGame = deck.games.length > 0 ? [...deck.games].sort((a, b) => b.timestamp - a.timestamp)[0] : null;
                const lastPlayedDate = lastGame ? new Date(lastGame.timestamp).toLocaleDateString(state.language === 'ja' ? 'ja-JP' : undefined, { month: 'short', day: 'numeric' }) : null;

                const isEditing = state.view.type === 'list' && state.view.editingDeckId === deck.id;

                return `
                    <div class="bg-white rounded-lg shadow-md border-l-4 ${style.border} p-4 flex flex-col justify-between transition-all hover:shadow-xl hover:-translate-y-px">
                        <div class="flex-grow">
                            ${isEditing ? `
                                <div class="flex gap-2 items-center mb-1">
                                    <input 
                                        type="text" 
                                        value="${deck.name}" 
                                        data-deck-id="${deck.id}"
                                        aria-label="Deck name"
                                        class="flex-grow w-full px-2 py-1 text-lg font-bold border border-blue-400 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                                    >
                                    <button data-action="save-edit" data-deck-id="${deck.id}" aria-label="${t('saveName')}" class="flex-shrink-0 p-1.5 text-white bg-green-500 rounded-full hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                                    </button>
                                     <button data-action="cancel-edit" data-deck-id="${deck.id}" aria-label="${t('cancelEdit')}" class="flex-shrink-0 p-1.5 text-white bg-red-500 rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            ` : `
                                <div class="flex justify-between items-start mb-1">
                                    <div class="flex items-center gap-2 min-w-0">
                                        <h3 class="text-lg font-bold text-gray-800 truncate" title="${deck.name}">${deck.name}</h3>
                                        <button data-action="edit-deck" data-deck-id="${deck.id}" aria-label="${t('renameDeck', {name: deck.name})}" class="p-1.5 text-gray-400 rounded-full hover:bg-gray-200 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 flex-shrink-0">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                                        </button>
                                    </div>
                                    <span class="flex-shrink-0 ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${style.bg} ${style.text}">${getTranslated(CLASS_NAMES, deck.class)}</span>
                                </div>
                            `}
                            <div class="mt-3 flex justify-between items-end text-sm">
                                <div class="flex items-baseline gap-4">
                                    <p><span class="font-bold text-lg text-green-600">${wins}</span> <span class="text-gray-500">${t('wins')}</span></p>
                                    <p><span class="font-bold text-lg text-red-600">${losses}</span> <span class="text-gray-500">${t('losses')}</span></p>
                                </div>
                                ${lastPlayedDate ? `<p class="text-xs text-gray-400">${lastPlayedDate}</p>` : ''}
                            </div>
                        </div>
                        <div class="mt-4 border-t border-gray-200 pt-3 flex items-center justify-between">
                            <div class="flex gap-2">
                                <button data-action="add_game" data-deck-id="${deck.id}" class="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">${t('addGame')}</button>
                                <button data-action="stats" data-deck-id="${deck.id}" class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400">${t('stats')}</button>
                            </div>
                            <button data-action="delete" data-deck-id="${deck.id}" aria-label="${t('deckAriaDelete', {name: deck.name})}" class="p-2 text-gray-400 rounded-full hover:bg-red-100 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
            contentHTML = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">${deckCardsHTML}</div>`;
        }

        appContainer.innerHTML = `
            <main class="w-full max-w-7xl mx-auto">
                <div class="bg-white rounded-xl shadow-lg p-6 md:p-10">
                    <h1 class="text-3xl sm:text-4xl font-bold text-gray-800 tracking-tight text-center">${t('appName')}</h1>
                    <div class="mt-6 flex items-center justify-center sm:justify-end gap-2 flex-wrap">
                        <button id="toggle-lang-btn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400">
                            ${state.language === 'en' ? '日本語' : 'English'}
                        </button>
                        <button id="import-btn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400">
                            ${t('import')}
                        </button>
                        <button id="export-btn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50" ${decks.length === 0 ? 'disabled' : ''}>
                            ${t('export')}
                        </button>
                        <button id="reset-all-btn" class="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50 disabled:cursor-not-allowed" ${decks.length === 0 ? 'disabled' : ''}>
                            ${t('resetAll')}
                        </button>
                        <button id="add-deck-btn" class="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-transform transform hover:scale-105">
                            ${t('addNewDeck')}
                        </button>
                    </div>
                    <div class="mt-10">${contentHTML}</div>
                    <p class="mt-8 text-center text-base text-gray-500">${t('appSubtitle')}</p>
                </div>
            </main>
        `;
        
        document.getElementById('add-deck-btn').addEventListener('click', openAddDeckModal);
        document.getElementById('import-btn').addEventListener('click', handleImport);
        document.getElementById('export-btn').addEventListener('click', handleExport);
        document.getElementById('toggle-lang-btn').addEventListener('click', () => {
            state.language = state.language === 'en' ? 'ja' : 'en';
            saveSettings();
            render();
        });
        if (decks.length > 0) {
            document.getElementById('reset-all-btn').addEventListener('click', openResetModal);
        }

        appContainer.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', (e) => {
                const { action, deckId } = e.currentTarget.dataset;
                if (!action || !deckId) return;

                if (action === 'delete') {
                    openDeleteDeckModal(deckId);
                } else if (action === 'stats') {
                    state.view = { type: 'stats', deckId, filterClass: null, dateFilter: { start: null, end: null }, statsDeckSwitcherVisible: false, dateFilterVisible: false };
                    render();
                } else if (action === 'add_game') {
                    state.view = { type: action, deckId };
                    render();
                } else if (action === 'edit-deck') {
                    state.view.editingDeckId = deckId;
                    render();
                } else if (action === 'save-edit') {
                    const input = appContainer.querySelector(`input[data-deck-id="${deckId}"]`);
                    const newName = input.value.trim();
                    if (newName) {
                        state.decks = state.decks.map(d => d.id === deckId ? { ...d, name: newName } : d);
                        saveDecks();
                    }
                    state.view.editingDeckId = null;
                    render();
                } else if (action === 'cancel-edit') {
                    state.view.editingDeckId = null;
                    render();
                }
            });
        });

        if (state.view.type === 'list' && state.view.editingDeckId) {
            const deckId = state.view.editingDeckId;
            const input = appContainer.querySelector(`input[data-deck-id="${deckId}"]`);
            if(input) {
                input.focus();
                input.select();
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        const newName = input.value.trim();
                        if (newName) {
                            state.decks = state.decks.map(d => d.id === deckId ? { ...d, name: newName } : d);
                            saveDecks();
                        }
                        state.view.editingDeckId = null;
                        render();
                    } else if (e.key === 'Escape') {
                        state.view.editingDeckId = null;
                        render();
                    }
                });
            }
        }
    };

    const renderAddGameView = (deckId) => {
        const deck = state.decks.find(d => d.id === deckId);
        if (!deck) {
            state.view = { type: 'list', editingDeckId: null };
            render();
            return;
        }
        
        const titleWithPlaceholder = t('addGameTitle', { name: '%%DECK_NAME%%' });
        const [prefix, suffix] = titleWithPlaceholder.split('%%DECK_NAME%%');

        appContainer.innerHTML = `
            <main class="w-full max-w-2xl mx-auto">
                <div class="flex items-center justify-between gap-4 mb-4">
                    <button id="back-to-decks" class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
                        ${t('back')}
                    </button>
                    <div class="flex-1 min-w-0 overflow-hidden">
                        <h2 class="flex items-baseline justify-end text-xl font-bold text-gray-800" title="${t('addGameTitle', { name: deck.name })}">
                            <span class="whitespace-nowrap">${prefix}</span>
                            <span class="ml-1 ${classStyles[deck.class].text} truncate">${deck.name}</span>
                            <span class="whitespace-nowrap">${suffix}</span>
                        </h2>
                    </div>
                </div>
                <div class="bg-white rounded-xl shadow-lg p-6 md:p-8">
                    <form id="add-game-form" class="space-y-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">${t('opponentClass')}</label>
                            <div id="game-class-selector-container"></div>
                        </div>
                        <div>
                            <span class="block text-sm font-medium text-gray-700">${t('turn')}</span>
                            <div id="turn-selector" class="mt-2 grid grid-cols-2 gap-4">
                                <button type="button" data-value="1st" class="w-full text-center px-4 py-3 font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 transform hover:-translate-y-px bg-gray-200 text-gray-700 hover:bg-gray-300 ring-blue-500">${getTranslated(TURN_NAMES, '1st')}</button>
                                <button type="button" data-value="2nd" class="w-full text-center px-4 py-3 font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 transform hover:-translate-y-px bg-gray-200 text-gray-700 hover:bg-gray-300 ring-blue-500">${getTranslated(TURN_NAMES, '2nd')}</button>
                            </div>
                        </div>
                        <div>
                            <span class="block text-sm font-medium text-gray-700">${t('result')}</span>
                            <div id="result-selector" class="mt-2 grid grid-cols-2 gap-4">
                                <button type="button" data-value="Win" class="w-full text-center px-4 py-3 font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 transform hover:-translate-y-px bg-green-100 text-green-800 hover:bg-green-200 ring-green-500">${getTranslated(RESULT_NAMES, 'Win')}</button>
                                <button type="button" data-value="Loss" class="w-full text-center px-4 py-3 font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 transform hover:-translate-y-px bg-red-100 text-red-800 hover:bg-red-200 ring-red-500">${getTranslated(RESULT_NAMES, 'Loss')}</button>
                            </div>
                        </div>
                        <div class="border-t border-gray-200 pt-5">
                             <button id="save-game-button" type="submit" disabled class="w-full px-4 py-3 font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 bg-gray-400 text-gray-100 cursor-not-allowed ring-gray-400">
                                ${t('saveGame')}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        `;

        let opponentClass = null;
        let turn = null;
        let result = null;

        const saveButton = document.getElementById('save-game-button');

        const checkFormComplete = () => {
            if (opponentClass && turn && result) {
                saveButton.disabled = false;
                saveButton.className = 'w-full px-4 py-3 font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 bg-blue-600 text-white hover:bg-blue-700 ring-blue-500';
            } else {
                saveButton.disabled = true;
                saveButton.className = 'w-full px-4 py-3 font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 bg-gray-400 text-gray-100 cursor-not-allowed ring-gray-400';
            }
        };
        
        const renderGameClassSelector = () => {
            const container = document.getElementById('game-class-selector-container');
            container.innerHTML = '';
            const selector = createClassSelector(opponentClass, (cls) => {
                opponentClass = cls;
                renderGameClassSelector();
                checkFormComplete();
            });
            container.appendChild(selector);
        };
        renderGameClassSelector();
        
        document.getElementById('turn-selector').addEventListener('click', e => {
            if (e.target.tagName === 'BUTTON') {
                turn = e.target.dataset.value;
                document.querySelectorAll('#turn-selector button').forEach(btn => {
                    btn.setAttribute('aria-pressed', String(btn.dataset.value === turn));
                    if (btn.dataset.value === turn) {
                        btn.className = `w-full text-center px-4 py-3 font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 transform hover:-translate-y-px bg-blue-600 text-white shadow-md ring-blue-500`;
                    } else {
                        btn.className = `w-full text-center px-4 py-3 font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 transform hover:-translate-y-px bg-gray-200 text-gray-700 hover:bg-gray-300 ring-blue-500`;
                    }
                });
                checkFormComplete();
            }
        });
        
        document.getElementById('result-selector').addEventListener('click', e => {
            if (e.target.tagName === 'BUTTON') {
                result = e.target.dataset.value;
                document.querySelectorAll('#result-selector button').forEach(btn => {
                    btn.setAttribute('aria-pressed', String(btn.dataset.value === result));
                    if (btn.dataset.value === result) {
                        const styleClass = result === 'Win' ? 'bg-green-600 text-white shadow-md ring-green-500' : 'bg-red-600 text-white shadow-md ring-red-500';
                        btn.className = `w-full text-center px-4 py-3 font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 transform hover:-translate-y-px ${styleClass}`;
                    } else {
                        const originalStyle = btn.dataset.value === 'Win' ? 'bg-green-100 text-green-800 hover:bg-green-200 ring-green-500' : 'bg-red-100 text-red-800 hover:bg-red-200 ring-red-500';
                         btn.className = `w-full text-center px-4 py-3 font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 transform hover:-translate-y-px ${originalStyle}`;
                    }
                });
                checkFormComplete();
            }
        });

        document.getElementById('back-to-decks').addEventListener('click', () => {
            state.view = { type: 'list', editingDeckId: null };
            render();
        });
        
        document.getElementById('add-game-form').addEventListener('submit', (e) => {
            e.preventDefault();
            if (!saveButton.disabled) {
                const newGame = {
                    id: crypto.randomUUID(),
                    timestamp: Date.now(),
                    opponentClass,
                    turn,
                    result
                };
                
                state.decks = state.decks.map(d =>
                    d.id === deckId ? { ...d, games: [...d.games, newGame] } : d
                );
                saveDecks();
                
                saveButton.textContent = t('gameSaved');
                saveButton.className = 'w-full px-4 py-3 font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 bg-green-600 text-white ring-green-500';
                saveButton.disabled = true;

                setTimeout(() => {
                    renderAddGameView(deckId);
                }, 375);
            }
        });
    };

    const renderStatsView = (deckId) => {
        const { filterClass, dateFilter, statsDeckSwitcherVisible, dateFilterVisible } = state.view;

        let displayDeck;
        let isAllDecksView = deckId === 'all';

        if (isAllDecksView) {
            const allGames = state.decks.flatMap(d => d.games.map(g => ({...g, originalDeckId: d.id, originalDeckClass: d.class})));
            displayDeck = { id: 'all', name: t('allDecks'), class: 'All', games: allGames };
        } else {
            displayDeck = state.decks.find(d => d.id === deckId);
        }

        if (!displayDeck) {
            state.view = { type: 'list', editingDeckId: null };
            render();
            return;
        }

        const calculateStats = (games) => {
            const total = games.length;
            const wins = games.filter(g => g.result === 'Win').length;
            const losses = total - wins;

            const firstTurnGames = games.filter(g => g.turn === '1st');
            const firstTurnWins = firstTurnGames.filter(g => g.result === 'Win').length;
            
            const secondTurnGames = games.filter(g => g.turn === '2nd');
            const secondTurnWins = secondTurnGames.filter(g => g.result === 'Win').length;

            const opponentDistribution = games.reduce((acc, game) => {
                acc[game.opponentClass] = (acc[game.opponentClass] || 0) + 1;
                return acc;
            }, {});

            const formatRate = (wins, total) => total > 0 ? `${((wins / total) * 100).toFixed(1)}%` : t('na');

            return {
                total, wins, losses, winRate: formatRate(wins, total),
                firstTurnTotal: firstTurnGames.length, firstTurnWins, firstTurnWinRate: formatRate(firstTurnWins, firstTurnGames.length),
                secondTurnTotal: secondTurnGames.length, secondTurnWins, secondTurnWinRate: formatRate(secondTurnWins, secondTurnGames.length),
                opponentDistribution
            };
        };
        
        // --- Filtering Logic ---
        let filteredDeckGames = displayDeck.games;
        if (dateFilter && (dateFilter.start || dateFilter.end)) {
            const start = dateFilter.start ? new Date(dateFilter.start).setHours(0, 0, 0, 0) : 0;
            const end = dateFilter.end ? new Date(dateFilter.end).setHours(23, 59, 59, 999) : Date.now();
            filteredDeckGames = filteredDeckGames.filter(g => g.timestamp >= start && g.timestamp <= end);
        }

        const gamesToAnalyze = filterClass ? filteredDeckGames.filter(g => g.opponentClass === filterClass) : filteredDeckGames;
        const sortedGames = [...gamesToAnalyze].sort((a, b) => b.timestamp - a.timestamp);
        const stats = calculateStats(gamesToAnalyze);
        const totalStatsForPie = calculateStats(filteredDeckGames);
        
        const winRateByClass = CLASSES.reduce((acc, cls) => {
            const gamesVsClass = filteredDeckGames.filter(g => g.opponentClass === cls);
            if (gamesVsClass.length === 0) {
                acc[cls] = t('na');
                return acc;
            }
            const winsVsClass = gamesVsClass.filter(g => g.result === 'Win').length;
            acc[cls] = `${((winsVsClass / gamesVsClass.length) * 100).toFixed(1)}%`;
            return acc;
        }, {});
        
        const createDonutChart = () => {
            if (filteredDeckGames.length === 0) return `<div class="w-[240px] h-[240px] flex items-center justify-center text-gray-400">${t('na')}</div>`;
            
            const radius = 110;
            const strokeWidth = 30;
            const circumference = 2 * Math.PI * radius;
            const gapSize = circumference * 0.005;
            let offset = 0;

            const segments = CLASSES.map(cls => {
                const count = totalStatsForPie.opponentDistribution[cls] || 0;
                if (count === 0) return '';
                const percentage = count / filteredDeckGames.length;
                const arcLength = percentage * circumference;
                
                const isFiltered = filterClass && cls === filterClass;
                const isInactive = filterClass && !isFiltered;

                const style = `
                    opacity: ${isInactive ? '0.4' : '1'};
                    transform: ${isFiltered ? 'scale(1.05)' : 'scale(1)'};
                    transform-origin: center;
                `;
                
                const segment = `<circle class="transition-all duration-300"
                    cx="130" cy="130" r="${radius}"
                    fill="transparent"
                    stroke="${classStyles[cls].chart}"
                    stroke-width="${strokeWidth}"
                    stroke-dasharray="${arcLength - gapSize} ${circumference}"
                    stroke-dashoffset="-${offset}"
                    style="${style}"
                />`;
                offset += arcLength;
                return segment;
            }).join('');
            
            return `
                 <div class="relative flex-shrink-0">
                     <svg width="240" height="240" viewBox="0 0 260 260" class="-rotate-90">${segments}</svg>
                     <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                         <div class="text-center">
                             <p class="text-4xl font-bold text-gray-800">${stats.total}</p>
                             <p class="text-sm text-gray-500">${t('games')}</p>
                         </div>
                     </div>
                 </div>
            `;
        };
        
        const opponentBreakdownHTML = CLASSES.map(cls => {
            const count = totalStatsForPie.opponentDistribution[cls] || 0;
            if (count === 0 && filteredDeckGames.length > 0) return '';

            const percentage = filteredDeckGames.length > 0 ? ((count / filteredDeckGames.length) * 100).toFixed(1) : '0.0';
            const style = classStyles[cls];
            const winRate = winRateByClass[cls];
            const isFiltered = filterClass === cls;

            return `
                <button data-action="filter-stats" data-class="${cls}" class="grid grid-cols-3 w-full text-left p-2 rounded-md items-center transition-all duration-200 ${isFiltered ? `bg-blue-100 ring-1 ring-blue-400 shadow-sm` : 'hover:bg-gray-50'}">
                    <span class="flex items-center gap-3 col-span-1 truncate">
                        <span class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: ${style.chart}"></span>
                        <span class="text-sm font-medium text-gray-700 truncate">${getTranslated(CLASS_NAMES, cls)}</span>
                    </span>
                    <span class="text-sm text-gray-600 text-center col-span-1">
                        <span class="font-semibold text-gray-800">${percentage}%</span>
                    </span>
                    <span class="text-sm text-gray-600 text-right col-span-1">
                        <span class="font-semibold text-gray-800">${winRate}</span>
                    </span>
                </button>
            `;
        }).join('');


        const recentMatchesHTML = sortedGames.map(game => {
            const opponentStyle = classStyles[game.opponentClass];
            const resultStyle = game.result === 'Win' ? 'text-green-600' : 'text-red-600';
            const date = new Date(game.timestamp).toLocaleDateString(state.language === 'ja' ? 'ja-JP' : undefined, { month: 'short', day: 'numeric' });
            
            const deckForGame = isAllDecksView ? state.decks.find(d => d.id === game.originalDeckId) : null;
            const deckName = deckForGame ? deckForGame.name : 'Unknown';
            const gameDeckInfo = isAllDecksView ? `
                <span class="inline-block ml-2 px-2 py-0.5 text-xs font-semibold rounded-full truncate max-w-32 ${classStyles[game.originalDeckClass].bg} ${classStyles[game.originalDeckClass].text}" title="${deckName}">${deckName}</span>
            ` : '';

            return `
                 <li class="flex items-center justify-between p-3" data-game-id="${game.id}" data-deck-id="${game.originalDeckId || deckId}">
                    <div class="flex items-center gap-3 min-w-0">
                        <span class="w-24 text-center px-2 py-1 text-xs font-semibold rounded-full ${opponentStyle.bg} ${opponentStyle.text}">${getTranslated(CLASS_NAMES, game.opponentClass)}</span>
                        <div>
                            <p class="font-semibold ${resultStyle}">${getTranslated(RESULT_NAMES, game.result)}</p>
                            <p class="text-xs text-gray-500">${t('wentTurn', {turn: getTranslated(TURN_NAMES, game.turn)})}</p>
                        </div>
                        ${gameDeckInfo}
                    </div>
                    <div class="flex items-center gap-2">
                        <p class="text-sm text-gray-400">${date}</p>
                        <button data-action="delete-match" aria-label="${t('matchAriaDelete')}" class="p-1 text-gray-400 rounded-full hover:bg-red-100 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500">
                             <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </li>
            `;
        }).join('');

        const statsLayoutHTML = `
            <div class="flex justify-around items-start text-center md:grid md:grid-cols-[max-content,auto] md:gap-x-6 md:gap-y-4 md:text-left">
                <!-- Overall -->
                <div class="md:contents">
                    <p class="text-sm text-gray-500 md:text-right md:font-semibold md:self-center">${t('winRate')}</p>
                    <div>
                        <p class="text-2xl font-bold text-gray-800">${stats.winRate}</p>
                        <p class="text-xs text-gray-400">${stats.wins}${t('winsShort')} / ${stats.losses}${t('lossesShort')}</p>
                    </div>
                </div>

                <!-- 1st -->
                <div class="md:contents">
                    <p class="text-sm text-gray-500 md:text-right md:font-semibold md:self-center">${t('firstWinRate')}</p>
                    <div>
                        <p class="text-xl font-semibold text-gray-800">${stats.firstTurnWinRate}</p>
                        <p class="text-xs text-gray-400">${stats.firstTurnTotal > 0 ? `${stats.firstTurnWins}${t('winsShort')} / ${stats.firstTurnTotal}${t('gamesShort')}` : t('na')}</p>
                    </div>
                </div>

                <!-- 2nd -->
                <div class="md:contents">
                    <p class="text-sm text-gray-500 md:text-right md:font-semibold md:self-center">${t('secondWinRate')}</p>
                    <div>
                        <p class="text-xl font-semibold text-gray-800">${stats.secondTurnWinRate}</p>
                        <p class="text-xs text-gray-400">${stats.secondTurnTotal > 0 ? `${stats.secondTurnWins}${t('winsShort')} / ${stats.secondTurnTotal}${t('gamesShort')}` : t('na')}</p>
                    </div>
                </div>
            </div>
        `;

        appContainer.innerHTML = `
            <main class="w-full max-w-7xl mx-auto">
                 <div class="relative">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-2 min-w-0">
                            <button id="back-to-decks" class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
                                ${t('back')}
                            </button>
                             <div class="relative flex-1 min-w-0 ml-2">
                                <button id="deck-switcher-btn" class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-200 transition-colors w-full text-left">
                                    <h2 class="text-2xl font-bold text-gray-800 truncate flex-1 min-w-0">${t('statsFor', {name: `<span class="${classStyles[displayDeck.class].text}">${displayDeck.name}</span>`})}</h2>
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 transition-transform flex-shrink-0 ${statsDeckSwitcherVisible ? 'rotate-180' : ''}" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                                    </svg>
                                </button>
                                <!-- Deck Switcher Dropdown -->
                                <div id="deck-switcher-dropdown" class="${statsDeckSwitcherVisible ? '' : 'hidden'} absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-xl border z-20 overflow-hidden">
                                    <ul class="max-h-60 overflow-y-auto">
                                        <li>
                                            <button data-deck-id="all" class="w-full text-left px-4 py-3 text-sm font-semibold hover:bg-blue-50 transition-colors ${isAllDecksView ? 'text-blue-600' : 'text-gray-700'}">
                                                ${t('allDecks')}
                                            </button>
                                        </li>
                                        ${state.decks.map(d => `
                                            <li>
                                                <button data-deck-id="${d.id}" class="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 transition-colors ${d.id === deckId ? 'text-blue-600 font-semibold' : 'text-gray-700'}">
                                                    ${d.name} <span class="text-xs ${classStyles[d.class].text}">(${getTranslated(CLASS_NAMES, d.class)})</span>
                                                </button>
                                            </li>
                                        `).join('')}
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div class="relative">
                           <button id="toggle-date-filter-btn" class="p-2 rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                           </button>
                            <!-- Date Filter Card -->
                            <div id="date-filter-card" class="${dateFilterVisible ? '' : 'hidden'} absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-20 p-4">
                                <p class="text-sm font-semibold text-gray-700 mb-3">${t('toggleDateFilter')}</p>
                                <form id="date-filter-form" class="space-y-3">
                                    <div>
                                        <label for="start-date" class="block text-xs font-medium text-gray-600">${t('from')}</label>
                                        <input type="date" id="start-date" name="start-date" value="${dateFilter.start || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white text-black">
                                    </div>
                                    <div>
                                        <label for="end-date" class="block text-xs font-medium text-gray-600">${t('to')}</label>
                                        <input type="date" id="end-date" name="end-date" value="${dateFilter.end || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white text-black">
                                    </div>
                                    <div class="flex items-center justify-end gap-2 pt-2">
                                        <button type="button" id="clear-date-filter-btn" class="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400">${t('clear')}</button>
                                        <button type="submit" class="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">${t('apply')}</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-2 min-h-[1.25rem]">
                        ${filterClass || (dateFilter.start || dateFilter.end) ? `
                            <div class="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                                ${filterClass ? `<p>${t('filterOpponent', {name: `<span class="font-semibold ${classStyles[filterClass].text}">${getTranslated(CLASS_NAMES, filterClass)}</span>`})}</p>` : ''}
                                ${dateFilter.start || dateFilter.end ? `<p>${t('filterPeriod', {start: `<span class="font-semibold text-gray-700">${dateFilter.start || '...'}</span>`, end: `<span class="font-semibold text-gray-700">${dateFilter.end || '...'}</span>`})}</p>` : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                ${displayDeck.games.length === 0 ? `
                    <div class="text-center bg-white rounded-lg shadow-md border-2 border-dashed border-gray-300 p-12 mt-4">
                        <h3 class="text-sm font-medium text-gray-900">${t('noGames')}</h3>
                        <p class="mt-1 text-sm text-gray-500">${t('noGamesHint')}</p>
                    </div>
                ` : `
                    <div class="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                        <!-- CARD 1: PERFORMANCE & OPPONENT OVERVIEW -->
                        <div class="bg-white rounded-lg shadow-md p-6">
                            <div class="flex flex-col md:flex-row items-center justify-around gap-6">
                                <div class="flex-shrink-0 w-full md:w-64">
                                    ${statsLayoutHTML}
                                </div>
                                <div class="flex-grow flex justify-center">
                                    ${createDonutChart()}
                                </div>
                            </div>

                            <div class="mt-8 border-t border-gray-200 pt-6">
                                 <div class="flex justify-between items-center mb-4">
                                     <h3 class="text-base font-semibold text-gray-700">${t('opponentBreakdown')}</h3>
                                      ${filterClass ? `<button id="clear-class-filter-btn" class="text-xs text-blue-500 hover:underline">${t('showAllClasses')}</button>` : ''}
                                </div>
                                <div class="grid grid-cols-3 text-xs text-gray-500 font-medium px-2 pb-1 border-b">
                                    <span class="col-span-1">${t('opponent')}</span>
                                    <span class="text-center col-span-1">${t('playRate')}</span>
                                    <span class="text-right col-span-1">${t('winRate')}</span>
                                </div>
                                <div class="space-y-1 mt-2">
                                    ${opponentBreakdownHTML}
                                </div>
                            </div>
                        </div>

                        <!-- CARD 2: RECENT MATCHES -->
                        <div class="bg-white rounded-lg shadow-md p-6">
                            <h3 class="text-lg font-semibold text-gray-700 mb-4">${t('matchHistory')} ${filterClass ? t('vs', {name: getTranslated(CLASS_NAMES, filterClass)}): ''}</h3>
                            <div class="bg-white rounded-lg border border-gray-200">
                                <ul id="recent-matches-list" class="max-h-[36rem] overflow-y-auto divide-y divide-gray-100">
                                    ${recentMatchesHTML || `<li class="p-4 text-center text-gray-500">${t('noMatchesFilter')}</li>`}
                                </ul>
                            </div>
                        </div>
                    </div>
                `}
            </main>
        `;
        
        document.getElementById('back-to-decks').addEventListener('click', () => {
            state.view = { type: 'list', editingDeckId: null };
            render();
        });

        document.getElementById('toggle-date-filter-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            state.view.dateFilterVisible = !state.view.dateFilterVisible;
            if (state.view.dateFilterVisible) state.view.statsDeckSwitcherVisible = false;
            render();
        });

        document.getElementById('deck-switcher-btn')?.addEventListener('click', (e) => {
             e.stopPropagation();
            state.view.statsDeckSwitcherVisible = !state.view.statsDeckSwitcherVisible;
             if (state.view.statsDeckSwitcherVisible) state.view.dateFilterVisible = false;
            render();
        });
        
        document.getElementById('deck-switcher-dropdown')?.addEventListener('click', (e) => {
            const button = e.target.closest('button[data-deck-id]');
            if (button) {
                const newDeckId = button.dataset.deckId;
                state.view = { ...state.view, deckId: newDeckId, filterClass: null, statsDeckSwitcherVisible: false };
                render();
            }
        });

        if (filterClass) {
            document.getElementById('clear-class-filter-btn')?.addEventListener('click', () => {
                 state.view = { ...state.view, filterClass: null };
                 render();
            });
        }
        
        document.getElementById('date-filter-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const startDate = e.target.elements['start-date'].value;
            const endDate = e.target.elements['end-date'].value;
            state.view.dateFilter = { start: startDate || null, end: endDate || null };
            state.view.dateFilterVisible = false;
            render();
        });

        document.getElementById('clear-date-filter-btn')?.addEventListener('click', () => {
            state.view.dateFilter = { start: null, end: null };
            render();
        });

        appContainer.querySelectorAll('[data-action="filter-stats"]').forEach(el => {
            el.addEventListener('click', (e) => {
                const selectedClass = e.currentTarget.dataset.class;
                const newFilter = filterClass === selectedClass ? null : selectedClass;
                state.view = { ...state.view, filterClass: newFilter };
                render();
            });
        });

        document.getElementById('recent-matches-list')?.addEventListener('click', (e) => {
            const deleteButton = e.target.closest('[data-action="delete-match"]');
            if (deleteButton) {
                const gameListItem = e.target.closest('li');
                const gameId = gameListItem.dataset.gameId;
                const deckIdForMatch = gameListItem.dataset.deckId;
                openDeleteMatchModal(deckIdForMatch, gameId);
            }
        });

        // Close dropdowns if clicking outside
        document.addEventListener('click', (e) => {
            if (state.view.type === 'stats' && (state.view.statsDeckSwitcherVisible || state.view.dateFilterVisible)) {
                const deckSwitcher = document.getElementById('deck-switcher-dropdown');
                const dateFilter = document.getElementById('date-filter-card');
                const deckSwitcherBtn = document.getElementById('deck-switcher-btn');
                const dateFilterBtn = document.getElementById('toggle-date-filter-btn');

                let clickedInside = false;
                if (deckSwitcherBtn?.contains(e.target)) clickedInside = true;
                if (dateFilterBtn?.contains(e.target)) clickedInside = true;
                if (deckSwitcher?.contains(e.target)) clickedInside = true;
                if (dateFilter?.contains(e.target)) clickedInside = true;

                if (!clickedInside) {
                    state.view.statsDeckSwitcherVisible = false;
                    state.view.dateFilterVisible = false;
                    render();
                }
            }
        }, { once: true }); // Use once to avoid listener buildup
    };

    const renderModals = () => {
        // Add Deck Modal
        document.querySelector('#add-deck-modal h2').textContent = t('addNewDeck');
        document.querySelector('#add-deck-modal label[for="deckName"]').textContent = t('deckName');
        document.querySelector('#add-deck-modal #deckName').placeholder = t('deckNamePlaceholder');
        document.querySelector('#add-deck-modal #deck-class-label').textContent = t('class');
        document.querySelector('#add-deck-modal #cancel-deck-button').textContent = t('cancel');
        document.querySelector('#add-deck-modal #save-deck-button').textContent = t('saveDeck');

        // Delete Deck Modal
        document.querySelector('#delete-deck-confirm-modal #delete-deck-modal-title').textContent = t('deleteDeckTitle');
        const deckToDelete = state.deckToDeleteId ? state.decks.find(d => d.id === state.deckToDeleteId) : null;
        document.querySelector('#delete-deck-confirm-modal p.text-sm').innerHTML = t('deleteDeckConfirm', {name: `<strong id="deck-to-delete-name">${deckToDelete ? deckToDelete.name : ''}</strong>`});
        document.querySelector('#delete-deck-confirm-modal #confirm-delete-deck-button').textContent = t('delete');
        document.querySelector('#delete-deck-confirm-modal #cancel-delete-deck-button').textContent = t('cancel');
        
        // Delete Match Modal
        document.querySelector('#delete-match-confirm-modal #delete-match-modal-title').textContent = t('deleteMatchTitle');
        document.querySelector('#delete-match-confirm-modal p.text-sm').textContent = t('deleteMatchConfirm');
        document.querySelector('#delete-match-confirm-modal #confirm-delete-match-button').textContent = t('delete');
        document.querySelector('#delete-match-confirm-modal #cancel-delete-match-button').textContent = t('cancel');
        
        // Import Modal
        document.querySelector('#import-confirm-modal #import-modal-title').textContent = t('importTitle');
        document.querySelector('#import-confirm-modal p.text-sm').textContent = t('importConfirm');
        document.querySelector('#import-confirm-modal #confirm-import-button').textContent = t('importAndOverwrite');
        document.querySelector('#import-confirm-modal #cancel-import-button').textContent = t('cancel');

        // Reset Modal
        document.querySelector('#reset-confirm-modal #reset-modal-title').textContent = t('resetTitle');
        document.querySelector('#reset-confirm-modal p.text-sm').textContent = t('resetConfirm');
        document.querySelector('#reset-confirm-modal #confirm-reset-button').textContent = t('reset');
        document.querySelector('#reset-confirm-modal #cancel-reset-button').textContent = t('cancel');
    };

    const render = () => {
        document.documentElement.lang = state.language;
        const { type, deckId } = state.view;
        switch (type) {
            case 'add_game':
                renderAddGameView(deckId);
                break;
            case 'stats':
                renderStatsView(deckId);
                break;
            case 'list':
            default:
                renderDeckList();
                break;
        }
        renderModals();
    };
    
    // --- EVENT LISTENERS ---
    
    modalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const deckName = deckNameInput.value.trim();
        if (saveDeckButton.disabled || !deckName || !state.newDeckClass) {
            return;
        }
        
        const newDeck = {
            id: crypto.randomUUID(),
            name: deckName,
            class: state.newDeckClass,
            games: [],
        };
        
        state.decks.unshift(newDeck);
        saveDecks();
        closeAddDeckModal();
        render();
    });
    
    deckNameInput.addEventListener('input', checkDeckFormValidity);
    cancelDeckButton.addEventListener('click', closeAddDeckModal);

    cancelDeleteDeckButton.addEventListener('click', closeDeleteDeckModal);

    confirmDeleteDeckButton.addEventListener('click', () => {
        if (state.deckToDeleteId) {
            state.decks = state.decks.filter(d => d.id !== state.deckToDeleteId);
            saveDecks();
            const deckToDeleteId = state.deckToDeleteId;
            closeDeleteDeckModal();
            // If the deleted deck was the one being viewed in stats, go back to list
            if(state.view.type === 'stats' && state.view.deckId === deckToDeleteId) {
                state.view = { type: 'list', editingDeckId: null };
            }
            render();
        }
    });

    cancelDeleteMatchButton.addEventListener('click', closeDeleteMatchModal);

    confirmDeleteMatchButton.addEventListener('click', () => {
        if (state.matchToDelete) {
            const { deckId, gameId } = state.matchToDelete;
            state.decks = state.decks.map(deck => {
                if (deck.id === deckId) {
                    return {
                        ...deck,
                        games: deck.games.filter(g => g.id !== gameId),
                    };
                }
                return deck;
            });
            saveDecks();
            closeDeleteMatchModal();
            render(); // Re-render the stats view
        }
    });

    importFileInput.addEventListener('change', handleFileSelect);

    cancelImportButton.addEventListener('click', closeImportModal);

    confirmImportButton.addEventListener('click', () => {
        if (state.fileToImport) {
            processImportFile(state.fileToImport);
        }
        closeImportModal();
    });

    cancelResetButton.addEventListener('click', closeResetModal);

    confirmResetButton.addEventListener('click', () => {
        state.decks = [];
        saveDecks();
        closeResetModal();
        render();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;

        // Modals are prioritized
        if (!addDeckModal.classList.contains('hidden')) {
            e.preventDefault();
            closeAddDeckModal();
        } else if (!deleteDeckConfirmModal.classList.contains('hidden')) {
            e.preventDefault();
            closeDeleteDeckModal();
        } else if (!deleteMatchConfirmModal.classList.contains('hidden')) {
            e.preventDefault();
            closeDeleteMatchModal();
        } else if (!importConfirmModal.classList.contains('hidden')) {
            e.preventDefault();
            closeImportModal();
        } else if (!resetConfirmModal.classList.contains('hidden')) {
            e.preventDefault();
            closeResetModal();
        } 
        // Then views
        else if (state.view.type === 'add_game' || state.view.type === 'stats') {
            e.preventDefault();
            state.view = { type: 'list', editingDeckId: null };
            render();
        } 
        // Then deck name editing
        else if (state.view.type === 'list' && state.view.editingDeckId) {
            e.preventDefault();
            state.view.editingDeckId = null;
            render();
        }
    });
    
    // --- INITIALIZATION ---
    state.decks = loadDecks();
    const settings = loadSettings();
    if(settings.language && translations[settings.language]) {
        state.language = settings.language;
    }
    render();
});
