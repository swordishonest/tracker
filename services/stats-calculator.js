/**
 * @fileoverview This file is responsible for calculating all statistics displayed
 * in the stats view. It includes logic for filtering data, calculating win rates,
 * streaks, distributions, and preparing data for charts. It uses a caching mechanism
 * to avoid re-computing stats unnecessarily.
 */


import { CLASSES, CLASS_NAMES, getTranslated } from '../store.js';

// A cache to store results of expensive calculations.
const cache = new Map();
// References to check if the underlying data has changed, invalidating the cache.
let lastDecksRef = null;
let lastTagsRef = null;
let lastModeRef = null;

// The number of items to display per page in match/result history.
const ITEMS_PER_PAGE = 20;

/**
 * Creates a baseline object for tracking statistics.
 * @returns {object} An empty stats object.
 */
const createEmptyStats = () => ({
    total: 0,
    wins: 0,
    losses: 0,
    firstTurnTotal: 0,
    firstTurnWins: 0,
    secondTurnTotal: 0,
    secondTurnWins: 0,
    longestStreak: 0,
    opponentDistribution: CLASSES.reduce((acc, cls) => ({ ...acc, [cls]: 0 }), {}),
    winLossByOpponent: CLASSES.reduce((acc, cls) => ({ ...acc, [cls]: { wins: 0, total: 0 } }), {}),
});

/**
 * Calculates the longest winning streak from a list of games.
 * @param {Array<object>} games An array of game objects.
 * @returns {number} The longest winning streak.
 */
const calculateLongestStreak = (games) => {
    if (!games.length) return 0;
    // Games must be sorted by timestamp to correctly calculate streaks.
    const sortedForStreak = [...games].sort((a, b) => a.timestamp - b.timestamp);
    let longestStreak = 0;
    let currentStreak = 0;
    for (const game of sortedForStreak) {
        if (game.result === 'Win') {
            currentStreak++;
        } else {
            longestStreak = Math.max(longestStreak, currentStreak);
            currentStreak = 0;
        }
    }
    // Final check in case the streak continues to the end.
    return Math.max(longestStreak, currentStreak);
};

/**
 * Processes an array of games to calculate aggregate statistics.
 * @param {Array<object>} games The games to process.
 * @returns {object} A populated stats object.
 */
const processGames = (games) => {
    const stats = createEmptyStats();

    for (const game of games) {
        stats.total++;
        stats.opponentDistribution[game.opponentClass]++;
        const opponentStats = stats.winLossByOpponent[game.opponentClass];
        opponentStats.total++;

        if (game.result === 'Win') {
            stats.wins++;
            opponentStats.wins++;
        } else {
            stats.losses++;
        }

        if (game.turn === '1st') {
            stats.firstTurnTotal++;
            if (game.result === 'Win') stats.firstTurnWins++;
        } else { // 2nd
            stats.secondTurnTotal++;
            if (game.result === 'Win') stats.secondTurnWins++;
        }
    }
    return stats;
};

/**
 * The main function to get all calculated data for the statistics view.
 * It handles filtering based on the view state and orchestrates all calculations.
 * Results are cached to improve performance on re-renders with the same filters.
 * @param {object} view The current view state object from the store.
 * @param {Array<object>} decks The list of all decks.
 * @param {Array<object>} tags The list of all tags.
 * @param {function} t The translation function.
 * @param {string} language The current language ('en' or 'ja').
 * @param {string} mode The current mode ('normal' or 'takeTwo').
 * @returns {object|null} An object containing all calculated data for the view, or null if the deck is not found.
 */
