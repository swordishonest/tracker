/**
 * @fileoverview This file acts as the controller in the MVC pattern.
 * It handles all user interactions, processes form submissions, and dispatches
 * actions that mutate the state and trigger re-renders. It sets up all global
 * event listeners for the application.
 */

import { state, saveDecks, saveSettings, setView, setEditingDeckId, setDeckNotesState, setNewDeckClass, setDeckToDeleteId, setMatchToDelete, setRunToDelete, setFileToImport, CLASSES, saveTags, saveTagUsage, addTag, updateTagUsage, setAddGameTagsExpanded, setMatchInfoToShow, setTagToDeleteId, setTagToMerge, saveTakeTwoDecks, initializeTakeTwoDecks, setMode, setNewTakeTwoResult } from './store.js';
import { render, openAddDeckModal, closeAddDeckModal, openDeleteDeckModal, closeDeleteDeckModal, openDeleteMatchModal, closeDeleteMatchModal, openDeleteResultModal, closeDeleteResultModal, openNotesModal, closeNotesModal, openImportModal, closeImportModal, openResetModal, closeResetModal, checkDeckFormValidity, setTheme, openTagFilterModal, closeTagFilterModal, openMatchInfoModal, closeMatchInfoModal, clearAddGameSelections, openDeleteTagModal, closeDeleteTagModal, openMergeTagModal, closeMergeTagModal, resetAddGameState, resetEditGameState, openAddResultModal, closeAddResultModal } from './view.js';
import { exportData, importData } from './services/data-manager.js';

/**
 * Gets the correct deck list (Normal or Take Two) based on the current mode.
 * @returns {Array<object>} The current list of decks.
 */
const getCurrentDecks = () => state.mode === 'takeTwo' ? state.takeTwoDecks : state.decks;
/** Saves the correct deck list (Normal or Take Two) based on the current mode. */
const saveCurrentDecks = () => state.mode === 'takeTwo' ? saveTakeTwoDecks() : saveDecks();

// --- FORM SUBMISSION HANDLERS ---

/**
 * Handles the submission of the "Add Deck" form.
 * Creates a new deck object and adds it to the state.
 * @param {Event} e The form submission event.
 */
const handleAddDeckSubmit = (e) => {
    e.preventDefault();
    if (state.mode === 'takeTwo') return;
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

/**
 * Handles the submission of the "Add Result" form for Take Two mode.
 * Creates a new run object and adds it to the appropriate class deck.
 * @param {Event} e The form submission event.
 */
const handleAddResultSubmit = (e) => {
    e.preventDefault();
    if (state.mode !== 'takeTwo') return;

    const { class: selectedClass, wins, losses } = state.newTakeTwoResult;
    const saveButton = document.getElementById('save-result-button');
    if (saveButton.disabled || !selectedClass || wins === null || losses === null) {
        return;
    }

    const newRun = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        wins,
        losses,
    };
    
    state.takeTwoDecks = state.takeTwoDecks.map(d =>
        d.id === selectedClass ? { ...d, runs: [newRun, ...(d.runs || [])] } : d
    );

    saveTakeTwoDecks();
    closeAddResultModal();
    render();
};

/**
 * Handles the submission of the "Add Game" form.
 * Creates a new game object and adds it to the corresponding deck.
 * @param {Event} e The form submission event, where the form is the target.
 */
