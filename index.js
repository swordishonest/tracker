





import { state, saveDecks, saveSettings, loadDecks, loadSettings, setView, setEditingDeckId, setDeckNotesState, setNewDeckClass, setDeckToDeleteId, setMatchToDelete, setFileToImport, CLASSES } from './store.js';
import { render, openAddDeckModal, closeAddDeckModal, openDeleteDeckModal, closeDeleteDeckModal, openDeleteMatchModal, closeDeleteMatchModal, openNotesModal, closeNotesModal, openImportModal, closeImportModal, openResetModal, closeResetModal, checkDeckFormValidity, setTheme } from './view.js';

// --- DATA IMPORT/EXPORT ---
const handleExport = () => {
    if (state.decks.length === 0) {
        alert("There is no data to export.");
        return;
    }

    const turns = ['1st', '2nd'];
    const results = ['Win', 'Loss'];

    const exportedDecks = state.decks.map(deck => ({
        ...deck,
        games: deck.games.map(game => [
            game.id,
            game.timestamp,
            CLASSES.indexOf(game.opponentClass),
            turns.indexOf(game.turn),
            results.indexOf(game.result)
        ])
    }));

    const exportData = {
        version: "2.0",
        encoding: {
            classes: CLASSES,
            turns: turns,
            results: results,
            game_fields: ["id", "timestamp", "opponentClassIndex", "turnIndex", "resultIndex"]
        },
        decks: exportedDecks
    };

    const dataStr = JSON.stringify(exportData, null, 2);
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
    document.getElementById('import-file-input').click();
};

const processImportFile = (file, mode) => {
    if (!file || !mode) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const rawData = JSON.parse(e.target.result);
            
            if (mode === 'merge' && rawData.version !== '2.0') {
                alert("Merging is only supported for the V2 data format. Please use a V2 backup file or choose to overwrite.");
                return;
            }

            let importedDecks;

            // V2 format with encoded games
            if (rawData.version === "2.0" && rawData.encoding && Array.isArray(rawData.decks)) {
                const { classes, turns, results } = rawData.encoding;
                if (!classes || !turns || !results) {
                    throw new Error("Imported file has corrupt encoding data.");
                }

                importedDecks = rawData.decks.map(deck => ({
                    ...deck,
                    games: deck.games.map(gameArr => ({
                        id: gameArr[0],
                        timestamp: gameArr[1],
                        opponentClass: classes[gameArr[2]],
                        turn: turns[gameArr[3]],
                        result: results[gameArr[4]]
                    }))
                }));
            } else if (Array.isArray(rawData)) { // V1 legacy format
                 importedDecks = rawData.map(deck => ({ ...deck, notes: deck.notes || '' }));
            } else {
                 throw new Error("Unsupported or corrupt file format.");
            }
            
            // Extensive validation for the processed data
            const isValid = Array.isArray(importedDecks) && importedDecks.every(deck =>
                deck && typeof deck === 'object' &&
                'id' in deck && typeof deck.id === 'string' &&
                'name'in deck && typeof deck.name === 'string' &&
                'class' in deck && CLASSES.includes(deck.class) &&
                (!('notes' in deck) || typeof deck.notes === 'string') &&
                'games' in deck && Array.isArray(deck.games) &&
                deck.games.every(game =>
                    game && typeof game === 'object' &&
                    'id' in game && typeof game.id === 'string' &&
                    'timestamp' in game && typeof game.timestamp === 'number' &&
                    'opponentClass' in game && CLASSES.includes(game.opponentClass) &&
                    'turn' in game && ['1st', '2nd'].includes(game.turn) &&
                    'result' in game && ['Win', 'Loss'].includes(game.result)
                )
            );

            if (!isValid) {
                throw new Error("The imported file contains invalid or corrupt data.");
            }

            if (mode === 'overwrite') {
                state.decks = importedDecks;
                alert("Data imported and overwritten successfully!");
            } else if (mode === 'merge') {
                const importedDecksMap = new Map(importedDecks.map(d => [d.id, d]));

                const mergedDecks = state.decks.map(existingDeck => {
                    const importedDeckMatch = importedDecksMap.get(existingDeck.id);
                    if (importedDeckMatch) {
                        const existingGameIds = new Set(existingDeck.games.map(g => g.id));
                        const gamesToMerge = importedDeckMatch.games.filter(g => !existingGameIds.has(g.id));
                        importedDecksMap.delete(existingDeck.id);

                        // If the imported deck has a 'notes' field, it overwrites the existing one.
                        // Otherwise, the existing notes are preserved.
                        const newNotes = 'notes' in importedDeckMatch
                            ? importedDeckMatch.notes
                            : existingDeck.notes;
                        
                        return {
                            ...existingDeck,
                            games: [...existingDeck.games, ...gamesToMerge],
                            notes: newNotes || '' // Ensure notes is always a string.
                        };
                    }
                    return existingDeck;
                });

                const newDecks = Array.from(importedDecksMap.values());
                state.decks = [...mergedDecks, ...newDecks];
                alert("Data merged successfully!");
            }

            saveDecks();
            render();

        } catch (error) {
            console.error("Failed to import data:", error);
            alert(`Import failed: ${error.message}`);
        } finally {
            setFileToImport(null);
            document.getElementById('import-file-input').value = null;
        }
    };
    reader.onerror = () => {
        alert("Failed to read the file.");
        setFileToImport(null);
        document.getElementById('import-file-input').value = null;
    };

    reader.readAsText(file);
};

