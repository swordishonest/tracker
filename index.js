import { state, saveDecks, saveSettings, loadDecks, loadSettings, setView, setEditingDeckId, setDeckNotesState, setNewDeckClass, setDeckToDeleteId, setMatchToDelete, setFileToImport, CLASSES, loadTags, loadTagUsage, saveTags, saveTagUsage, addTag, updateTagUsage, setAddGameTagsExpanded, setMatchInfoToShow, setTagToDeleteId, setTagToMerge, loadTakeTwoDecks, saveTakeTwoDecks, initializeTakeTwoDecks, setMode } from './store.js';
import { render, openAddDeckModal, closeAddDeckModal, openDeleteDeckModal, closeDeleteDeckModal, openDeleteMatchModal, closeDeleteMatchModal, openNotesModal, closeNotesModal, openImportModal, closeImportModal, openResetModal, closeResetModal, checkDeckFormValidity, setTheme, openTagFilterModal, closeTagFilterModal, openMatchInfoModal, closeMatchInfoModal, clearAddGameSelections, openDeleteTagModal, closeDeleteTagModal, openMergeTagModal, closeMergeTagModal, resetAddGameState } from './view.js';

const getCurrentDecks = () => state.mode === 'takeTwo' ? state.takeTwoDecks : state.decks;
const saveCurrentDecks = () => state.mode === 'takeTwo' ? saveTakeTwoDecks() : saveDecks();

