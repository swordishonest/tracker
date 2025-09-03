/**
 * @fileoverview This file is responsible for rendering the statistics view.
 * It fetches calculated stats, and then builds and displays various components
 * like summary stats, charts (pie, bar, histogram), opponent breakdown, and match history.
 */


import { state, CLASSES, CLASS_NAMES, classStyles, getTranslated, getTranslatedClassName, TURN_NAMES, RESULT_NAMES } from '../../store.js';
import { getStatsForView } from '../../services/stats-calculator.js';
import { t, getShortClassName } from '../helpers.js';

const appContainer = document.getElementById('app');

/**
 * Renders the entire statistics view for a given deck ID (or 'all').
 * @param {string} deckId The ID of the deck to show stats for, or a special ID like 'all' or 'all-CLASS'.
 */
export const renderStatsView = (deckId) => {
    const deckList = state.mode === 'takeTwo' ? state.takeTwoDecks : state.decks;
    const calculatedData = getStatsForView(state.view, deckList, state.tags, t, state.language, state.mode);

    if (!calculatedData) {
        appContainer.innerHTML = `<p>Deck not found</p>`;
        return;
    }

    const {
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
    } = calculatedData;
    
    const { filterClass, dateFilter, tagFilter, statsDeckSwitcherVisible, dateFilterVisible, chartType, matchHistoryCurrentPage = 1, resultHistoryCurrentPage = 1 } = state.view;
    const isAllDecksView = deckId === 'all';
    
    /**
     * Renders pagination controls.
     * @param {number} currentPage The current active page.
     * @param {number} totalPages The total number of pages.
     * @param {number} totalItems The total number of items being paginated.
     * @param {string} prevAction The data-action for the 'previous' button.
     * @param {string} nextAction The data-action for the 'next' button.
     * @param {function} t The translation function.
     * @returns {string} The HTML for the pagination component.
     */
    const renderPaginationControls = (currentPage, totalPages, totalItems, prevAction, nextAction, t) => {
        const ITEMS_PER_PAGE = 20;
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const showingFrom = totalItems > 0 ? startIndex + 1 : 0;
        const showingTo = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);

        return `<nav class="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-4 py-3 sm:px-6"><div class="hidden sm:block"><p class="text-sm text-gray-700 dark:text-gray-400">${t('paginationResults', { from: showingFrom, to: showingTo, total: totalItems })}</p></div><div class="flex-1 flex justify-between sm:justify-end gap-2"><button data-action="${prevAction}" class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed" ${currentPage <= 1 ? 'disabled' : ''}>${t('paginationPrevious')}</button><button data-action="${nextAction}" class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed" ${currentPage >= totalPages ? 'disabled' : ''}>${t('paginationNext')}</button></div></nav>`;
    };
    
    /**
     * Renders an SVG pie chart for opponent distribution.
     * @param {Object.<string, number>} opponentDistribution - A map of class names to game counts.
     * @param {number} totalGamesCount - The total number of games to calculate percentages from.
     * @param {string|null} filterClass - The currently filtered class, for highlighting.
     * @returns {string} The HTML for the SVG pie chart.
     */
    const renderPieChart = (opponentDistribution, totalGamesCount, filterClass) => {
        if (totalGamesCount === 0) return `<div class="w-full max-w-[240px] h-[240px] flex items-center justify-center text-gray-400">${t('na')}</div>`;
        const radius = 108, strokeWidth = 30, circumference = 2 * Math.PI * radius, gapSize = circumference * 0.005; // Slightly smaller radius to prevent clipping on highlight scale
        let offset = 0;
        const segments = CLASSES.map(cls => {
            const count = opponentDistribution[cls] || 0;
            if (count === 0) return '';
            const percentage = count / totalGamesCount;
            const arcLength = percentage * circumference;
            const isFiltered = filterClass && cls === filterClass;
            const isInactive = filterClass && !isFiltered;
            const style = `opacity: ${isInactive ? '0.4' : '1'}; transform: ${isFiltered ? 'scale(1.05)' : 'scale(1)'}; transform-origin: center;`;
            const segment = `<circle class="transition-all duration-300" cx="130" cy="130" r="${radius}" fill="transparent" stroke="${classStyles[cls].chart}" stroke-width="${strokeWidth}" stroke-dasharray="${arcLength - gapSize} ${circumference}" stroke-dashoffset="-${offset}" style="${style}"><title>${getTranslatedClassName(cls)}: ${count} ${t('games')}</title></circle>`;
            offset += arcLength;
            return segment;
        }).join('');
        return `<div class="relative flex-shrink-0 w-full max-w-[240px]"><svg width="100%" viewBox="0 0 260 260" class="-rotate-90">${segments}</svg><div class="absolute inset-0 flex items-center justify-center pointer-events-none"><div class="text-center"><p class="text-4xl font-bold text-gray-800 dark:text-gray-100">${stats.total}</p><p class="text-sm text-gray-500 dark:text-gray-400">${t('games')}</p></div></div></div>`;
    };

    /**
     * Renders an SVG bar chart for win rates against each opponent class.
     * @param {Object.<string, string>} winRateByClass - A map of class names to win rate strings (e.g., "50.0%").
     * @param {string|null} filterClass - The currently filtered class, for highlighting.
     * @returns {string} The HTML for the SVG bar chart.
     */
    const renderBarChart = (winRateByClass, filterClass) => {
        if (filteredDeckGamesCount === 0 || Object.values(winRateByClass).every(wr => wr === t('na'))) {
            return `<div class="w-full h-[240px] flex items-center justify-center text-gray-400">${t('na')}</div>`;
        }
    
        const width = 400; const height = 240;
        const margin = { top: 20, right: 10, bottom: 15, left: 35 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;
    
        const yAxisLabels = [0, 25, 50, 75, 100];
        const yAxisHTML = yAxisLabels.map(label => {
            const isFiftyPercentLine = label === 50;
            const lineStrokeColor = isFiftyPercentLine ? (document.documentElement.classList.contains('dark') ? '#9ca3af' : '#9ca3af') : (document.documentElement.classList.contains('dark') ? '#4b5563' : '#e5e7eb');
            return `<g transform="translate(0, ${margin.top + chartHeight - (label / 100) * chartHeight})"><line x1="${margin.left}" x2="${margin.left + chartWidth}" stroke="${lineStrokeColor}" stroke-width="1" ${isFiftyPercentLine ? 'stroke-dasharray="2 2"' : ''}></line><text x="${margin.left - 8}" y="4" text-anchor="end" font-size="12" class="fill-gray-500 dark:fill-gray-400">${label}%</text></g>`;
        }).join('');
    
        const barWidth = chartWidth / CLASSES.length;
        const barsHTML = CLASSES.map((cls, i) => {
            const wrString = winRateByClass[cls];
            if (wrString === t('na')) return '';
            const wr = parseFloat(wrString);
            const barHeight = (wr / 100) * chartHeight;
            const isInactive = filterClass && filterClass !== cls;
            const style = `opacity: ${isInactive ? '0.4' : '1'};`;
            return `<g class="transition-all duration-300" transform="translate(${margin.left + i * barWidth}, 0)"><rect x="${barWidth * 0.15}" y="${margin.top + chartHeight - barHeight}" width="${barWidth * 0.7}" height="${barHeight}" rx="2" fill="${classStyles[cls].chart}" style="${style}"><title>${getTranslatedClassName(cls)}: ${wrString}</title></rect></g>`;
        }).join('');
    
        return `<div class="relative w-full" aria-label="${t('barChartTitle')}"><svg width="100%" viewBox="0 0 ${width} ${height}" style="aspect-ratio: ${width} / ${height}; max-height: 240px;"><title>${t('barChartTitle')}</title>${yAxisHTML}${barsHTML}</svg></div>`;
    };
    
    /**
     * Renders an SVG histogram for wins distribution in Take Two mode.
     * @param {number[]} winDistribution - An array where the index is the number of wins and the value is the count.
     * @returns {string} The HTML for the SVG histogram chart.
     */
    const renderHistogramChart = (winDistribution) => {
        const totalRunsValue = winDistribution.reduce((a, b) => a + b, 0);
        if (totalRunsValue === 0) {
            return `<div class="w-full h-[240px] flex items-center justify-center text-gray-400">${t('na')}</div>`;
        }

        const width = 400; const height = 240;
        const margin = { top: 20, right: 10, bottom: 25, left: 35 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        const maxCount = Math.max(0, ...winDistribution);
        const numTicks = 4; // Create 4 intervals, so 5 lines including base
        
        // Calculate a 'nice' upper bound for the Y axis that's a multiple of numTicks
        const yAxisMax = maxCount > 0 ? Math.ceil(maxCount / numTicks) * numTicks : numTicks;
        
        const yAxisHTML = Array.from({ length: numTicks + 1 }).map((_, i) => {
            const labelValue = (i * yAxisMax) / numTicks;
            const yPos = margin.top + chartHeight - (i / numTicks) * chartHeight;
            
            return `<g transform="translate(0, ${yPos})">
                <line x1="${margin.left}" x2="${margin.left + chartWidth}" stroke="${document.documentElement.classList.contains('dark') ? '#4b5563' : '#e5e7eb'}" stroke-width="1"></line>
                <text x="${margin.left - 8}" y="4" text-anchor="end" font-size="12" class="fill-gray-500 dark:fill-gray-400">${Math.round(labelValue)}</text>
            </g>`;
        }).join('');
        
        const barWidth = chartWidth / 8; // For 8 bars (0-7 wins)
        const barsHTML = winDistribution.map((count, i) => {
            if (count === 0) return '';
            const barHeight = yAxisMax > 0 ? (count / yAxisMax) * chartHeight : 0;
            return `<g class="transition-all duration-300" transform="translate(${margin.left + i * barWidth}, 0)">
                <rect x="${barWidth * 0.1}" y="${margin.top + chartHeight - barHeight}" width="${barWidth * 0.8}" height="${barHeight}" rx="2" fill="#93c5fd"><title>${i} ${t('wins')}: ${count}</title></rect>
            </g>`;
        }).join('');

        const xAxisLabelsHTML = winDistribution.map((_, i) =>
            `<text x="${margin.left + i * barWidth + barWidth / 2}" y="${margin.top + chartHeight + 15}" text-anchor="middle" font-size="12" class="fill-gray-500 dark:fill-gray-400">${i}</text>`
        ).join('');
        
        return `<div class="relative w-full" aria-label="${t('winsHistogramTitle')}">
            <svg width="100%" viewBox="0 0 ${width} ${height}" style="aspect-ratio: ${width} / ${height}; max-height: 240px;">
                <title>${t('winsHistogramTitle')}</title>
                ${yAxisHTML}
                ${barsHTML}
                ${xAxisLabelsHTML}
            </svg>
        </div>`;
    };

    /**
     * Renders the chart container, which includes a title and the chart itself.
     * The type of chart is determined by the current state.
     * @returns {string} The HTML for the chart container.
     */
    const renderChartContainer = () => {
        const isTakeTwo = state.mode === 'takeTwo';
        const chartTitle = chartType === 'bar' ? t('barChartTitle') : (isTakeTwo && chartType === 'histogram' ? t('winsHistogramTitle') : t('pieChartTitle'));
        const chartHTML = chartType === 'bar' ? renderBarChart(winRateByClass, filterClass) : (isTakeTwo && chartType === 'histogram' ? renderHistogramChart(winDistribution) : renderPieChart(totalStatsForPie.opponentDistribution, filteredDeckGamesCount, filterClass));
        const wrapperClasses = chartType === 'pie' ? 'inline-block' : 'w-full';
        return `<div class="text-center ${wrapperClasses}"><h4 class="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">${chartTitle}</h4><div data-action="toggle-chart-type" role="button" tabindex="0" aria-label="${t('toggleChartType')}" class="cursor-pointer p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">${chartHTML}</div></div>`;
    };

    // --- HTML Generation for view sections ---

    // Opponent breakdown list
    const opponentBreakdownHTML = CLASSES.map(cls => {
        const count = totalStatsForPie.opponentDistribution[cls] || 0;
        if (count === 0 && filteredDeckGamesCount > 0) return '';
        const percentage = filteredDeckGamesCount > 0 ? ((count / filteredDeckGamesCount) * 100).toFixed(1) : '0.0';
        const style = classStyles[cls], winRate = winRateByClass[cls], isFiltered = filterClass === cls;
        return `<button data-action="filter-stats" data-class="${cls}" class="grid grid-cols-4 w-full text-left p-2 rounded-md items-center transition-all duration-200 ${isFiltered ? `bg-blue-100 dark:bg-blue-900/40 ring-1 ring-blue-400 shadow-sm` : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}"><span class="flex items-center gap-3 col-span-2 truncate"><span class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: ${style.chart}"></span><span class="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">${getTranslatedClassName(cls)}</span></span><span class="text-sm text-gray-600 dark:text-gray-400 text-center col-span-1"><span class="font-semibold text-gray-800 dark:text-gray-100">${percentage}%</span></span><span class="text-sm text-gray-600 dark:text-gray-400 text-right col-span-1"><span class="font-semibold text-gray-800 dark:text-gray-100">${winRate}</span></span></button>`;
    }).join('');

    const tagsById = Object.fromEntries(state.tags.map(t => [t.id, t]));

    // Paginated match history list
    const recentMatchesHTML = paginatedGames.map(game => {
        const opponentStyle = classStyles[game.opponentClass];
        const resultStyle = game.result === 'Win' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
        
        const deckName = (isAllDecksView || deckId.startsWith('all-')) ? (deckList.find(d => d.id === game.originalDeckId)?.name || 'Unknown') : '';
        const deckInfoHTML = (isAllDecksView || deckId.startsWith('all-'))
            ? `<div class="flex-grow text-left min-w-0"><span class="inline-block max-w-full px-2 py-1 text-xs font-semibold rounded-full truncate ${classStyles[game.originalDeckClass].bg} ${classStyles[game.originalDeckClass].text}" title="${deckName}">${deckName}</span></div>`
            : '<div class="flex-grow"></div>';

        return `<li class="p-3" data-game-id="${game.id}" data-deck-id="${game.originalDeckId || deckId}">
            <div class="flex items-center gap-2">
                <div class="flex items-center gap-3 flex-shrink-0">
                    <span class="w-14 flex-shrink-0 text-center px-2 py-1 text-xs font-semibold rounded-full ${opponentStyle.bg} ${opponentStyle.text}" title="${getTranslatedClassName(game.opponentClass)}">${getShortClassName(game.opponentClass)}</span>
                    <div>
                        <p class="font-semibold ${resultStyle} truncate">${getTranslated(RESULT_NAMES, game.result)}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 truncate">${t('wentTurn', {turn: getTranslated(TURN_NAMES, game.turn)})}</p>
                    </div>
                </div>
                ${deckInfoHTML}
                <div class="flex items-center gap-1 flex-shrink-0">
                    <button data-action="open-match-info-modal" aria-label="${t('matchInfo')}" title="${t('matchInfo')}" class="p-1.5 text-gray-400 dark:text-gray-500 rounded-full hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/50 dark:hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg></button>
                    <button data-action="open-delete-match-modal" aria-label="${t('matchAriaDelete')}" title="${t('delete')}" class="p-1.5 text-gray-400 dark:text-gray-500 rounded-full hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" /></svg></button>
                </div>
            </div>
        </li>`;
    }).join('');

    // Paginated result history list (for Take Two)
    const recentResultsHTML = (paginatedRuns || []).map(run => {
        const runClass = run.originalDeckClass || displayDeck.class;
        const style = classStyles[runClass];
        const runDeckId = run.originalDeckId || displayDeck.id;

        return `<li class="p-3" data-run-id="${run.id}" data-deck-id="${runDeckId}">
            <div class="flex items-center gap-2">
                <div class="flex items-center gap-3 flex-shrink-0">
                    <span class="w-14 flex-shrink-0 text-center px-2 py-1 text-xs font-semibold rounded-full ${style.bg} ${style.text}" title="${getTranslatedClassName(runClass)}">${getShortClassName(runClass)}</span>
                    <div>
                        <p class="font-semibold text-gray-800 dark:text-gray-100 truncate">${run.wins} - ${run.losses}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 truncate">${new Date(run.timestamp).toLocaleDateString(state.language === 'ja' ? 'ja-JP' : undefined, { month: 'short', day: 'numeric' })}</p>
                    </div>
                </div>
                <div class="flex-grow"></div>
                <div class="flex items-center gap-1 flex-shrink-0">
                    <button data-action="open-delete-result-modal" aria-label="${t('delete')}" title="${t('delete')}" class="p-1.5 text-gray-400 dark:text-gray-500 rounded-full hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" /></svg>
                    </button>
                </div>
            </div>
        </li>`;
    }).join('');

    const matchHistoryPaginationHTML = renderPaginationControls(matchHistoryCurrentPage, totalGamePages, totalGames, 'prev-match-page', 'next-match-page', t);
    const resultHistoryPaginationHTML = renderPaginationControls(resultHistoryCurrentPage, totalRunPages, totalRuns, 'prev-result-page', 'next-result-page', t);
    
    // Top-level stats summary
    const takeTwoStatsHTML = state.mode === 'takeTwo' ? `<div class="md:contents"><p class="text-sm text-gray-500 dark:text-gray-400 md:text-right md:font-semibold md:self-center">${t('averageWins')}</p><div><p class="text-lg font-bold text-gray-800 dark:text-gray-100">${averageWins}</p><p class="text-xs text-gray-400 dark:text-gray-500">${t('wins')}</p></div></div>` : '';
    const statsLayoutHTML = `<div class="flex flex-wrap justify-around items-start text-center gap-y-4 md:grid md:grid-cols-[max-content,auto] md:gap-x-4 md:gap-y-3 md:text-left"><div class="md:contents"><p class="text-sm text-gray-500 dark:text-gray-400 md:text-right md:font-semibold md:self-center">${t('winRate')}</p><div><p class="text-lg font-bold text-gray-800 dark:text-gray-100">${stats.winRate}</p><p class="text-xs text-gray-400 dark:text-gray-500">${stats.wins}${t('winsShort')} / ${stats.losses}${t('lossesShort')}</p></div></div><div class="md:contents"><p class="text-sm text-gray-500 dark:text-gray-400 md:text-right md:font-semibold md:self-center">${t('firstWinRate')}</p><div><p class="text-lg font-semibold text-gray-800 dark:text-gray-100">${stats.firstTurnWinRate}</p><p class="text-xs text-gray-400 dark:text-gray-500">${stats.firstTurnTotal > 0 ? `${stats.firstTurnWins}${t('winsShort')} / ${stats.firstTurnTotal}${t('gamesShort')}` : t('na')}</p></div></div><div class="md:contents"><p class="text-sm text-gray-500 dark:text-gray-400 md:text-right md:font-semibold md:self-center">${t('secondWinRate')}</p><div><p class="text-lg font-semibold text-gray-800 dark:text-gray-100">${stats.secondTurnWinRate}</p><p class="text-xs text-gray-400 dark:text-gray-500">${stats.secondTurnTotal > 0 ? `${stats.secondTurnWins}${t('winsShort')} / ${stats.secondTurnTotal}${t('gamesShort')}` : t('na')}</p></div></div><div class="md:contents"><p class="text-sm text-gray-500 dark:text-gray-400 md:text-right md:font-semibold md:self-center">${t('longestStreak')}</p><div><p class="text-lg font-bold text-gray-800 dark:text-gray-100">${stats.longestStreak}</p><p class="text-xs text-gray-400 dark:text-gray-500">${t('wins')}</p></div></div>${takeTwoStatsHTML}</div>`;

    const tagFilterCount = tagFilter ? (tagFilter.my.include.length + tagFilter.my.exclude.length + tagFilter.opp.include.length + tagFilter.opp.exclude.length) : 0;
    
    // Display for active filters
    const filtersActiveHTML = () => {
        const filters = [];
        if (filterClass) filters.push(t('filterOpponent', {name: `<span class="font-semibold ${classStyles[filterClass].text}">${getTranslatedClassName(filterClass)}</span>`}));
        if (dateFilter.start || dateFilter.end) filters.push(`<button id="stats-date-filter-text" type="button" data-action="toggle-date-filter" class="hover:underline">${t('filterPeriod', {start: `<span class="font-semibold text-gray-700 dark:text-gray-300">${dateFilter.start || '...'}</span>`, end: `<span class="font-semibold text-gray-700 dark:text-gray-300">${dateFilter.end || '...'}</span>`})}</button>`);
        if (tagFilterCount > 0) filters.push(`<button data-action="open-tag-filter-modal" class="hover:underline">${t('tagFiltersActive', {count: tagFilterCount})}</button>`);
        if (filters.length === 0) return '';
        return `<div class="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">${filters.join(' &bull; ')}</div>`;
    };

    const availableDecks = state.mode === 'takeTwo' ? state.takeTwoDecks : state.decks;
    const isNormalMode = state.mode === 'normal';
    const allText = isNormalMode ? t('allDecks') : t('allClasses');
    
    const chevronIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>`;
    // The right-hand column containing match/result history
    const secondColumnHTML = `
        <div>
            ${(state.mode === 'takeTwo') ? `
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <button data-action="toggle-result-history" class="w-full flex justify-between items-center text-left text-lg font-semibold text-gray-700 dark:text-gray-200 px-6 py-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                        <span>${t('resultHistory')}</span>
                        <span class="transition-transform duration-200 ${state.resultHistoryCollapsed ? '' : 'rotate-180'}">${chevronIcon}</span>
                    </button>
                    <div class="${state.resultHistoryCollapsed ? 'hidden' : ''}">
                        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mx-6 mb-3">
                            <ul id="recent-results-list" class="divide-y divide-gray-100 dark:divide-gray-700">${recentResultsHTML || `<li class="p-4 text-center text-gray-500 dark:text-gray-400">${t('noMatchesFilter')}</li>`}</ul>
                        </div>
                        ${resultHistoryPaginationHTML}
                    </div>
                </div>
            ` : ''}

            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md ${(state.mode === 'takeTwo') ? 'mt-8' : ''}">
                <button data-action="toggle-match-history" class="w-full flex justify-between items-center text-left text-lg font-semibold text-gray-700 dark:text-gray-200 px-6 py-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                    <span>${t('matchHistory')} ${filterClass ? t('vs', {name: getTranslatedClassName(filterClass)}): ''}</span>
                    <span class="transition-transform duration-200 ${state.matchHistoryCollapsed ? '' : 'rotate-180'}">${chevronIcon}</span>
                </button>
                <div class="${state.matchHistoryCollapsed ? 'hidden' : ''}">
                     <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mx-6 mb-3">
                        <ul id="recent-matches-list" class="divide-y divide-gray-100 dark:divide-gray-700">${recentMatchesHTML || `<li class="p-4 text-center text-gray-500 dark:text-gray-400">${t('noMatchesFilter')}</li>`}</ul>
                    </div>
                    ${matchHistoryPaginationHTML}
                </div>
            </div>
        </div>
    `;

    // --- Final assembly of the entire stats view ---
    appContainer.innerHTML = `<main class="w-full max-w-7xl mx-auto"><div class="relative"><div class="flex justify-between items-center gap-2"><div class="flex items-center gap-2 min-w-0"><button data-action="back-to-decks" class="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"><svg class="w-4 h-4 pointer-events-none" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>${t('back')}</button><div class="relative flex-1 min-w-0 ml-2"><button data-action="toggle-deck-switcher" id="deck-switcher-btn" class="flex w-full items-center gap-2 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors"><h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100 truncate" title="${displayDeck.name}">${t('statsFor', {name: `<span class="${classStyles[displayDeck.class].text}">${displayDeck.name}</span>`})}</h2><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform flex-shrink-0 ${statsDeckSwitcherVisible ? 'rotate-180' : ''}" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" /></svg></button><div id="deck-switcher-dropdown" class="${statsDeckSwitcherVisible ? '' : 'hidden'} absolute top-full left-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 z-20 overflow-hidden"><ul class="max-h-80 overflow-y-auto"><li><button data-action="switch-stats-deck" data-deck-id="all" class="w-full text-left px-4 py-3 text-sm font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors ${isAllDecksView ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}">${allText}</button></li>${isNormalMode ? CLASSES.map(cls => { const isSelected = deckId === `all-${cls}`; const translatedClassName = getTranslatedClassName(cls); const coloredTranslatedClassName = `<span class="${classStyles[cls].text}">${translatedClassName}</span>`; return `<li><button data-action="switch-stats-deck" data-deck-id="all-${cls}" class="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors ${isSelected ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-700 dark:text-gray-300'}">${t('allClassDecks', {class: coloredTranslatedClassName})}</button></li>`; }).join('') : ''}${isNormalMode && availableDecks.length > 0 ? `<li class="border-t border-gray-200 dark:border-gray-700"></li>` : ''}${availableDecks.map(d => `<li><button data-action="switch-stats-deck" data-deck-id="${d.id}" class="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors ${d.id === deckId ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-700 dark:text-gray-300'}">${d.name} <span class="text-xs ${classStyles[d.class].text}">(${getTranslatedClassName(d.class)})</span></button></li>`).join('')}</ul></div></div></div><div class="flex items-center gap-2 flex-shrink-0"><button data-action="open-tag-filter-modal" id="toggle-tag-filter-btn" title="${t('filterByTags')}" class="p-2 rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 8 0 013 8v-5z" /></svg></button><div class="relative"><button data-action="toggle-date-filter" id="toggle-date-filter-btn" title="${t('toggleDateFilter')}" class="p-2 rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></button><div id="date-filter-card" class="${dateFilterVisible ? '' : 'hidden'} absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 z-20 p-4"><p class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">${t('toggleDateFilter')}</p><form id="date-filter-form" class="space-y-3"><div><label for="start-date" class="block text-xs font-medium text-gray-600 dark:text-gray-400">${t('from')}</label><input type="date" id="start-date" name="start-date" value="${dateFilter.start || ''}" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white text-black"></div><div><label for="end-date" class="block text-xs font-medium text-gray-600 dark:text-gray-400">${t('to')}</label><input type="date" id="end-date" name="end-date" value="${dateFilter.end || ''}" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white text-black"></div><div class="flex items-center justify-end gap-2 pt-2"><button type="button" data-action="clear-date-filter" id="clear-date-filter-btn" class="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400">${t('clear')}</button><button type="submit" class="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">${t('apply')}</button></div></form></div></div></div></div><div class="mt-1 min-h-[1.25rem]">${filtersActiveHTML()}</div></div>${(filteredDeckGamesCount === 0 && totalRuns === 0) ? `<div class="text-center bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-dashed border-gray-300 dark:border-gray-600 p-12 mt-1"><h3 class="text-sm font-medium text-gray-900 dark:text-gray-200">${t('noGames')}</h3><p class="mt-1 text-sm text-gray-500 dark:text-gray-400">${t('noGamesHint')}</p></div>` : `<div class="mt-1 grid grid-cols-1 xl:grid-cols-2 gap-8 items-start"><div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"><div class="flex flex-col md:flex-row items-center justify-around gap-6"><div class="flex-shrink-0 w-full md:w-60">${statsLayoutHTML}</div><div class="flex-grow flex justify-center">${renderChartContainer()}</div></div><div class="mt-6"><div class="flex justify-end items-center mb-2 h-5">${filterClass ? `<button data-action="clear-class-filter" class="text-xs text-blue-500 hover:underline">${t('showAllClasses')}</button>` : ''}</div><div class="grid grid-cols-4 text-xs text-gray-500 dark:text-gray-400 font-medium px-2 pb-1 border-b dark:border-gray-700"><span class="col-span-2">${t('opponent')}</span><span class="text-center col-span-1">${t('playRate')}</span><span class="text-right col-span-1">${t('winRate')}</span></div><div class="space-y-1 mt-2">${opponentBreakdownHTML}</div></div></div>${secondColumnHTML}</div>`}</main>`;
};