const handleAddGameSubmit = (e) => {
    const form = e.target;
    const saveButton = document.getElementById('save-game-button');
    if (!form || saveButton.disabled) return;

    const deckId = state.view.deckId;
    const opponentClass = form.dataset.opponentClass;
    const turn = form.dataset.turn;
    const result = form.dataset.result;

    if (deckId && opponentClass && turn && result) {
        const myTagIds = form.dataset.myTagIds ? JSON.parse(form.dataset.myTagIds) : [];
        const opponentTagIds = form.dataset.opponentTagIds ? JSON.parse(form.dataset.opponentTagIds) : [];

        updateTagUsage([...myTagIds, ...opponentTagIds]);

        const newGame = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            opponentClass,
            turn,
            result,
            myTagIds,
            opponentTagIds,
        };
        
        const currentDeckListKey = state.mode === 'takeTwo' ? 'takeTwoDecks' : 'decks';
        state[currentDeckListKey] = state[currentDeckListKey].map(d =>
            d.id === deckId ? { ...d, games: [newGame, ...d.games] } : d
        );

        saveCurrentDecks();
        
        // Provide visual feedback to the user.
        saveButton.textContent = 'Game Saved!';
        saveButton.className = 'w-full px-4 py-3 font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 bg-green-600 text-white ring-green-500';

        // Reset the form after a short delay to allow the user to see the confirmation.
        setTimeout(() => {
            clearAddGameSelections();
            render();
        }, 375);
    }
};

/**
 * Handles the file selection for data import.
 * @param {Event} event The change event from the file input.
 */
const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setFileToImport(file);
    const hasData = state.decks.length > 0 || state.takeTwoDecks.some(d => d.games.length > 0);

    // If there's existing data, prompt the user to merge or overwrite.
    // Otherwise, just overwrite.
    if (hasData) {
        openImportModal();
    } else {
        importData(file, 'overwrite');
    }
};

/**
 * A map of action names (from `data-action` attributes) to their handler functions.
 * This is the core of the event delegation system, allowing for a single click
 * listener on the document body.
 */