// --- DATA IMPORT/EXPORT ---
const handleExport = () => {
    const hasNormalData = state.decks.length > 0;
    const hasTakeTwoData = state.takeTwoDecks.some(d => d.games.length > 0);
    const hasTagData = state.tags.length > 0;

    if (!hasNormalData && !hasTakeTwoData && !hasTagData) {
        alert("There is no data to export.");
        return;
    }

    const turns = ['1st', '2nd'];
    const results = ['Win', 'Loss'];

    const tagIdList = state.tags.map(t => t.id);
    const tagIdToIndexMap = new Map(tagIdList.map((id, index) => [id, index]));

    const encodeDeckArray = (deckArray) => deckArray.map(deck => ({
        ...deck,
        games: deck.games.map(game => {
            const myTagIndices = (game.myTagIds || []).map(id => tagIdToIndexMap.get(id)).filter(i => i !== undefined);
            const opponentTagIndices = (game.opponentTagIds || []).map(id => tagIdToIndexMap.get(id)).filter(i => i !== undefined);
            return [
                game.id,
                game.timestamp,
                CLASSES.indexOf(game.opponentClass),
                turns.indexOf(game.turn),
                results.indexOf(game.result),
                myTagIndices,
                opponentTagIndices
            ];
        })
    }));

    const exportData = {
        version: "2.3",
        encoding: {
            classes: CLASSES,
            turns: turns,
            results: results,
            tagIdList: tagIdList,
            game_fields: ["id", "timestamp", "opponentClassIndex", "turnIndex", "resultIndex", "myTagIndices", "opponentTagIndices"]
        },
        decks: encodeDeckArray(state.decks),
        takeTwoDecks: encodeDeckArray(state.takeTwoDecks),
        tags: state.tags,
        tagUsage: state.tagUsage
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
            const fileContent = e.target.result;
            if (typeof fileContent === 'string' && fileContent.startsWith('PK')) {
                throw new Error("Invalid file type. Please select a valid JSON backup file, not a ZIP archive.");
            }
            
            const rawData = JSON.parse(fileContent);
            
            if (mode === 'merge' && !['2.3', '2.2', '2.1', '2.0'].includes(rawData.version)) {
                alert("Merging is only supported for V2.0+ data format. Please use a compatible backup file or choose to overwrite.");
                return;
            }

            let importedDecks, importedTakeTwoDecks = [], importedTags = [], importedTagUsage = {};

            const decodeDeckArray = (encodedDecks, encoding) => {
                 const { classes, turns, results, tagIdList } = encoding;
                 if (!classes || !turns || !results) throw new Error("Imported file has corrupt encoding data.");

                 return encodedDecks.map(deck => ({
                    ...deck,
                    games: deck.games.map(gameArr => ({
                        id: gameArr[0],
                        timestamp: gameArr[1],
                        opponentClass: classes[gameArr[2]],
                        turn: turns[gameArr[3]],
                        result: results[gameArr[4]],
                        myTagIds: (gameArr[5] || []).map(index => tagIdList?.[index]).filter(Boolean),
                        opponentTagIds: (gameArr[6] || []).map(index => tagIdList?.[index]).filter(Boolean),
                    }))
                }));
            };

            // V2.3 format with Take Two decks
            if (rawData.version === "2.3" && rawData.encoding?.tagIdList && Array.isArray(rawData.decks)) {
                importedDecks = decodeDeckArray(rawData.decks, rawData.encoding);
                importedTakeTwoDecks = decodeDeckArray(rawData.takeTwoDecks || [], rawData.encoding);
                importedTags = (rawData.tags || []).map(({ id, name }) => ({ id, name }));
                importedTagUsage = rawData.tagUsage || {};
            } else if (rawData.version === "2.2" && rawData.encoding?.tagIdList && Array.isArray(rawData.decks)) {
                importedDecks = decodeDeckArray(rawData.decks, rawData.encoding);
                importedTags = (rawData.tags || []).map(({ id, name }) => ({ id, name }));
                importedTagUsage = rawData.tagUsage || {};
            } else if (rawData.version === "2.1" && rawData.encoding && Array.isArray(rawData.decks)) { // V2.1 format with tags
                 importedDecks = decodeDeckArray(rawData.decks, { ...rawData.encoding, tagIdList: rawData.tags.map(t => t.id) }); // Emulate tagIdList
                 importedTags = (rawData.tags || []).map(({ id, name }) => ({ id, name }));
                 importedTagUsage = rawData.tagUsage || {};
            } else if (rawData.version === "2.0" && rawData.encoding && Array.isArray(rawData.decks)) { // V2.0 format
                const { classes, turns, results } = rawData.encoding;
                importedDecks = rawData.decks.map(deck => ({
                    ...deck, games: deck.games.map(gameArr => ({ id: gameArr[0], timestamp: gameArr[1], opponentClass: classes[gameArr[2]], turn: turns[gameArr[3]], result: results[gameArr[4]] }))
                }));
            } else if (Array.isArray(rawData)) { // V1 legacy format
                 importedDecks = rawData.map(deck => ({ ...deck, notes: deck.notes || '' }));
            } else {
                 throw new Error("Unsupported or corrupt file format.");
            }
            
            if (!Array.isArray(importedDecks)) throw new Error("The imported file contains invalid deck data.");

            if (mode === 'overwrite') {
                state.decks = importedDecks;
                state.takeTwoDecks = importedTakeTwoDecks;
                state.tags = importedTags;
                state.tagUsage = importedTagUsage;
                alert("Data imported and overwritten successfully!");
            } else if (mode === 'merge') {
                // 1. Merge Tags (same as before)
                const importedIdToExistingIdMap = new Map();
                const existingTagNames = new Map(state.tags.map(t => [t.name.toLowerCase(), t.id]));
                const existingTagIds = new Set(state.tags.map(t => t.id));
                const tagsToAdd = [];

                importedTags.forEach(importedTag => {
                    const existingTagIdForName = existingTagNames.get(importedTag.name.toLowerCase());
                    if (existingTagIdForName) {
                        if (importedTag.id !== existingTagIdForName) importedIdToExistingIdMap.set(importedTag.id, existingTagIdForName);
                    } else if (!existingTagIds.has(importedTag.id)) {
                        tagsToAdd.push(importedTag);
                        existingTagNames.set(importedTag.name.toLowerCase(), importedTag.id);
                        existingTagIds.add(importedTag.id);
                    }
                });
                state.tags.push(...tagsToAdd);

                // 2. Merge Tag Usage (same as before)
                for (const importedTagId in importedTagUsage) {
                    const targetTagId = importedIdToExistingIdMap.get(importedTagId) || importedTagId;
                    const importedTimestamp = importedTagUsage[importedTagId];
                    if (!state.tagUsage[targetTagId] || importedTimestamp > state.tagUsage[targetTagId]) {
                        state.tagUsage[targetTagId] = importedTimestamp;
                    }
                }

                // 3. Remap tag IDs in imported games BEFORE merging decks.
                const mapGameTagIds = game => {
                    const remap = (idArray) => {
                        if (!idArray) return [];
                        const newIdSet = new Set(idArray.map(id => importedIdToExistingIdMap.get(id) || id));
                        return Array.from(newIdSet);
                    };
                    game.myTagIds = remap(game.myTagIds);
                    game.opponentTagIds = remap(game.opponentTagIds);
                    return game;
                };
                importedDecks.forEach(deck => { deck.games = deck.games.map(mapGameTagIds); });
                importedTakeTwoDecks.forEach(deck => { deck.games = deck.games.map(mapGameTagIds); });

                // 4. Merge Normal Decks (same as before)
                const importedDecksMap = new Map(importedDecks.map(d => [d.id, d]));
                const mergedDecks = state.decks.map(existingDeck => {
                    const importedDeckMatch = importedDecksMap.get(existingDeck.id);
                    if (importedDeckMatch) {
                        const existingGameIds = new Set(existingDeck.games.map(g => g.id));
                        const gamesToMerge = importedDeckMatch.games.filter(g => !existingGameIds.has(g.id));
                        importedDecksMap.delete(existingDeck.id);
                        const newNotes = 'notes' in importedDeckMatch ? importedDeckMatch.notes : existingDeck.notes;
                        return { ...existingDeck, games: [...existingDeck.games, ...gamesToMerge], notes: newNotes || '' };
                    }
                    return existingDeck;
                });
                const newDecks = Array.from(importedDecksMap.values());
                state.decks = [...mergedDecks, ...newDecks];

                // 5. Merge Take Two Decks
                if (importedTakeTwoDecks.length > 0) {
                    const t2DecksMap = new Map(importedTakeTwoDecks.map(d => [d.id, d]));
                    state.takeTwoDecks.forEach(existingDeck => {
                        const importedDeck = t2DecksMap.get(existingDeck.id);
                        if (importedDeck) {
                            const existingGameIds = new Set(existingDeck.games.map(g => g.id));
                            const gamesToMerge = importedDeck.games.filter(g => !existingGameIds.has(g.id));
                            existingDeck.games.push(...gamesToMerge);
                             if ('notes' in importedDeck) { existingDeck.notes = importedDeck.notes; }
                        }
                    });
                }
                
                alert("Data merged successfully!");
            }

            saveDecks();
            saveTakeTwoDecks();
            saveTags();
            saveTagUsage();
            initializeTakeTwoDecks();
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
    const hasData = state.decks.length > 0 || state.takeTwoDecks.some(d => d.games.length > 0);

    if (hasData) {
        openImportModal();
    } else {
        processImportFile(file, 'overwrite');
    }
};


// --- EVENT HANDLERS ---
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
        
        saveButton.textContent = 'Game Saved!';
        saveButton.className = 'w-full px-4 py-3 font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 bg-green-600 text-white ring-green-500';

        setTimeout(() => {
            clearAddGameSelections();
            render();
        }, 375);
    }
};