const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setFileToImport(file);

    if (state.decks.length > 0) {
        openImportModal();
    } else {
        processImportFile(file, 'overwrite');
    }
};


// --- EVENT HANDLERS ---
const handleAddDeckSubmit = (e) => {
    e.preventDefault();
    const deckNameInput = document.getElementById('deckName');
    const saveDeckButton = document.getElementById('save-deck-button');
    const deckName = deckNameInput.value.trim();
    if (saveDeckButton.disabled || !deckName || !state.newDeckClass) {
        return;
    }

    const newDeck = {
        id: crypto.randomUUID(),
        name: deckName,
        class: state.newDeckClass,
        games: [],
        notes: '',
    };

    state.decks = [newDeck, ...state.decks];
    saveDecks();
    closeAddDeckModal();
    render();
};

const handleAddGameSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const saveButton = form.querySelector('#save-game-button');
    if (saveButton.disabled) return;

    const deckId = state.view.deckId;
    const opponentClass = form.dataset.opponentClass;
    const turn = form.dataset.turn;
    const result = form.dataset.result;

    if (deckId && opponentClass && turn && result) {
        const newGame = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            opponentClass,
            turn,
            result
        };

        state.decks = state.decks.map(d =>
            d.id === deckId ? { ...d, games: [newGame, ...d.games] } : d
        );
        saveDecks();
        
        // Temporarily show success message before re-rendering
        saveButton.textContent = 'Game Saved!'; // This should be translated
        saveButton.className = 'w-full px-4 py-3 font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 bg-green-600 text-white ring-green-500';

        setTimeout(() => {
            render();
        }, 375);
    }
};