const actionHandlers = {
    // Modal Open/Close Actions
    'open-add-deck-modal': () => openAddDeckModal(),
    'close-add-deck-modal': () => closeAddDeckModal(),
    'open-add-result-modal': () => openAddResultModal(),
    'close-add-result-modal': () => closeAddResultModal(),
    'open-delete-deck-modal': ({ deckId }) => openDeleteDeckModal(deckId),
    'close-delete-deck-modal': () => closeDeleteDeckModal(),
    'open-delete-tag-modal': ({ tagId }) => openDeleteTagModal(tagId),
    'close-delete-tag-modal': () => closeDeleteTagModal(),
    'close-merge-tag-modal': () => closeMergeTagModal(),
    'open-delete-match-modal': (_, e) => {
        const matchListItem = e.target.closest('li[data-game-id]');
        if (matchListItem) {
            openDeleteMatchModal(matchListItem.dataset.deckId, matchListItem.dataset.gameId);
        }
    },
    'close-delete-match-modal': () => closeDeleteMatchModal(),
    'open-delete-result-modal': (_, e) => {
        const runListItem = e.target.closest('li[data-run-id]');
        if (runListItem) {
            openDeleteResultModal(runListItem.dataset.deckId, runListItem.dataset.runId);
        }
    },
    'close-delete-result-modal': () => closeDeleteResultModal(),
    'open-match-info-modal': (_, e) => {
        const infoMatchListItem = e.target.closest('li[data-game-id]');
        if (infoMatchListItem) {
            openMatchInfoModal(infoMatchListItem.dataset.deckId, infoMatchListItem.dataset.gameId);
        }
    },
    'close-match-info-modal': () => closeMatchInfoModal(),
    'open-notes-modal': ({ deckId }) => openNotesModal(deckId),
    'close-notes-modal': () => closeNotesModal(),
    'open-tag-filter-modal': () => openTagFilterModal(),
    'close-tag-filter-modal': () => closeTagFilterModal(),
    'close-import-modal': () => closeImportModal(),
    'close-reset-modal': () => closeResetModal(),

    // Confirmation Actions
    'confirm-overwrite-import': () => {
        if (state.fileToImport) importData(state.fileToImport, 'overwrite');
        closeImportModal();
    },
    'confirm-merge-import': () => {
        if (state.fileToImport) importData(state.fileToImport, 'merge');
        closeImportModal();
    },
    'confirm-reset': () => {
        state.decks = [];
        state.takeTwoDecks = [];
        state.tags = [];
        state.tagUsage = {};
        state.globalDateFilter = { start: null, end: null };
        state.globalTagFilter = { my: { include: [], exclude: [] }, opp: { include: [], exclude: [] } };
        if (state.view.type === 'stats') {
            setView({ ...state.view, dateFilter: state.globalDateFilter, tagFilter: state.globalTagFilter });
        }
        saveDecks();
        saveTakeTwoDecks();
        saveTags();
        saveTagUsage();
        saveSettings();
        initializeTakeTwoDecks();
        closeResetModal();
        render();
    },
    'confirm-delete-deck': () => {
        if (state.deckToDeleteId) {
            if (state.mode === 'takeTwo') {
                state.takeTwoDecks = state.takeTwoDecks.map(d =>
                    d.id === state.deckToDeleteId ? { ...d, games: [], runs: [] } : d
                );
                saveTakeTwoDecks();
            } else {
                state.decks = state.decks.filter(d => d.id !== state.deckToDeleteId);
                saveDecks();
            }

            const deletedDeckId = state.deckToDeleteId;
            closeDeleteDeckModal();
            if (state.view.type === 'stats' && state.view.deckId === deletedDeckId) {
                setView({ type: 'list', editingDeckId: null });
            }
            render();
        }
    },
    'confirm-delete-match': () => {
        if (state.matchToDelete) {
            const { deckId, gameId } = state.matchToDelete;
            const deckListKey = state.mode === 'takeTwo' ? 'takeTwoDecks' : 'decks';
            state[deckListKey] = state[deckListKey].map(deck =>
                deck.id === deckId ? { ...deck, games: deck.games.filter(g => g.id !== gameId) } : deck
            );
            saveCurrentDecks();
            closeDeleteMatchModal();
            render();
        }
    },
    'confirm-delete-result': () => {
        if (state.runToDelete) {
            const { deckId, runId } = state.runToDelete;
            state.takeTwoDecks = state.takeTwoDecks.map(deck =>
                deck.id === deckId ? { ...deck, runs: (deck.runs || []).filter(r => r.id !== runId) } : deck
            );
            saveTakeTwoDecks();
            closeDeleteResultModal();
            render();
        }
    },
    'confirm-delete-tag': () => {
        const tagIdToDelete = state.tagToDeleteId;
        if (tagIdToDelete) {
            // Remove tag from all games
            [...state.decks, ...state.takeTwoDecks].forEach(deck => {
                deck.games.forEach(game => {
                    if (game.myTagIds) game.myTagIds = game.myTagIds.filter(id => id !== tagIdToDelete);
                    if (game.opponentTagIds) game.opponentTagIds = game.opponentTagIds.filter(id => id !== tagIdToDelete);
                });
            });

            // Remove tag from active filters
            const cleanFilterArray = arr => arr ? arr.filter(id => id !== tagIdToDelete) : [];
            const cleanTagFilter = filter => {
                if (!filter) return;
                filter.my.include = cleanFilterArray(filter.my.include);
                filter.my.exclude = cleanFilterArray(filter.my.exclude);
                filter.opp.include = cleanFilterArray(filter.opp.include);
                filter.opp.exclude = cleanFilterArray(filter.opp.exclude);
            };
            
            cleanTagFilter(state.globalTagFilter);
            if (state.view.type === 'stats' && state.view.tagFilter) cleanTagFilter(state.view.tagFilter);

            // Remove tag from global lists
            state.tags = state.tags.filter(t => t.id !== tagIdToDelete);
            delete state.tagUsage[tagIdToDelete];

            saveDecks();
            saveTakeTwoDecks();
            saveTags();
            saveTagUsage();
            saveSettings();
            closeDeleteTagModal();
            render();
        }
    },
    'confirm-merge-tag': () => {
        const { sourceTag, targetTag } = state.tagToMerge || {};
        if (!sourceTag || !targetTag) return;
    
        const sourceTagId = sourceTag.id;
        const targetTagId = targetTag.id;
        // Replace all instances of the source tag ID with the target tag ID in games
        [...state.decks, ...state.takeTwoDecks].forEach(deck => {
            deck.games.forEach(game => {
                const mergeIds = idArray => {
                    if (!idArray || !idArray.includes(sourceTagId)) return idArray;
                    const idSet = new Set(idArray);
                    idSet.delete(sourceTagId);
                    idSet.add(targetTagId);
                    return Array.from(idSet);
                };
                if (game.myTagIds) game.myTagIds = mergeIds(game.myTagIds);
                if (game.opponentTagIds) game.opponentTagIds = mergeIds(game.opponentTagIds);
            });
        });
    
        // Merge usage timestamps, keeping the most recent one
        const sourceTimestamp = state.tagUsage[sourceTagId];
        const targetTimestamp = state.tagUsage[targetTagId];
        if (sourceTimestamp && (!targetTimestamp || sourceTimestamp > targetTimestamp)) {
            state.tagUsage[targetTagId] = sourceTimestamp;
        }
        delete state.tagUsage[sourceTagId];
    
        // Delete the source tag
        state.tags = state.tags.filter(t => t.id !== sourceTagId);
        
        // Update any active filters to use the new tag ID
        const mergeIdsInFilterArray = idArray => {
            if (!idArray || !idArray.includes(sourceTagId)) return idArray;
            const idSet = new Set(idArray);
            idSet.delete(sourceTagId);
            idSet.add(targetTagId);
            return Array.from(idSet);
        };
        const mergeTagFilter = filter => {
            if (!filter) return;
            filter.my.include = mergeIdsInFilterArray(filter.my.include);
            filter.my.exclude = mergeIdsInFilterArray(filter.my.exclude);
            filter.opp.include = mergeIdsInFilterArray(filter.opp.include);
            filter.opp.exclude = mergeIdsInFilterArray(filter.opp.exclude);
        };
    
        mergeTagFilter(state.globalTagFilter);
        if (state.view.type === 'stats' && state.view.tagFilter) mergeTagFilter(state.view.tagFilter);
    
        saveDecks();
        saveTakeTwoDecks();
        saveTags();
        saveTagUsage();
        saveSettings();
    
        closeMergeTagModal();
        setView({ ...state.view, editingTagId: null });
        render();
    },

    // View Navigation and UI State
    'stats': ({ deckId }) => {
        setView({
            type: 'stats',
            deckId,
            filterClass: null,
            dateFilter: state.globalDateFilter,
            tagFilter: state.globalTagFilter,
            statsDeckSwitcherVisible: false,
            dateFilterVisible: false,
            chartType: state.chartType,
            matchHistoryCurrentPage: 1,
            resultHistoryCurrentPage: 1,
        });
        render();
    },
    'add_game': ({ deckId }) => {
        setView({ type: 'add_game', deckId, addGameDeckSwitcherVisible: false });
        render();
    },
    'save-game': (_, e) => {
        const form = document.getElementById('add-game-form');
        if (form && !e.target.disabled) {
            handleAddGameSubmit({ target: form });
        }
    },
    'edit-deck': ({ deckId }) => {
        setEditingDeckId(deckId);
        render();
    },
    'cancel-edit': () => {
        setEditingDeckId(null);
        render();
    },
    'save-edit': ({ deckId }) => {
        if (state.mode === 'takeTwo') return;
        const input = document.querySelector(`input[data-deck-id="${deckId}"]`);
        if (input) {
            const newName = input.value.trim();
            if (newName) {
                state.decks = state.decks.map(d => (d.id === deckId ? { ...d, name: newName } : d));
                saveDecks();
            }
        }
        setEditingDeckId(null);
        render();
    },
    'edit-deck-notes': () => {
        setDeckNotesState({ deckId: state.deckNotesState.deckId, isEditing: true });
        render();
    },
    'cancel-deck-notes-edit': () => {
        setDeckNotesState({ deckId: state.deckNotesState.deckId, isEditing: false });
        render();
    },
    'save-deck-notes': () => {
        const textarea = document.querySelector('#deck-notes-modal textarea');
        if (textarea) {
            const deckIdToSave = state.deckNotesState.deckId;
            const deckListKey = state.mode === 'takeTwo' ? 'takeTwoDecks' : 'decks';
            state[deckListKey] = state[deckListKey].map(d => (d.id === deckIdToSave ? { ...d, notes: textarea.value.trim() } : d));
            saveCurrentDecks();
        }
        closeNotesModal();
        render();
    },
    'back-to-decks': () => {
        resetAddGameState();
        setView({ type: 'list', editingDeckId: null });
        render();
    },
    'toggle-mode': () => {
        setMode(state.mode === 'normal' ? 'takeTwo' : 'normal');
        resetAddGameState();
        setView({ type: 'list', editingDeckId: null });
        render();
    },
    'toggle-lang': () => {
        state.language = state.language === 'en' ? 'ja' : 'en';
        saveSettings();
        initializeTakeTwoDecks();
        render();
    },
    'toggle-theme': () => {
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        saveSettings();
    },
    'import-data': () => document.getElementById('import-file-input').click(),
    'export-data': () => exportData(),
    'reset-all': () => {
        const hasAnyData = state.decks.length > 0 || state.takeTwoDecks.some(d => d.games.length > 0 || (d.runs && d.runs.length > 0)) || state.tags.length > 0;
        if (hasAnyData) openResetModal();
    },

    // Stats View Actions
    'filter-stats': ({ class: filterClass }) => {
        const newFilter = state.view.filterClass === filterClass ? null : filterClass;
        setView({ ...state.view, filterClass: newFilter, matchHistoryCurrentPage: 1, resultHistoryCurrentPage: 1 });
        render();
    },
    'clear-class-filter': () => {
        setView({ ...state.view, filterClass: null, matchHistoryCurrentPage: 1, resultHistoryCurrentPage: 1 });
        render();
    },
    'clear-date-filter': () => {
        const newDateFilter = { start: null, end: null };
        setView({ ...state.view, dateFilter: newDateFilter, dateFilterVisible: false, matchHistoryCurrentPage: 1, resultHistoryCurrentPage: 1 });
        state.globalDateFilter = newDateFilter;
        saveSettings();
        render();
    },
    'toggle-deck-switcher': () => {
        setView({ ...state.view, statsDeckSwitcherVisible: !state.view.statsDeckSwitcherVisible, dateFilterVisible: false });
        render();
    },
    'toggle-date-filter': () => {
        setView({ ...state.view, dateFilterVisible: !state.view.dateFilterVisible, statsDeckSwitcherVisible: false });
        render();
    },
    'switch-stats-deck': ({ deckId }) => {
        setView({
            ...state.view,
            deckId,
            filterClass: null,
            statsDeckSwitcherVisible: false,
            matchHistoryCurrentPage: 1,
            resultHistoryCurrentPage: 1,
        });
        render();
    },
    'switch-add-game-deck': ({ deckId }) => {
        if (state.view.type === 'add_game') {
            resetAddGameState();
            setView({ ...state.view, deckId, addGameDeckSwitcherVisible: false });
            render();
        }
    },
    'toggle-add-game-deck-switcher': () => {
        if (state.view.type === 'add_game') {
            setView({ ...state.view, addGameDeckSwitcherVisible: !state.view.addGameDeckSwitcherVisible });
            render();
        }
    },
    'toggle-add-game-tags': () => {
        if (state.view.type === 'add_game' || state.view.type === 'edit_game') {
            setAddGameTagsExpanded(!state.addGameTagsExpanded);
            render();
        }
    },
    'toggle-chart-type': () => {
        if (state.view.type === 'stats') {
            const chartTypes = ['pie', 'bar', 'histogram'];
            const currentChartType = state.view.chartType || 'pie';
            const availableTypes = state.mode === 'takeTwo' ? chartTypes : ['pie', 'bar'];
            const currentIndex = availableTypes.indexOf(currentChartType);
            const nextIndex = (currentIndex + 1) % availableTypes.length;
            const newChartType = availableTypes[nextIndex];
            state.chartType = newChartType;
            saveSettings();
            setView({ ...state.view, chartType: newChartType });
            render();
        }
    },
    'prev-match-page': () => {
        if (state.view.type === 'stats' && state.view.matchHistoryCurrentPage > 1) {
            setView({ ...state.view, matchHistoryCurrentPage: state.view.matchHistoryCurrentPage - 1 });
            render();
        }
    },
    'next-match-page': () => {
        if (state.view.type === 'stats') {
            setView({ ...state.view, matchHistoryCurrentPage: (state.view.matchHistoryCurrentPage || 1) + 1 });
            render();
        }
    },
    'prev-result-page': () => {
        if (state.view.type === 'stats' && state.view.resultHistoryCurrentPage > 1) {
            setView({ ...state.view, resultHistoryCurrentPage: state.view.resultHistoryCurrentPage - 1 });
            render();
        }
    },
    'next-result-page': () => {
        if (state.view.type === 'stats') {
            setView({ ...state.view, resultHistoryCurrentPage: (state.view.resultHistoryCurrentPage || 1) + 1 });
            render();
        }
    },

    // Tag Management Actions
    'manage-tags': () => {
        setView({ ...state.view, type: 'manage_tags', editingTagId: null, tagSearchQuery: '' });
        closeTagFilterModal();
        render();
    },
    'back-to-stats': () => {
        setView({ ...state.view, type: 'stats', editingTagId: null, tagSearchQuery: null });
        render();
    },
    'edit-tag': ({ tagId }) => {
        if (state.view.type === 'manage_tags') {
            setView({ ...state.view, editingTagId: tagId });
            render();
        }
    },
    'cancel-edit-tag': () => {
        if (state.view.type === 'manage_tags') {
            setView({ ...state.view, editingTagId: null });
            render();
        }
    },

    // Match Edit Actions
    'edit-match': ({ deckId, gameId }) => {
        closeMatchInfoModal();
        const fromStatsView = JSON.parse(JSON.stringify(state.view));
        setView({
            type: 'edit_game',
            deckId,
            gameId,
            fromStatsView,
        });
        render();
    },
    'cancel-edit-game': () => {
        const { fromStatsView } = state.view;
        resetEditGameState();
        setView(fromStatsView);
        render();
    },
    'save-edited-game': () => {
        const form = document.getElementById('edit-game-form');
        if (!form) return;
        const { deckId, gameId, fromStatsView } = state.view;

        const opponentClass = form.dataset.opponentClass;
        const turn = form.dataset.turn;
        const result = form.dataset.result;
        const myTagIds = JSON.parse(form.dataset.myTagIds || '[]');
        const opponentTagIds = JSON.parse(form.dataset.opponentTagIds || '[]');

        const deckListKey = state.mode === 'takeTwo' ? 'takeTwoDecks' : 'decks';
        state[deckListKey] = state[deckListKey].map(deck => {
            if (deck.id === deckId) {
                const newGames = deck.games.map(game => {
                    if (game.id === gameId) {
                        return { ...game, opponentClass, turn, result, myTagIds, opponentTagIds };
                    }
                    return game;
                });
                return { ...deck, games: newGames };
            }
            return deck;
        });

        saveCurrentDecks();
        updateTagUsage([...myTagIds, ...opponentTagIds]);
        
        resetEditGameState();
        setView(fromStatsView);
        render();
    }
};