const handleGlobalClick = (e) => {
    const target = e.target;
    const actionTarget = target.closest('[data-action]');
    const emptyTagFilter = { my: { include: [], exclude: [] }, opp: { include: [], exclude: [] } };

    if (actionTarget) {
        const { action, deckId, gameId, tagId, class: filterClass } = actionTarget.dataset;

        switch (action) {
            case 'open-add-deck-modal': openAddDeckModal(); break;
            case 'close-add-deck-modal': closeAddDeckModal(); break;
            case 'open-delete-deck-modal': openDeleteDeckModal(deckId); break;
            case 'close-delete-deck-modal': closeDeleteDeckModal(); break;
            case 'open-delete-tag-modal': openDeleteTagModal(tagId); break;
            case 'close-delete-tag-modal': closeDeleteTagModal(); break;
            case 'close-merge-tag-modal': closeMergeTagModal(); break;
            case 'open-delete-match-modal':
                 const matchListItem = target.closest('li[data-game-id]');
                 if (matchListItem) {
                    openDeleteMatchModal(matchListItem.dataset.deckId, matchListItem.dataset.gameId);
                 }
                 break;
            case 'close-delete-match-modal': closeDeleteMatchModal(); break;
            case 'open-match-info-modal': 
                const infoMatchListItem = target.closest('li[data-game-id]');
                if (infoMatchListItem) {
                    openMatchInfoModal(infoMatchListItem.dataset.deckId, infoMatchListItem.dataset.gameId);
                }
                break;
            case 'close-match-info-modal': closeMatchInfoModal(); break;
            case 'open-notes-modal': openNotesModal(deckId); break;
            case 'close-notes-modal': closeNotesModal(); break;
            case 'open-tag-filter-modal': openTagFilterModal(); break;
            case 'close-tag-filter-modal': closeTagFilterModal(); break;
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
                break;
            case 'confirm-delete-deck':
                if (state.deckToDeleteId) {
                    if (state.mode === 'takeTwo') {
                        state.takeTwoDecks = state.takeTwoDecks.map(d =>
                            d.id === state.deckToDeleteId ? { ...d, games: [] } : d
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
                break;
            case 'confirm-delete-match':
                if (state.matchToDelete) {
                    const { deckId: matchDeckId, gameId: matchGameId } = state.matchToDelete;
                    const deckListKey = state.mode === 'takeTwo' ? 'takeTwoDecks' : 'decks';
                    state[deckListKey] = state[deckListKey].map(deck => {
                        if (deck.id === matchDeckId) {
                            return { ...deck, games: deck.games.filter(g => g.id !== matchGameId) };
                        }
                        return deck;
                    });
                    saveCurrentDecks();
                    closeDeleteMatchModal();
                    render();
                }
                break;
            case 'confirm-delete-tag':
                const tagIdToDelete = state.tagToDeleteId;
                if (tagIdToDelete) {
                    const decksToUpdate = [...state.decks, ...state.takeTwoDecks];
                    decksToUpdate.forEach(deck => {
                        deck.games.forEach(game => {
                            if (game.myTagIds) game.myTagIds = game.myTagIds.filter(id => id !== tagIdToDelete);
                            if (game.opponentTagIds) game.opponentTagIds = game.opponentTagIds.filter(id => id !== tagIdToDelete);
                        });
                    });
                    
                    const cleanFilterArray = (arr) => arr ? arr.filter(id => id !== tagIdToDelete) : [];
                    const cleanTagFilter = (filter) => {
                        if (!filter) return;
                        filter.my.include = cleanFilterArray(filter.my.include);
                        filter.my.exclude = cleanFilterArray(filter.my.exclude);
                        filter.opp.include = cleanFilterArray(filter.opp.include);
                        filter.opp.exclude = cleanFilterArray(filter.opp.exclude);
                    };
                    
                    cleanTagFilter(state.globalTagFilter);
                    if (state.view.type === 'stats' && state.view.tagFilter) {
                        cleanTagFilter(state.view.tagFilter);
                    }

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
                break;
            case 'confirm-merge-tag': {
                const { sourceTag, targetTag } = state.tagToMerge || {};
                if (!sourceTag || !targetTag) return;
            
                const sourceTagId = sourceTag.id;
                const targetTagId = targetTag.id;
                const decksToUpdate = [...state.decks, ...state.takeTwoDecks];
            
                decksToUpdate.forEach(deck => {
                    deck.games.forEach(game => {
                        const mergeIds = (idArray) => {
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
            
                const sourceTimestamp = state.tagUsage[sourceTagId];
                const targetTimestamp = state.tagUsage[targetTagId];
                if (sourceTimestamp && (!targetTimestamp || sourceTimestamp > targetTimestamp)) {
                    state.tagUsage[targetTagId] = sourceTimestamp;
                }
                delete state.tagUsage[sourceTagId];
            
                state.tags = state.tags.filter(t => t.id !== sourceTagId);
                const mergeIdsInFilterArray = (idArray) => {
                    if (!idArray || !idArray.includes(sourceTagId)) return idArray;
                    const idSet = new Set(idArray);
                    idSet.delete(sourceTagId);
                    idSet.add(targetTagId);
                    return Array.from(idSet);
                };
                const mergeTagFilter = (filter) => {
                    if (!filter) return;
                    filter.my.include = mergeIdsInFilterArray(filter.my.include);
                    filter.my.exclude = mergeIdsInFilterArray(filter.my.exclude);
                    filter.opp.include = mergeIdsInFilterArray(filter.opp.include);
                    filter.opp.exclude = mergeIdsInFilterArray(filter.opp.exclude);
                };
            
                mergeTagFilter(state.globalTagFilter);
                if (state.view.type === 'stats' && state.view.tagFilter) {
                    mergeTagFilter(state.view.tagFilter);
                }
            
                saveDecks();
                saveTakeTwoDecks();
                saveTags();
                saveTagUsage();
                saveSettings();
            
                closeMergeTagModal();
                setView({ ...state.view, editingTagId: null });
                render();
                break;
            }
            case 'stats': {
                setView({
                    type: 'stats',
                    deckId,
                    filterClass: null,
                    dateFilter: state.globalDateFilter,
                    tagFilter: state.globalTagFilter,
                    statsDeckSwitcherVisible: false,
                    dateFilterVisible: false,
                    chartType: state.chartType,
                    currentPage: 1
                });
                render();
                break;
            }
            case 'add_game': setView({ type: 'add_game', deckId, addGameDeckSwitcherVisible: false }); render(); break;
            case 'save-game': {
                const form = document.getElementById('add-game-form');
                if (form && !target.disabled) {
                    handleAddGameSubmit({ target: form });
                }
                break;
            }
            case 'edit-deck': setEditingDeckId(deckId); render(); break;
            case 'cancel-edit': setEditingDeckId(null); render(); break;
            case 'save-edit':
                if (state.mode === 'takeTwo') break; // Should not be possible from UI
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
                    const deckListKey = state.mode === 'takeTwo' ? 'takeTwoDecks' : 'decks';
                    state[deckListKey] = state[deckListKey].map(d => d.id === deckIdToSave ? { ...d, notes: textarea.value.trim() } : d);
                    saveCurrentDecks();
                }
                closeNotesModal();
                render();
                break;
            case 'delete-match': // Replaced by open-delete-match-modal
                break;
            case 'back-to-decks':
                resetAddGameState();
                setView({ type: 'list', editingDeckId: null });
                render();
                break;
            case 'toggle-mode':
                setMode(state.mode === 'normal' ? 'takeTwo' : 'normal');
                resetAddGameState();
                setView({ type: 'list', editingDeckId: null });
                render();
                break;
            case 'toggle-lang':
                state.language = state.language === 'en' ? 'ja' : 'en';
                saveSettings();
                initializeTakeTwoDecks();
                render();
                break;
            case 'toggle-theme':
                const newTheme = state.theme === 'light' ? 'dark' : 'light';
                setTheme(newTheme);
                saveSettings();
                break;
            case 'import-data': handleImport(); break;
            case 'export-data': handleExport(); break;
            case 'reset-all':
                const hasAnyData = state.decks.length > 0 || state.takeTwoDecks.some(d => d.games.length > 0) || state.tags.length > 0;
                if (hasAnyData) openResetModal();
                break;
            case 'filter-stats': {
                const newFilter = state.view.filterClass === filterClass ? null : filterClass;
                setView({ ...state.view, filterClass: newFilter, currentPage: 1 });
                render();
                break;
            }
            case 'clear-class-filter': {
                setView({ ...state.view, filterClass: null, currentPage: 1 });
                render();
                break;
            }
            case 'clear-date-filter': {
                const newDateFilter = { start: null, end: null };
                const newView = { ...state.view, dateFilter: newDateFilter, dateFilterVisible: false, currentPage: 1 };
                setView(newView);
                state.globalDateFilter = newDateFilter;
                saveSettings();
                render();
                break;
            }
            case 'clear-tag-filters': {
                const newView = { ...state.view, tagFilter: emptyTagFilter, currentPage: 1 };
                setView(newView);
                state.globalTagFilter = emptyTagFilter;
                saveSettings();
                render();
                break;
            }
            case 'toggle-deck-switcher':
                setView({ ...state.view, statsDeckSwitcherVisible: !state.view.statsDeckSwitcherVisible, dateFilterVisible: false });
                render();
                break;
            case 'toggle-date-filter':
                setView({ ...state.view, dateFilterVisible: !state.view.dateFilterVisible, statsDeckSwitcherVisible: false });
                render();
                break;
            case 'switch-stats-deck': {
                setView({
                    ...state.view,
                    deckId,
                    filterClass: null,
                    statsDeckSwitcherVisible: false,
                    currentPage: 1
                });
                render();
                break;
            }
            case 'switch-add-game-deck':
                 if (state.view.type === 'add_game') {
                    resetAddGameState();
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
            case 'toggle-add-game-tags':
                 if (state.view.type === 'add_game') {
                    setAddGameTagsExpanded(!state.addGameTagsExpanded);
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
                    setView({ ...state.view, currentPage: state.view.currentPage + 1 });
                    render();
                }
                break;
            // Tag Management actions
            case 'manage-tags':
                setView({ ...state.view, type: 'manage_tags', editingTagId: null, tagSearchQuery: '' });
                closeTagFilterModal();
                render();
                break;
            case 'back-to-stats':
                setView({ ...state.view, type: 'stats', editingTagId: null, tagSearchQuery: null });
                render();
                break;
            case 'edit-tag':
                if (state.view.type === 'manage_tags') {
                    setView({ ...state.view, editingTagId: tagId });
                    render();
                }
                break;
            case 'cancel-edit-tag':
                if (state.view.type === 'manage_tags') {
                    setView({ ...state.view, editingTagId: null });
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

const handleGlobalInput = (e) => {
    const target = e.target;
    if (target.id === 'deckName') {
        checkDeckFormValidity();
    } else if (target.id === 'new-tag-name' && state.view.type === 'manage_tags') {
        setView({ ...state.view, tagSearchQuery: target.value });
        render();
    }
}

const handleGlobalSubmit = (e) => {
    e.preventDefault();
    const form = e.target;

    if (form.id === 'add-deck-form') {
        handleAddDeckSubmit(e);
    } else if (form.id === 'add-game-form') {
        // Safety net to prevent form submission from mobile keyboards.
    } else if (form.dataset.action === 'save-tag') {
        if (state.view.type === 'manage_tags') {
            const newName = form.querySelector('input[name="tag-name"]').value.trim();
            const tagIdToEdit = form.dataset.tagId;
    
            if (!newName || !tagIdToEdit) return;
    
            const existingTag = state.tags.find(t =>
                t.id !== tagIdToEdit &&
                t.name.toLowerCase() === newName.toLowerCase()
            );
            
            const sourceTag = state.tags.find(t => t.id === tagIdToEdit);
            if (!sourceTag) return;
    
            if (existingTag) {
                setTagToMerge({ sourceTag: sourceTag, targetTag: existingTag });
                openMergeTagModal();
            } else {
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
        const newView = { ...state.view, dateFilter: newDateFilter, dateFilterVisible: false, currentPage: 1 };
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
        const newView = { ...state.view, tagFilter: newTagFilter, currentPage: 1 };
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
}

const handleGlobalKeyDown = (e) => {
    if (e.key === 'Escape') {
        if (!document.getElementById('add-deck-modal').classList.contains('hidden')) closeAddDeckModal();
        else if (!document.getElementById('delete-deck-confirm-modal').classList.contains('hidden')) closeDeleteDeckModal();
        else if (!document.getElementById('delete-match-confirm-modal').classList.contains('hidden')) closeDeleteMatchModal();
        else if (!document.getElementById('delete-tag-confirm-modal').classList.contains('hidden')) closeDeleteTagModal();
        else if (!document.getElementById('merge-tag-confirm-modal').classList.contains('hidden')) closeMergeTagModal();
        else if (!document.getElementById('deck-notes-modal').classList.contains('hidden')) closeNotesModal();
        else if (!document.getElementById('match-info-modal').classList.contains('hidden')) closeMatchInfoModal();
        else if (!document.getElementById('tag-filter-modal').classList.contains('hidden')) closeTagFilterModal();
        else if (!document.getElementById('import-confirm-modal').classList.contains('hidden')) closeImportModal();
        else if (!document.getElementById('reset-confirm-modal').classList.contains('hidden')) closeResetModal();
        else if (state.view.type === 'add_game' || state.view.type === 'stats' || state.view.type === 'manage_tags') {
            if (state.view.type === 'add_game') {
                resetAddGameState();
            }
            setView({ type: 'list', editingDeckId: null });
            render();
        } else if (state.view.type === 'list' && state.view.editingDeckId) {
            setEditingDeckId(null);
            render();
        }
    }

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

const setupEventListeners = () => {
    document.body.addEventListener('click', handleGlobalClick);
    document.body.addEventListener('input', handleGlobalInput);
    document.body.addEventListener('submit', handleGlobalSubmit);
    document.addEventListener('keydown', handleGlobalKeyDown);
    document.getElementById('import-file-input').addEventListener('change', handleFileSelect);
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    state.decks = loadDecks();
    state.takeTwoDecks = loadTakeTwoDecks();
    state.tags = loadTags();
    state.tagUsage = loadTagUsage();
    
    const settings = loadSettings();
    if (settings.language && (settings.language === 'en' || settings.language === 'ja')) {
        state.language = settings.language;
    }
    if (settings.mode && ['normal', 'takeTwo'].includes(settings.mode)) {
        state.mode = settings.mode;
    }
    if (settings.chartType && ['pie', 'bar'].includes(settings.chartType)) {
        state.chartType = settings.chartType;
    }
    if (settings.addGameTagsExpanded) {
        state.addGameTagsExpanded = settings.addGameTagsExpanded;
    }
    if (settings.globalDateFilter) {
        state.globalDateFilter = settings.globalDateFilter;
    }
    if (settings.globalTagFilter) {
        state.globalTagFilter = settings.globalTagFilter;
    }

    if (document.documentElement.classList.contains('dark')) {
        state.theme = 'dark';
    } else {
        state.theme = 'light';
    }
    if(settings.theme) {
        state.theme = settings.theme;
    }
    
    initializeTakeTwoDecks();
    
    let tagsUpdated = false;
    state.tags.forEach(tag => {
        if (tag.hasOwnProperty('class')) {
            delete tag.class;
            tagsUpdated = true;
        }
    });
    if (tagsUpdated) {
        saveTags();
    }

    render();
    setupEventListeners();
});