const handleGlobalClick = (e) => {
    const target = e.target;
    const actionTarget = target.closest('[data-action]');

    if (actionTarget) {
        const { action, deckId, class: filterClass } = actionTarget.dataset;

        switch (action) {
            case 'open-add-deck-modal': openAddDeckModal(); break;
            case 'close-add-deck-modal': closeAddDeckModal(); break;
            case 'open-delete-deck-modal': openDeleteDeckModal(deckId); break;
            case 'close-delete-deck-modal': closeDeleteDeckModal(); break;
            case 'close-delete-match-modal': closeDeleteMatchModal(); break;
            case 'open-notes-modal': openNotesModal(deckId); break;
            case 'close-notes-modal': closeNotesModal(); break;
            case 'close-import-modal': closeImportModal(); break;
            case 'close-reset-modal': closeResetModal(); break;
            case 'confirm-overwrite-import':
                if (state.fileToImport) processImportFile(state.fileToImport, 'overwrite');
                closeImportModal();
                break;
            case 'confirm-merge-import':
                if (state.fileToImport) processImportFile(state.fileToImport, 'merge');
                closeImportModal();
                break;
            case 'confirm-reset':
                state.decks = [];
                saveDecks();
                closeResetModal();
                render();
                break;
            case 'confirm-delete-deck':
                if (state.deckToDeleteId) {
                    state.decks = state.decks.filter(d => d.id !== state.deckToDeleteId);
                    saveDecks();
                    const deletedDeckId = state.deckToDeleteId;
                    closeDeleteDeckModal();
                    if (state.view.type === 'stats' && state.view.deckId === deletedDeckId) {
                        setView({ type: 'list', editingDeckId: null });
                    }
                    render();
                }
                break;
            case 'confirm-delete-match':
                if (state.matchToDelete) {
                    const { deckId: matchDeckId, gameId } = state.matchToDelete;
                    state.decks = state.decks.map(deck => {
                        if (deck.id === matchDeckId) {
                            return { ...deck, games: deck.games.filter(g => g.id !== gameId) };
                        }
                        return deck;
                    });
                    saveDecks();
                    closeDeleteMatchModal();
                    render();
                }
                break;
            case 'stats': 
                setView({ type: 'stats', deckId, filterClass: null, dateFilter: { start: null, end: null }, statsDeckSwitcherVisible: false, dateFilterVisible: false, chartType: state.chartType, currentPage: 1 }); 
                render(); 
                break;
            case 'add_game': setView({ type: 'add_game', deckId, addGameDeckSwitcherVisible: false }); render(); break;
            case 'edit-deck': setEditingDeckId(deckId); render(); break;
            case 'cancel-edit': setEditingDeckId(null); render(); break;
            case 'save-edit':
                const input = document.querySelector(`input[data-deck-id="${deckId}"]`);
                if (input) {
                    const newName = input.value.trim();
                    if (newName) {
                        state.decks = state.decks.map(d => d.id === deckId ? { ...d, name: newName } : d);
                        saveDecks();
                    }
                }
                setEditingDeckId(null);
                render();
                break;
            case 'edit-deck-notes':
                setDeckNotesState({ deckId: state.deckNotesState.deckId, isEditing: true });
                render();
                break;
            case 'cancel-deck-notes-edit':
                setDeckNotesState({ deckId: state.deckNotesState.deckId, isEditing: false });
                render();
                break;
            case 'save-deck-notes':
                const textarea = document.querySelector('#deck-notes-modal textarea');
                if (textarea) {
                    const deckIdToSave = state.deckNotesState.deckId;
                    state.decks = state.decks.map(d => d.id === deckIdToSave ? { ...d, notes: textarea.value.trim() } : d);
                    saveDecks();
                }
                closeNotesModal();
                render();
                break;
            case 'delete-match':
                const gameListItem = target.closest('li');
                if (gameListItem) {
                    const gameId = gameListItem.dataset.gameId;
                    const deckIdForMatch = gameListItem.dataset.deckId;
                    openDeleteMatchModal(deckIdForMatch, gameId);
                }
                break;
            case 'back-to-decks': setView({ type: 'list', editingDeckId: null }); render(); break;
            case 'toggle-lang':
                state.language = state.language === 'en' ? 'ja' : 'en';
                saveSettings();
                render();
                break;
            case 'toggle-theme':
                const newTheme = state.theme === 'light' ? 'dark' : 'light';
                setTheme(newTheme);
                saveSettings();
                break;
            case 'import-data': handleImport(); break;
            case 'export-data': handleExport(); break;
            case 'reset-all': if (state.decks.length > 0) openResetModal(); break;
            case 'filter-stats':
                const newFilter = state.view.filterClass === filterClass ? null : filterClass;
                setView({ ...state.view, filterClass: newFilter, currentPage: 1 });
                render();
                break;
             case 'clear-class-filter':
                 setView({ ...state.view, filterClass: null, currentPage: 1 });
                 render();
                break;
            case 'clear-date-filter':
                setView({ ...state.view, dateFilter: { start: null, end: null }, dateFilterVisible: false, currentPage: 1 });
                render();
                break;
            case 'toggle-deck-switcher':
                setView({ ...state.view, statsDeckSwitcherVisible: !state.view.statsDeckSwitcherVisible, dateFilterVisible: false });
                render();
                break;
            case 'toggle-date-filter':
                setView({ ...state.view, dateFilterVisible: !state.view.dateFilterVisible, statsDeckSwitcherVisible: false });
                render();
                break;
            case 'switch-stats-deck':
                setView({ ...state.view, deckId: deckId, filterClass: null, statsDeckSwitcherVisible: false, currentPage: 1 });
                render();
                break;
            case 'switch-add-game-deck':
                 if (state.view.type === 'add_game') {
                    setView({ ...state.view, deckId: deckId, addGameDeckSwitcherVisible: false });
                    render();
                }
                break;
            case 'toggle-add-game-deck-switcher':
                if (state.view.type === 'add_game') {
                    setView({ ...state.view, addGameDeckSwitcherVisible: !state.view.addGameDeckSwitcherVisible });
                    render();
                }
                break;
            case 'toggle-chart-type':
                if (state.view.type === 'stats') {
                    const newChartType = state.view.chartType === 'pie' ? 'bar' : 'pie';
                    state.chartType = newChartType;
                    saveSettings();
                    setView({ ...state.view, chartType: newChartType });
                    render();
                }
                break;
            case 'prev-page':
                 if (state.view.type === 'stats' && state.view.currentPage > 1) {
                    setView({ ...state.view, currentPage: state.view.currentPage - 1 });
                    render();
                 }
                break;
            case 'next-page':
                if (state.view.type === 'stats') {
                    // This check can be more sophisticated if totalPages is available here, but a simple increment is fine.
                    // The view will disable the button if it's the last page.
                    setView({ ...state.view, currentPage: state.view.currentPage + 1 });
                    render();
                }
                break;
        }
    } else {
        // Close dropdowns if clicking outside
        if (state.view.type === 'stats' && (state.view.statsDeckSwitcherVisible || state.view.dateFilterVisible)) {
            const deckSwitcher = document.getElementById('deck-switcher-dropdown');
            const dateFilter = document.getElementById('date-filter-card');
            const deckSwitcherBtn = document.getElementById('deck-switcher-btn');
            const dateFilterBtn = document.getElementById('toggle-date-filter-btn');

            if (!deckSwitcherBtn?.contains(target) && !dateFilterBtn?.contains(target) && !deckSwitcher?.contains(target) && !dateFilter?.contains(target)) {
                setView({ ...state.view, statsDeckSwitcherVisible: false, dateFilterVisible: false });
                render();
            }
        } else if (state.view.type === 'add_game' && state.view.addGameDeckSwitcherVisible) {
            const deckSwitcher = document.getElementById('add-game-deck-switcher-dropdown');
            const deckSwitcherBtn = document.getElementById('add-game-deck-switcher-btn');
            if (!deckSwitcherBtn?.contains(target) && !deckSwitcher?.contains(target)) {
                setView({ ...state.view, addGameDeckSwitcherVisible: false });
                render();
            }
        }
    }
};