/**
 * Handles all click events on the body, delegating to a handler in `actionHandlers`
 * if the clicked element (or an ancestor) has a `data-action` attribute.
 * Also handles closing dropdowns when clicking outside of them.
 * @param {Event} e The click event.
 */
const handleGlobalClick = (e) => {
    const target = e.target;
    const actionTarget = target.closest('[data-action]');
    
    if (actionTarget) {
        const { action, ...dataset } = actionTarget.dataset;
        if (actionHandlers[action]) {
            actionHandlers[action](dataset, e);
        }
    } else {
        // Close dropdowns if clicking outside
        if (state.view.type === 'stats' && (state.view.statsDeckSwitcherVisible || state.view.dateFilterVisible)) {
            const deckSwitcher = document.getElementById('deck-switcher-dropdown');
            const dateFilter = document.getElementById('date-filter-card');
            const deckSwitcherBtn = document.getElementById('deck-switcher-btn');
            const dateFilterBtn = document.getElementById('toggle-date-filter-btn');
            const dateFilterText = document.getElementById('stats-date-filter-text');

            if (!deckSwitcherBtn?.contains(target) && !deckSwitcher?.contains(target) &&
                !dateFilterBtn?.contains(target) && !dateFilter?.contains(target) && !dateFilterText?.contains(target)) {
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

/**
 * Handles live input events for specific fields, like validating the add-deck form
 * or filtering the tags list.
 * @param {Event} e The input event.
 */
const handleGlobalInput = (e) => {
    const target = e.target;
    if (target.id === 'deckName') {
        checkDeckFormValidity();
    } else if (target.id === 'new-tag-name' && state.view.type === 'manage_tags') {
        setView({ ...state.view, tagSearchQuery: target.value });
        render();
    }
};

/**
 * Handles all form submissions, delegating to the appropriate handler based on the form's ID or data attributes.
 * @param {Event} e The submit event.
 */
const handleGlobalSubmit = (e) => {
    e.preventDefault();
    const form = e.target;

    if (form.id === 'add-deck-form') {
        handleAddDeckSubmit(e);
    } else if (form.id === 'add-result-form') {
        handleAddResultSubmit(e);
    } else if (form.id === 'add-game-form') {
        // Safety net to prevent form submission from mobile keyboards. The action is handled by the button click.
    } else if (form.dataset.action === 'save-tag') {
        if (state.view.type === 'manage_tags') {
            const newName = form.querySelector('input[name="tag-name"]').value.trim();
            const tagIdToEdit = form.dataset.tagId;
    
            if (!newName || !tagIdToEdit) return;
    
            // Check if the new name already exists for another tag.
            const existingTag = state.tags.find(t =>
                t.id !== tagIdToEdit &&
                t.name.toLowerCase() === newName.toLowerCase()
            );
            
            const sourceTag = state.tags.find(t => t.id === tagIdToEdit);
            if (!sourceTag) return;
    
            if (existingTag) {
                // If it exists, prompt the user to merge the tags.
                setTagToMerge({ sourceTag: sourceTag, targetTag: existingTag });
                openMergeTagModal();
            } else {
                // Otherwise, just save the new name.
                state.tags = state.tags.map(t => (t.id === tagIdToEdit ? { ...t, name: newName } : t));
                saveTags();
                setView({ ...state.view, editingTagId: null });
                render();
            }
        }
    } else if (form.id === 'date-filter-form') {
        const startDate = form.elements['start-date'].value;
        const endDate = form.elements['end-date'].value;
        const newDateFilter = { start: startDate || null, end: endDate || null };
        const newView = { ...state.view, dateFilter: newDateFilter, dateFilterVisible: false, matchHistoryCurrentPage: 1, resultHistoryCurrentPage: 1 };
        setView(newView);
        state.globalDateFilter = newDateFilter;
        saveSettings();
        render();
    } else if (form.id === 'tag-filter-form') {
        const myInclude = JSON.parse(form.dataset.myInclude || '[]');
        const myExclude = JSON.parse(form.dataset.myExclude || '[]');
        const oppInclude = JSON.parse(form.dataset.oppInclude || '[]');
        const oppExclude = JSON.parse(form.dataset.oppExclude || '[]');
        const newTagFilter = { my: { include: myInclude, exclude: myExclude }, opp: { include: oppInclude, exclude: oppExclude }};
        const newView = { ...state.view, tagFilter: newTagFilter, matchHistoryCurrentPage: 1, resultHistoryCurrentPage: 1 };
        setView(newView);
        state.globalTagFilter = newTagFilter;
        saveSettings();
        closeTagFilterModal();
        render();
    } else if (form.id === 'add-tag-form') {
        if (state.view.type === 'manage_tags') {
            const tagNameInput = form.elements['new-tag-name'];
            const tagName = tagNameInput.value.trim();

            if (tagName) {
                const isDuplicate = state.tags.some(t => t.name.toLowerCase() === tagName.toLowerCase());
                if (isDuplicate) {
                    alert(`A tag named "${tagName}" already exists.`);
                    return;
                }
                
                addTag({ id: crypto.randomUUID(), name: tagName });
                tagNameInput.value = '';
                setView({ ...state.view, tagSearchQuery: '' });
                render();
            }
        }
    }
};

/**
 * Handles global keydown events, primarily for 'Escape' key functionality
 * to close modals or navigate back.
 * @param {Event} e The keydown event.
 */
const handleGlobalKeyDown = (e) => {
    if (e.key === 'Escape') {
        // Close modals in a cascading order.
        if (!document.getElementById('add-deck-modal').classList.contains('hidden')) closeAddDeckModal();
        else if (!document.getElementById('add-result-modal').classList.contains('hidden')) closeAddResultModal();
        else if (!document.getElementById('delete-deck-confirm-modal').classList.contains('hidden')) closeDeleteDeckModal();
        else if (!document.getElementById('delete-match-confirm-modal').classList.contains('hidden')) closeDeleteMatchModal();
        else if (!document.getElementById('delete-result-confirm-modal').classList.contains('hidden')) closeDeleteResultModal();
        else if (!document.getElementById('delete-tag-confirm-modal').classList.contains('hidden')) closeDeleteTagModal();
        else if (!document.getElementById('merge-tag-confirm-modal').classList.contains('hidden')) closeMergeTagModal();
        else if (!document.getElementById('deck-notes-modal').classList.contains('hidden')) closeNotesModal();
        else if (!document.getElementById('match-info-modal').classList.contains('hidden')) closeMatchInfoModal();
        else if (!document.getElementById('tag-filter-modal').classList.contains('hidden')) closeTagFilterModal();
        else if (!document.getElementById('import-confirm-modal').classList.contains('hidden')) closeImportModal();
        else if (!document.getElementById('reset-confirm-modal').classList.contains('hidden')) closeResetModal();
        // Navigate back from sub-views.
        else if (state.view.type === 'add_game' || state.view.type === 'stats' || state.view.type === 'manage_tags') {
            if (state.view.type === 'add_game') {
                resetAddGameState();
            }
            if (state.view.type === 'edit_game') {
                resetEditGameState();
            }
            setView({ type: 'list', editingDeckId: null });
            render();
        } 
        // Cancel editing a deck name.
        else if (state.view.type === 'list' && state.view.editingDeckId) {
            setEditingDeckId(null);
            render();
        }
    }

    // Handle 'Enter' key to save deck name edits.
    if (e.key === 'Enter' && e.target.matches('input[data-deck-id]')) {
        if (state.mode === 'takeTwo') return;
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

/** Sets up all the global event listeners for the application. */
export const setupEventListeners = () => {
    document.body.addEventListener('click', handleGlobalClick);
    document.body.addEventListener('input', handleGlobalInput);
    document.body.addEventListener('submit', handleGlobalSubmit);
    document.addEventListener('keydown', handleGlobalKeyDown);
    document.getElementById('import-file-input').addEventListener('change', handleFileSelect);
};