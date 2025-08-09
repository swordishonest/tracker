/**
 * @fileoverview This file contains functions for importing and exporting user data.
 * It handles serializing the application state into a downloadable JSON file
 * and parsing an uploaded JSON file to repopulate the application state,
 * supporting both 'merge' and 'overwrite' import modes.
 */

import { state, saveDecks, saveSettings, CLASSES, saveTags, saveTagUsage, initializeTakeTwoDecks, saveTakeTwoDecks, setFileToImport } from '../store.js';
import { render } from '../view.js';

// --- DATA IMPORT/EXPORT ---

/**
 * Exports the current application state to a JSON file and initiates a download.
 * The data is encoded to reduce file size by replacing strings with indices.
 * This includes all decks, Take Two data, tags, and tag usage history.
 */
export const exportData = () => {
    const hasNormalData = state.decks.length > 0;
    const hasTakeTwoData = state.takeTwoDecks.some(d => d.games.length > 0 || (d.runs && d.runs.length > 0));
    const hasTagData = state.tags.length > 0;

    if (!hasNormalData && !hasTakeTwoData && !hasTagData) {
        alert("There is no data to export.");
        return;
    }

    const turns = ['1st', '2nd'];
    const results = ['Win', 'Loss'];

    const tagIdList = state.tags.map(t => t.id);
    const tagIdToIndexMap = new Map(tagIdList.map((id, index) => [id, index]));

    /**
     * Encodes an array of deck objects into a more compact format.
     * @param {Array<Object>} deckArray The array of decks to encode.
     * @returns {Array<Object>} The encoded array of decks.
     */
    const encodeDeckArray = (deckArray) => deckArray.map(deck => {
        const newDeck = { ...deck };
        newDeck.games = newDeck.games.map(game => {
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
        });
        if (newDeck.runs && newDeck.runs.length > 0) {
            newDeck.runs = newDeck.runs.map(run => [run.id, run.timestamp, run.wins, run.losses]);
        } else {
            delete newDeck.runs;
        }
        return newDeck;
    });

    const exportableData = {
        version: "2.4",
        encoding: {
            classes: CLASSES,
            turns: turns,
            results: results,
            tagIdList: tagIdList,
            game_fields: ["id", "timestamp", "opponentClassIndex", "turnIndex", "resultIndex", "myTagIndices", "opponentTagIndices"],
            run_fields: ["id", "timestamp", "wins", "losses"]
        },
        decks: encodeDeckArray(state.decks),
        takeTwoDecks: encodeDeckArray(state.takeTwoDecks),
        tags: state.tags,
        tagUsage: state.tagUsage
    };

    const dataStr = JSON.stringify(exportableData, null, 2);
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

/**
 * Imports data from a user-selected JSON file.
 * Supports different versions of the data format and handles both 'merge' and 'overwrite' modes.
 * @param {File} file The JSON file to import.
 * @param {('merge'|'overwrite')} mode The import mode.
 */
export const importData = (file, mode) => {
    if (!file || !mode) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const fileContent = e.target.result;
            if (typeof fileContent === 'string' && fileContent.startsWith('PK')) {
                throw new Error("Invalid file type. Please select a valid JSON backup file, not a ZIP archive.");
            }
            
            const rawData = JSON.parse(fileContent);
            
            if (mode === 'merge' && !['2.4', '2.3', '2.2', '2.1', '2.0'].includes(rawData.version)) {
                alert("Merging is only supported for V2.0+ data format. Please use a compatible backup file or choose to overwrite.");
                return;
            }

            let importedDecks, importedTakeTwoDecks = [], importedTags = [], importedTagUsage = {};

            /**
             * Decodes an array of deck objects from the compact format back to the full object format.
             * @param {Array<Object>} encodedDecks The array of encoded decks.
             * @param {Object} encoding The encoding map from the backup file.
             * @returns {Array<Object>} The decoded array of decks.
             */
            const decodeDeckArray = (encodedDecks, encoding) => {
                 const { classes, turns, results, tagIdList, run_fields } = encoding;
                 if (!classes || !turns || !results) throw new Error("Imported file has corrupt encoding data.");

                 return encodedDecks.map(deck => {
                    const decodedDeck = { ...deck };
                    decodedDeck.games = deck.games.map(gameArr => ({
                        id: gameArr[0],
                        timestamp: gameArr[1],
                        opponentClass: classes[gameArr[2]],
                        turn: turns[gameArr[3]],
                        result: results[gameArr[4]],
                        myTagIds: (gameArr[5] || []).map(index => tagIdList?.[index]).filter(Boolean),
                        opponentTagIds: (gameArr[6] || []).map(index => tagIdList?.[index]).filter(Boolean),
                    }));
                    if (deck.runs && run_fields) {
                        decodedDeck.runs = deck.runs.map(runArr => ({
                            id: runArr[0],
                            timestamp: runArr[1],
                            wins: runArr[2],
                            losses: runArr[3],
                        }));
                    } else {
                        decodedDeck.runs = [];
                    }
                    return decodedDeck;
                });
            };

            // --- Data Version Handling ---
            if (rawData.version === "2.4" && rawData.encoding?.tagIdList && Array.isArray(rawData.decks)) {
                importedDecks = decodeDeckArray(rawData.decks, rawData.encoding);
                importedTakeTwoDecks = decodeDeckArray(rawData.takeTwoDecks || [], rawData.encoding);
                importedTags = (rawData.tags || []).map(({ id, name }) => ({ id, name }));
                importedTagUsage = rawData.tagUsage || {};
            } else if (rawData.version === "2.3" && rawData.encoding?.tagIdList && Array.isArray(rawData.decks)) {
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
                 importedDecks = rawData.map(deck => ({ ...deck, notes: deck.notes || '', runs: [] }));
            } else {
                 throw new Error("Unsupported or corrupt file format.");
            }
            
            if (!Array.isArray(importedDecks)) throw new Error("The imported file contains invalid deck data.");
            importedTakeTwoDecks.forEach(d => { if (!d.runs) d.runs = []; });

            // --- Merge/Overwrite Logic ---
            if (mode === 'overwrite') {
                state.decks = importedDecks;
                state.takeTwoDecks = importedTakeTwoDecks;
                state.tags = importedTags;
                state.tagUsage = importedTagUsage;
                alert("Data imported and overwritten successfully!");
            } else if (mode === 'merge') {
                // 1. Merge Tags: Handle duplicates by name, remap IDs
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

                // 2. Merge Tag Usage: Prioritize most recent timestamp
                for (const importedTagId in importedTagUsage) {
                    const targetTagId = importedIdToExistingIdMap.get(importedTagId) || importedTagId;
                    const importedTimestamp = importedTagUsage[importedTagId];
                    if (!state.tagUsage[targetTagId] || importedTimestamp > state.tagUsage[targetTagId]) {
                        state.tagUsage[targetTagId] = importedTimestamp;
                    }
                }

                // 3. Remap tag IDs in imported games before merging
                const mapGameTagIds = game => {
                    const remap = idArray => {
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

                // 4. Merge Normal Decks: Match by ID, add new games/decks
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

                // 5. Merge Take Two Decks: Match by ID, add new runs/games
                if (importedTakeTwoDecks.length > 0) {
                    const t2DecksMap = new Map(importedTakeTwoDecks.map(d => [d.id, d]));
                    state.takeTwoDecks.forEach(existingDeck => {
                        const importedDeck = t2DecksMap.get(existingDeck.id);
                        if (importedDeck) {
                            const existingGameIds = new Set(existingDeck.games.map(g => g.id));
                            const gamesToMerge = importedDeck.games.filter(g => !existingGameIds.has(g.id));
                            existingDeck.games.push(...gamesToMerge);
                            if ('notes' in importedDeck) { existingDeck.notes = importedDeck.notes; }
                            
                            if(importedDeck.runs && importedDeck.runs.length > 0) {
                                const existingRunIds = new Set((existingDeck.runs || []).map(r => r.id));
                                const runsToMerge = importedDeck.runs.filter(r => !existingRunIds.has(r.id));
                                existingDeck.runs = [...(existingDeck.runs || []), ...runsToMerge];
                            }
                        }
                    });
                }
                
                alert("Data merged successfully!");
            }

            // Save all changes and re-render
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
