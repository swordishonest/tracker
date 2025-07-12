
import { CLASSES, CLASS_NAMES, getTranslated } from './store.js';

const cache = new Map();
let lastDecksRef = null;

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

export const getStatsForView = (view, decks, t) => {
    if (lastDecksRef !== decks) {
        cache.clear();
        lastDecksRef = decks;
    }

    const cacheKey = JSON.stringify(view);
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
        displayDeck = { id: 'all', name: t('allDecks'), class: 'All', games: allGames };
    } else {
        displayDeck = decks.find(d => d.id === view.deckId);
    }

    if (!displayDeck) return null;

    let filteredDeckGames = displayDeck.games;
    if (view.dateFilter && (view.dateFilter.start || view.dateFilter.end)) {
        const start = view.dateFilter.start ? new Date(view.dateFilter.start).setHours(0, 0, 0, 0) : 0;
        const end = view.dateFilter.end ? new Date(view.dateFilter.end).setHours(23, 59, 59, 999) : Date.now();
        filteredDeckGames = filteredDeckGames.filter(g => g.timestamp >= start && g.timestamp <= end);
    }
    
    const gamesToAnalyze = view.filterClass ? filteredDeckGames.filter(g => g.opponentClass === view.filterClass) : filteredDeckGames;
    
    const totalStatsRaw = processGames(filteredDeckGames);
    const mainStatsRaw = processGames(gamesToAnalyze);
    
    mainStatsRaw.longestStreak = calculateLongestStreak(gamesToAnalyze);
    
    const formatRate = (wins, total) => total > 0 ? `${((wins / total) * 100).toFixed(1)}%` : t('na');
    
    const stats = {
        ...mainStatsRaw,
        winRate: formatRate(mainStatsRaw.wins, mainStatsRaw.total),
        firstTurnWinRate: formatRate(mainStatsRaw.firstTurnWins, mainStatsRaw.firstTurnTotal),
        secondTurnWinRate: formatRate(mainStatsRaw.secondTurnWins, mainStatsRaw.secondTurnTotal),
    };

    const winRateByClass = CLASSES.reduce((acc, cls) => {
        const { wins, total } = totalStatsRaw.winLossByOpponent[cls];
        acc[cls] = formatRate(wins, total);
        return acc;
    }, {});
    
    const sortedGames = [...gamesToAnalyze].sort((a, b) => b.timestamp - a.timestamp);
    
    const result = {
        displayDeck,
        stats,
        totalStatsForPie: { 
            opponentDistribution: totalStatsRaw.opponentDistribution, 
            total: totalStatsRaw.total,
        },
        winRateByClass,
        sortedGames,
        filteredDeckGamesCount: filteredDeckGames.length,
    };
    
    cache.set(cacheKey, result);
    return result;
};
