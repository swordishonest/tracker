
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
    const STORAGE_KEY = 'svwb-deck-tracker-decks';

    // --- STATE MANAGEMENT ---
    let state = {
        decks: [],
        view: { type: 'list' }, // { type: 'list' } | { type: 'add_game', deckId: '...' } | { type: 'stats', deckId: '...', filterClass: null, dateFilter: { start: null, end: null }, statsDeckSwitcherVisible: false, dateFilterVisible: false }
        newDeckClass: null,
        deckToDeleteId: null,
        matchToDelete: null, // { deckId: '...', gameId: '...' }
        fileToImport: null,
    };

    const loadState = () => {
        try {
            const savedDecks = localStorage.getItem(STORAGE_KEY);
            return savedDecks ? JSON.parse(savedDecks) : [];
        } catch (error) {
            console.error("Could not parse decks from localStorage", error);
            return [];
        }
    };

    const saveState = () => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state.decks));
        } catch (error) {
            console.error("Could not save decks to localStorage", error);
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
    const deckToDeleteNameEl = document.getElementById('deck-to-delete-name');
    
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
            button.textContent = cls;
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
        const deck = state.decks.find(d => d.id === deckId);
        if (!deck) return;

        state.deckToDeleteId = deckId;
        deckToDeleteNameEl.textContent = deck.name;
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
                saveState();
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
                    <h3 class="text-sm font-medium text-gray-900">No decks added yet</h3>
                    <p class="mt-1 text-sm text-gray-500">Get started by creating a new deck.</p>
                </div>
            `;
        } else {
            const deckCardsHTML = decks.map(deck => {
                const wins = deck.games.filter(g => g.result === 'Win').length;
                const losses = deck.games.filter(g => g.result === 'Loss').length;
                const style = classStyles[deck.class];
                return `
                    <div class="bg-white rounded-lg shadow-md border-l-4 ${style.border} p-4 flex flex-col justify-between transition-all hover:shadow-xl hover:-translate-y-px">
                        <div class="flex-grow">
                            <div class="flex justify-between items-center mb-1">
                                <h3 class="text-lg font-bold text-gray-800 truncate" title="${deck.name}">${deck.name}</h3>
                                <span class="flex-shrink-0 ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${style.bg} ${style.text}">${deck.class}</span>
                            </div>
                            <div class="mt-2 flex justify-between items-baseline text-base">
                                <p><span class="font-bold text-green-600">${wins}</span> <span class="text-sm text-gray-500">Wins</span></p>
                                <p><span class="font-bold text-red-600">${losses}</span> <span class="text-sm text-gray-500">Losses</span></p>
                            </div>
                        </div>
                        <div class="mt-4 border-t border-gray-200 pt-3 flex items-center justify-between">
                            <div class="flex gap-2">
                                <button data-action="add_game" data-deck-id="${deck.id}" class="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">Add Game</button>
                                <button data-action="stats" data-deck-id="${deck.id}" class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400">Stats</button>
                            </div>
                            <button data-action="delete" data-deck-id="${deck.id}" aria-label="Delete deck ${deck.name}" class="p-2 text-gray-400 rounded-full hover:bg-red-100 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
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
                    <header class="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                            <h1 class="text-3xl sm:text-4xl font-bold text-gray-800 tracking-tight">SVWB Win Tracker</h1>
                            <p class="mt-1 text-base text-gray-500">All data is saved in your browser.</p>
                        </div>
                        <div class="flex-shrink-0 flex items-center gap-2 flex-wrap justify-end">
                            <button id="import-btn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400">
                                Import
                            </button>
                            <button id="export-btn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50" ${decks.length === 0 ? 'disabled' : ''}>
                                Export
                            </button>
                            <button id="reset-all-btn" class="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50 disabled:cursor-not-allowed" ${decks.length === 0 ? 'disabled' : ''}>
                                Reset All
                            </button>
                            <button id="add-deck-btn" class="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-transform transform hover:scale-105">
                                Add New Deck
                            </button>
                        </div>
                    </header>
                    <div class="mt-10">${contentHTML}</div>
                </div>
            </main>
        `;
        
        document.getElementById('add-deck-btn').addEventListener('click', openAddDeckModal);
        document.getElementById('import-btn').addEventListener('click', handleImport);
        document.getElementById('export-btn').addEventListener('click', handleExport);
        if (decks.length > 0) {
            document.getElementById('reset-all-btn').addEventListener('click', openResetModal);
        }

        appContainer.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', (e) => {
                const { action, deckId } = e.currentTarget.dataset;
                if (action && deckId) {
                    if (action === 'delete') {
                        openDeleteDeckModal(deckId);
                    } else if (action === 'stats') {
                        state.view = { type: 'stats', deckId, filterClass: null, dateFilter: { start: null, end: null }, statsDeckSwitcherVisible: false, dateFilterVisible: false };
                        render();
                    } else {
                        state.view = { type: action, deckId };
                        render();
                    }
                }
            });
        });
    };

    const renderAddGameView = (deckId) => {
        const deck = state.decks.find(d => d.id === deckId);
        if (!deck) {
            state.view = { type: 'list' };
            render();
            return;
        }

        appContainer.innerHTML = `
             <main class="w-full max-w-6xl mx-auto">
                <div class="bg-white rounded-xl shadow-lg p-6 md:p-10">
                    <button id="back-to-decks" class="mb-6 inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold text-sm">
                        <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
                        Back to Decks
                    </button>
                    <h2 class="text-2xl font-bold text-gray-800">Add Game for <span class="${classStyles[deck.class].text}">${deck.name}</span></h2>
                    <form id="add-game-form" class="mt-6 space-y-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Opponent's Class</label>
                            <div id="game-class-selector-container"></div>
                        </div>
                        <div>
                            <span class="block text-sm font-medium text-gray-700">Turn</span>
                            <div id="turn-selector" class="mt-2 grid grid-cols-2 gap-4">
                                <button type="button" data-value="1st" class="w-full text-center px-4 py-3 font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 transform hover:-translate-y-px bg-gray-200 text-gray-700 hover:bg-gray-300 ring-blue-500">1st</button>
                                <button type="button" data-value="2nd" class="w-full text-center px-4 py-3 font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 transform hover:-translate-y-px bg-gray-200 text-gray-700 hover:bg-gray-300 ring-blue-500">2nd</button>
                            </div>
                        </div>
                        <div>
                            <span class="block text-sm font-medium text-gray-700">Result</span>
                            <div id="result-selector" class="mt-2 grid grid-cols-2 gap-4">
                                <button type="button" data-value="Win" class="w-full text-center px-4 py-3 font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 transform hover:-translate-y-px bg-green-100 text-green-800 hover:bg-green-200 ring-green-500">Win</button>
                                <button type="button" data-value="Loss" class="w-full text-center px-4 py-3 font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 transform hover:-translate-y-px bg-red-100 text-red-800 hover:bg-red-200 ring-red-500">Loss</button>
                            </div>
                        </div>
                        <div class="border-t border-gray-200 pt-5">
                             <button id="save-game-button" type="submit" disabled class="w-full px-4 py-3 font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 bg-gray-400 text-gray-100 cursor-not-allowed ring-gray-400">
                                Save Game
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
            state.view = { type: 'list' };
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
                saveState();
                
                saveButton.textContent = 'Game Saved!';
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
            displayDeck = { id: 'all', name: 'All Decks', class: 'All', games: allGames };
        } else {
            displayDeck = state.decks.find(d => d.id === deckId);
        }

        if (!displayDeck) {
            state.view = { type: 'list' };
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

            const formatRate = (wins, total) => total > 0 ? `${((wins / total) * 100).toFixed(1)}%` : 'N/A';

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
                acc[cls] = 'N/A';
                return acc;
            }
            const winsVsClass = gamesVsClass.filter(g => g.result === 'Win').length;
            acc[cls] = `${((winsVsClass / gamesVsClass.length) * 100).toFixed(1)}%`;
            return acc;
        }, {});
        
        const createDonutChart = () => {
            if (filteredDeckGames.length === 0) return `<div class="w-[240px] h-[240px] flex items-center justify-center text-gray-400">No Data</div>`;
            
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
                             <p class="text-sm text-gray-500">Games</p>
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
                        <span class="text-sm font-medium text-gray-700 truncate">${cls}</span>
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
            const date = new Date(game.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            
            const gameDeckInfo = isAllDecksView ? `
                <span class="flex-shrink-0 ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${classStyles[game.originalDeckClass].bg} ${classStyles[game.originalDeckClass].text}">${state.decks.find(d=>d.id === game.originalDeckId)?.name || 'Unknown'}</span>
            ` : '';

            return `
                 <li class="flex items-center justify-between p-3" data-game-id="${game.id}" data-deck-id="${game.originalDeckId || deckId}">
                    <div class="flex items-center gap-3">
                        <span class="px-2 py-1 text-xs font-semibold rounded-full ${opponentStyle.bg} ${opponentStyle.text}">${game.opponentClass}</span>
                        <div>
                            <p class="font-semibold ${resultStyle}">${game.result}</p>
                            <p class="text-xs text-gray-500">Went ${game.turn}</p>
                        </div>
                        ${gameDeckInfo}
                    </div>
                    <div class="flex items-center gap-2">
                        <p class="text-sm text-gray-400">${date}</p>
                        <button data-action="delete-match" aria-label="Delete match" class="p-1 text-gray-400 rounded-full hover:bg-red-100 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500">
                             <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </li>
            `;
        }).join('');


        appContainer.innerHTML = `
            <main class="w-full max-w-7xl mx-auto">
                 <div class="mb-6 relative">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-2">
                            <button id="back-to-decks" class="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold text-sm">
                                <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
                                Back
                            </button>
                             <div class="relative">
                                <button id="deck-switcher-btn" class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-200 transition-colors">
                                    <h2 class="text-2xl font-bold text-gray-800">Stats for <span class="${classStyles[displayDeck.class].text}">${displayDeck.name}</span></h2>
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 transition-transform ${statsDeckSwitcherVisible ? 'rotate-180' : ''}" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                                    </svg>
                                </button>
                                <!-- Deck Switcher Dropdown -->
                                <div id="deck-switcher-dropdown" class="${statsDeckSwitcherVisible ? '' : 'hidden'} absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-xl border z-20 overflow-hidden">
                                    <ul class="max-h-60 overflow-y-auto">
                                        <li>
                                            <button data-deck-id="all" class="w-full text-left px-4 py-3 text-sm font-semibold hover:bg-blue-50 transition-colors ${isAllDecksView ? 'text-blue-600' : 'text-gray-700'}">
                                                All Decks
                                            </button>
                                        </li>
                                        ${state.decks.map(d => `
                                            <li>
                                                <button data-deck-id="${d.id}" class="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 transition-colors ${d.id === deckId ? 'text-blue-600 font-semibold' : 'text-gray-700'}">
                                                    ${d.name} <span class="text-xs ${classStyles[d.class].text}">(${d.class})</span>
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
                                <p class="text-sm font-semibold text-gray-700 mb-3">Filter by Date</p>
                                <form id="date-filter-form" class="space-y-3">
                                    <div>
                                        <label for="start-date" class="block text-xs font-medium text-gray-600">From</label>
                                        <input type="date" id="start-date" name="start-date" value="${dateFilter.start || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white text-black">
                                    </div>
                                    <div>
                                        <label for="end-date" class="block text-xs font-medium text-gray-600">To</label>
                                        <input type="date" id="end-date" name="end-date" value="${dateFilter.end || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white text-black">
                                    </div>
                                    <div class="flex items-center justify-end gap-2 pt-2">
                                        <button type="button" id="clear-date-filter-btn" class="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400">Clear</button>
                                        <button type="submit" class="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">Apply</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-2 min-h-[1.25rem]">
                        ${filterClass || (dateFilter.start || dateFilter.end) ? `
                            <div class="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                                ${filterClass ? `<p>Opponent: <span class="font-semibold ${classStyles[filterClass].text}">${filterClass}</span></p>` : ''}
                                ${dateFilter.start || dateFilter.end ? `<p>Period: <span class="font-semibold text-gray-700">${dateFilter.start || '...'} to ${dateFilter.end || '...'}</span></p>` : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                ${displayDeck.games.length === 0 ? `
                    <div class="text-center bg-white rounded-lg shadow-md border-2 border-dashed border-gray-300 p-12 mt-6">
                        <h3 class="text-sm font-medium text-gray-900">No Games Played</h3>
                        <p class="mt-1 text-sm text-gray-500">Play some games to see your stats.</p>
                    </div>
                ` : `
                    <div class="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                        <!-- CARD 1: PERFORMANCE & OPPONENT OVERVIEW -->
                        <div class="bg-white rounded-lg shadow-md p-6">
                            <div class="flex flex-col md:flex-row items-center justify-around gap-6">
                                <div class="flex flex-row md:flex-col justify-around md:justify-start items-baseline gap-4 md:gap-6 w-full md:w-auto text-center flex-shrink-0">
                                    <div>
                                        <p class="text-sm text-gray-500">Win Rate</p>
                                        <p class="text-2xl md:text-3xl font-bold text-gray-800">${stats.winRate}</p>
                                        <p class="text-xs text-gray-400">${stats.wins}W / ${stats.losses}L</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-500">1st WR</p>
                                        <p class="text-xl md:text-2xl font-semibold text-gray-800">${stats.firstTurnWinRate}</p>
                                        <p class="text-xs text-gray-400">${stats.firstTurnTotal > 0 ? `${stats.firstTurnWins}W / ${stats.firstTurnTotal}G` : 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-500">2nd WR</p>
                                        <p class="text-xl md:text-2xl font-semibold text-gray-800">${stats.secondTurnWinRate}</p>
                                        <p class="text-xs text-gray-400">${stats.secondTurnTotal > 0 ? `${stats.secondTurnWins}W / ${stats.secondTurnTotal}G` : 'N/A'}</p>
                                    </div>
                                </div>
                                <div class="flex-grow flex justify-center">
                                    ${createDonutChart()}
                                </div>
                            </div>

                            <div class="mt-8 border-t border-gray-200 pt-6">
                                 <div class="flex justify-between items-center mb-4">
                                     <h3 class="text-base font-semibold text-gray-700">Opponent Breakdown</h3>
                                      ${filterClass ? `<button id="clear-class-filter-btn" class="text-xs text-blue-500 hover:underline">[Show All Classes]</button>` : ''}
                                </div>
                                <div class="grid grid-cols-3 text-xs text-gray-500 font-medium px-2 pb-1 border-b">
                                    <span class="col-span-1">Opponent Class</span>
                                    <span class="text-center col-span-1">Play Rate</span>
                                    <span class="text-right col-span-1">Win Rate</span>
                                </div>
                                <div class="space-y-1 mt-2">
                                    ${opponentBreakdownHTML}
                                </div>
                            </div>
                        </div>

                        <!-- CARD 2: RECENT MATCHES -->
                        <div class="bg-white rounded-lg shadow-md p-6">
                            <h3 class="text-lg font-semibold text-gray-700 mb-4">Match History ${filterClass ? `(vs ${filterClass})`: ''}</h3>
                            <div class="bg-white rounded-lg border border-gray-200">
                                <ul id="recent-matches-list" class="max-h-[36rem] overflow-y-auto divide-y divide-gray-100">
                                    ${recentMatchesHTML || `<li class="p-4 text-center text-gray-500">No matches found for this filter.</li>`}
                                </ul>
                            </div>
                        </div>
                    </div>
                `}
            </main>
        `;
        
        document.getElementById('back-to-decks').addEventListener('click', () => {
            state.view = { type: 'list' };
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
                state.view = { ...state.view, deckId: newDeckId, statsDeckSwitcherVisible: false };
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

    const render = () => {
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
        saveState();
        closeAddDeckModal();
        render();
    });
    
    deckNameInput.addEventListener('input', checkDeckFormValidity);
    cancelDeckButton.addEventListener('click', closeAddDeckModal);

    cancelDeleteDeckButton.addEventListener('click', closeDeleteDeckModal);

    confirmDeleteDeckButton.addEventListener('click', () => {
        if (state.deckToDeleteId) {
            state.decks = state.decks.filter(d => d.id !== state.deckToDeleteId);
            saveState();
            closeDeleteDeckModal();
            // If the deleted deck was the one being viewed in stats, go back to list
            if(state.view.type === 'stats' && state.view.deckId === state.deckToDeleteId) {
                state.view = { type: 'list' };
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
            saveState();
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
        saveState();
        closeResetModal();
        render();
    });
    
    // --- INITIALIZATION ---
    state.decks = loadState();
    render();
});
