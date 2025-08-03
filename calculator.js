import { CLASSES, CLASS_NAMES, getTranslated } from './store.js';

const cache = new Map();
let lastDecksRef = null;
let lastTagsRef = null;
let lastModeRef = null;

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

const calculateLongestStreak = (games) => {
    if (!games.length) return 0;
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
    return Math.max(longestStreak, currentStreak);
};

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

export const getStatsForView = (view, decks, tags, t, language, mode) => {
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

    if (view.deckId && view.deckId.startsWith('all-')) {
        const targetClass = view.deckId.substring(4);
        const classDecks = decks.filter(d => d.class === targetClass);
        const allClassGames = classDecks.flatMap(d => d.games.map(g => ({...g, originalDeckId: d.id, originalDeckClass: d.class})));
        const translatedClassName = getTranslated(CLASS_NAMES, targetClass);
        displayDeck = {
            id: view.deckId,
            name: t('allClassDecks', { class: translatedClassName }),
            class: targetClass,
            games: allClassGames
        };
    } else if (isAllDecksView) {
        const allGames = decks.flatMap(d => d.games.map(g => ({...g, originalDeckId: d.id, originalDeckClass: d.class})));
        const name = mode === 'takeTwo' ? t('allClasses') : t('allDecks');
        displayDeck = { id: 'all', name, class: 'All', games: allGames };
    } else {
        displayDeck = decks.find(d => d.id === view.deckId);
    }

    if (!displayDeck) return null;

    let filteredDeckGames = displayDeck.games;
    // Date Filter
    if (view.dateFilter && (view.dateFilter.start || view.dateFilter.end)) {
        const startDate = view.dateFilter.start ? new Date(view.dateFilter.start).setHours(0, 0, 0, 0) : null;
        const endDate = view.dateFilter.end ? new Date(view.dateFilter.end).setHours(23, 59, 59, 999) : null;
        filteredDeckGames = filteredDeckGames.filter(game => {
            const gameDate = game.timestamp;
            if (startDate && gameDate < startDate) return false;
            if (endDate && gameDate > endDate) return false;
            return true;
        });
    }

    // Tag Filter
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
    const totalStatsForPie = processGames(filteredDeckGames);

    // Opponent Class Filter
    if (view.filterClass) {
        filteredDeckGames = filteredDeckGames.filter(g => g.opponentClass === view.filterClass);
    }

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
    
    const sortedGames = [...filteredDeckGames].sort((a, b) => b.timestamp - a.timestamp);

    const result = {
        displayDeck,
        stats,
        totalStatsForPie,
        winRateByClass,
        sortedGames,
        filteredDeckGamesCount,
    };

    cache.set(cacheKey, result);
    return result;
};