const handleGlobalInput = (e) => {
    const target = e.target;
    if (target.id === 'deckName') {
        checkDeckFormValidity();
    }
}

const handleGlobalSubmit = (e) => {
    e.preventDefault();
    const target = e.target;
    if (target.id === 'add-deck-form') {
        handleAddDeckSubmit(e);
    } else if (target.id === 'add-game-form') {
        handleAddGameSubmit(e);
    } else if (target.id === 'date-filter-form') {
        const startDate = e.target.elements['start-date'].value;
        const endDate = e.target.elements['end-date'].value;
        setView({ ...state.view, dateFilter: { start: startDate || null, end: endDate || null }, dateFilterVisible: false, currentPage: 1 });
        render();
    }
}

const handleGlobalKeyDown = (e) => {
    // Handle Escape key to close modals or cancel edits
    if (e.key === 'Escape') {
        if (!document.getElementById('add-deck-modal').classList.contains('hidden')) closeAddDeckModal();
        else if (!document.getElementById('delete-deck-confirm-modal').classList.contains('hidden')) closeDeleteDeckModal();
        else if (!document.getElementById('delete-match-confirm-modal').classList.contains('hidden')) closeDeleteMatchModal();
        else if (!document.getElementById('deck-notes-modal').classList.contains('hidden')) closeNotesModal();
        else if (!document.getElementById('import-confirm-modal').classList.contains('hidden')) closeImportModal();
        else if (!document.getElementById('reset-confirm-modal').classList.contains('hidden')) closeResetModal();
        else if (state.view.type === 'add_game' || state.view.type === 'stats') setView({ type: 'list', editingDeckId: null }), render();
        else if (state.view.type === 'list' && state.view.editingDeckId) setEditingDeckId(null), render();
    }

    // Handle Enter key in deck name edit input
    if (e.key === 'Enter' && e.target.matches('input[data-deck-id]')) {
        const deckId = e.target.dataset.deckId;
        const newName = e.target.value.trim();
        if (newName) {
            state.decks = state.decks.map(d => d.id === deckId ? { ...d, name: newName } : d);
            saveDecks();
        }
        setEditingDeckId(null);
        render();
    }
};

const setupEventListeners = () => {
    document.body.addEventListener('click', handleGlobalClick);
    document.body.addEventListener('input', handleGlobalInput);
    document.body.addEventListener('submit', handleGlobalSubmit);
    document.addEventListener('keydown', handleGlobalKeyDown);

    // Specific listeners not covered by delegation
    document.getElementById('import-file-input').addEventListener('change', handleFileSelect);
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    state.decks = loadDecks();
    const settings = loadSettings();
    if (settings.language && (settings.language === 'en' || settings.language === 'ja')) {
        state.language = settings.language;
    }
    if (settings.chartType && ['pie', 'bar'].includes(settings.chartType)) {
        state.chartType = settings.chartType;
    }
    // Theme is set via inline script in HTML to prevent FOUC.
    // We just need to sync the state object.
    if (document.documentElement.classList.contains('dark')) {
        state.theme = 'dark';
    } else {
        state.theme = 'light';
    }
    if(settings.theme) {
        state.theme = settings.theme;
    }
    
    render();
    setupEventListeners();
});