export const getStatsForView = (view, decks, tags, t, language, mode) => {
    // Invalidate cache if the core data references have changed.
    if (lastDecksRef !== decks || lastTagsRef !== tags || lastModeRef !== mode) {
        cache.clear();
        lastDecksRef = decks;
        lastTagsRef = tags;
        lastModeRef = mode;
    }

    const cacheKey = JSON.stringify({ ...view, language, mode });
    if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
    }
    
    // --- Computation ---
    const isAllDecksView = view.deckId === 'all';
    let displayDeck;

    // Determine which deck(s) to analyze based on the view's deckId.
    // This can be a single deck, all decks of a class, or all decks combined.
    if (view.deckId && view.deckId.startsWith('all-')) {
        const targetClass = view.deckId.substring(4);
        const classDecks = decks.filter(d => d.class === targetClass);
        const allClassGames = classDecks.flatMap(d => d.games.map(g => ({...g, originalDeckId: d.id, originalDeckClass: d.class})));
        const allClassRuns = mode === 'takeTwo' ? classDecks.flatMap(d => (d.runs || []).map(r => ({...r, originalDeckId: d.id, originalDeckClass: d.class}))) : [];
        const translatedClassName = getTranslated(CLASS_NAMES, targetClass);
        displayDeck = {
            id: view.deckId,
            name: t('allClassDecks', { class: translatedClassName }),
            class: targetClass,
            games: allClassGames,
            runs: allClassRuns
        };
    } else if (isAllDecksView) {
        const allGames = decks.flatMap(d => d.games.map(g => ({...g, originalDeckId: d.id, originalDeckClass: d.class})));
        const allRuns = mode === 'takeTwo' ? decks.flatMap(d => (d.runs || []).map(r => ({...r, originalDeckId: d.id, originalDeckClass: d.class}))) : [];
        const name = mode === 'takeTwo' ? t('allClasses') : t('allDecks');
        displayDeck = { id: 'all', name, class: 'All', games: allGames, runs: allRuns };
    } else {
        displayDeck = decks.find(d => d.id === view.deckId);
    }

    if (!displayDeck) return null;

    let filteredDeckGames = displayDeck.games;
    let filteredDeckRuns = displayDeck.runs || [];
    
    // Apply Date Filter
    if (view.dateFilter && (view.dateFilter.start || view.dateFilter.end)) {
        const startDate = view.dateFilter.start ? new Date(view.dateFilter.start).setHours(0, 0, 0, 0) : null;
        const endDate = view.dateFilter.end ? new Date(view.dateFilter.end).setHours(23, 59, 59, 999) : null;
        filteredDeckGames = filteredDeckGames.filter(game => {
            const gameDate = game.timestamp;
            if (startDate && gameDate < startDate) return false;
            if (endDate && gameDate > endDate) return false;
            return true;
        });
        filteredDeckRuns = filteredDeckRuns.filter(run => {
            const runDate = run.timestamp;
            if (startDate && runDate < startDate) return false;
            if (endDate && runDate > endDate) return false;
            return true;
        });
    }

    // Apply Tag Filter
    if (view.tagFilter) {
        const { my, opp } = view.tagFilter;
        if (my.include.length > 0 || my.exclude.length > 0 || opp.include.length > 0 || opp.exclude.length > 0) {
            filteredDeckGames = filteredDeckGames.filter(game => {
                const myTagIds = new Set(game.myTagIds || []);
                const oppTagIds = new Set(game.opponentTagIds || []);
                
                // My Tags - Include
                if (my.include.length > 0 && !my.include.some(id => myTagIds.has(id))) {
                    return false;
                }
                // My Tags - Exclude
                if (my.exclude.length > 0 && my.exclude.some(id => myTagIds.has(id))) {
                    return false;
                }
                // Opponent Tags - Include
                if (opp.include.length > 0 && !opp.include.some(id => oppTagIds.has(id))) {
                    return false;
                }
                // Opponent Tags - Exclude
                if (opp.exclude.length > 0 && opp.exclude.some(id => oppTagIds.has(id))) {
                    return false;
                }
                
                return true;
            });
        }
    }

    const filteredDeckGamesCount = filteredDeckGames.length;
    // Calculate total stats before opponent filtering for the pie chart and class breakdown.
    const totalStatsForPie = processGames(filteredDeckGames);

    // Apply Opponent Class Filter for detailed stats.
    if (view.filterClass) {
        filteredDeckGames = filteredDeckGames.filter(g => g.opponentClass === view.filterClass);
    }

    // Calculate the final stats for display.
    const calculatedStats = processGames(filteredDeckGames);
    calculatedStats.longestStreak = calculateLongestStreak(filteredDeckGames);

    const stats = {
        total: calculatedStats.total,
        wins: calculatedStats.wins,
        losses: calculatedStats.losses,
        firstTurnTotal: calculatedStats.firstTurnTotal,
        firstTurnWins: calculatedStats.firstTurnWins,
        secondTurnTotal: calculatedStats.secondTurnTotal,
        secondTurnWins: calculatedStats.secondTurnWins,
        longestStreak: calculatedStats.longestStreak,
        winRate: calculatedStats.total > 0 ? `${((calculatedStats.wins / calculatedStats.total) * 100).toFixed(1)}%` : t('na'),
        firstTurnWinRate: calculatedStats.firstTurnTotal > 0 ? `${((calculatedStats.firstTurnWins / calculatedStats.firstTurnTotal) * 100).toFixed(1)}%` : t('na'),
        secondTurnWinRate: calculatedStats.secondTurnTotal > 0 ? `${((calculatedStats.secondTurnWins / calculatedStats.secondTurnTotal) * 100).toFixed(1)}%` : t('na'),
    };

    const winRateByClass = CLASSES.reduce((acc, cls) => {
        const { wins, total } = totalStatsForPie.winLossByOpponent[cls];
        acc[cls] = total > 0 ? `${((wins / total) * 100).toFixed(1)}%` : t('na');
        return acc;
    }, {});
    
    // Calculate Take Two Specific Stats
    let averageWins = t('na');
    let winDistribution = Array(8).fill(0); // for 0 to 7 wins
    if (mode === 'takeTwo' && filteredDeckRuns && filteredDeckRuns.length > 0) {
        const runs = filteredDeckRuns;
        const totalRuns = runs.length;
        if (totalRuns > 0) {
            const totalWins = runs.reduce((sum, run) => sum + run.wins, 0);
            averageWins = (totalWins / totalRuns).toFixed(2);
            runs.forEach(run => {
                if (run.wins >= 0 && run.wins <= 7) {
                    winDistribution[run.wins]++;
                }
            });
        }
    }

    const sortedGames = [...filteredDeckGames].sort((a, b) => b.timestamp - a.timestamp);
    const sortedRuns = [...filteredDeckRuns].sort((a, b) => b.timestamp - a.timestamp);

    // --- Pagination Logic ---
    // Game Pagination
    const matchHistoryCurrentPage = view.matchHistoryCurrentPage || 1;
    const totalGames = sortedGames.length;
    const totalGamePages = Math.ceil(totalGames / ITEMS_PER_PAGE) || 1;
    const gameStartIndex = (matchHistoryCurrentPage - 1) * ITEMS_PER_PAGE;
    const paginatedGames = sortedGames.slice(gameStartIndex, gameStartIndex + ITEMS_PER_PAGE);

    // Run Pagination (Take Two)
    const resultHistoryCurrentPage = view.resultHistoryCurrentPage || 1;
    const totalRuns = sortedRuns.length;
    const totalRunPages = Math.ceil(totalRuns / ITEMS_PER_PAGE) || 1;
    const runStartIndex = (resultHistoryCurrentPage - 1) * ITEMS_PER_PAGE;
    const paginatedRuns = sortedRuns.slice(runStartIndex, runStartIndex + ITEMS_PER_PAGE);

    const result = {
        displayDeck,
        stats,
        totalStatsForPie,
        winRateByClass,
        paginatedGames,
        totalGames,
        totalGamePages,
        paginatedRuns,
        totalRuns,
        totalRunPages,
        filteredDeckGamesCount,
        averageWins,
        winDistribution,
    };
    
    // Store the result in the cache before returning.
    cache.set(cacheKey, result);
    return result;
};
