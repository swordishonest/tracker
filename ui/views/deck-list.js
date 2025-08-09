/**
 * @fileoverview This file is responsible for rendering the main deck list view.
 * It displays all user-created decks (or Take Two class decks) as interactive cards.
 * It also includes the main header with global actions like theme/language switching.
 */


import { state, classStyles, getTranslatedClassName } from '../../store.js';
import { t } from '../helpers.js';

const appContainer = document.getElementById('app');

/**
 * Renders the deck list view into the main application container.
 * This function builds the HTML for the header, action buttons, and all deck cards
 * based on the current application `state`.
 */
export const renderDeckList = () => {
    const decks = state.mode === 'takeTwo' ? state.takeTwoDecks : state.decks;
    const isTakeTwoMode = state.mode === 'takeTwo';
    let contentHTML;
    
    // Handle the case where there are no decks in Normal mode.
    if (decks.length === 0 && !isTakeTwoMode) {
        contentHTML = `
            <div class="text-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12">
                <h3 class="text-sm font-medium text-gray-900 dark:text-gray-200">${t('noDecks')}</h3>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">${t('noDecksHint')}</p>
            </div>
        `;
    } else {
        // Map over the decks array to create an HTML string for each deck card.
        const deckCardsHTML = decks.map(deck => {
            const wins = deck.games.filter(g => g.result === 'Win').length;
            const losses = deck.games.filter(g => g.result === 'Loss').length;
            const style = classStyles[deck.class];
            
            const lastGame = deck.games.length > 0 ? [...deck.games].sort((a, b) => b.timestamp - a.timestamp)[0] : null;
            const lastPlayedDate = lastGame ? new Date(lastGame.timestamp).toLocaleDateString(state.language === 'ja' ? 'ja-JP' : undefined, { month: 'short', day: 'numeric' }) : null;

            const isEditing = state.view.type === 'list' && state.view.editingDeckId === deck.id;

            // Conditionally render an input field for editing the deck name, or just the name.
            // Editing is disabled for Take Two mode.
            const nameSectionHTML = isEditing && !isTakeTwoMode ? `
                <div class="flex gap-2 items-center mb-1">
                    <input 
                        type="text" 
                        value="${deck.name}" 
                        data-deck-id="${deck.id}"
                        aria-label="Deck name"
                        class="flex-grow w-full px-2 py-1 text-lg font-bold border border-blue-400 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100 truncate" title="${deck.name}">${deck.name}</h3>
                        ${!isTakeTwoMode ? `
                        <button data-action="edit-deck" data-deck-id="${deck.id}" aria-label="${t('renameDeck', {name: deck.name})}" class="p-1.5 text-gray-400 dark:text-gray-500 rounded-full hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                        </button>
                        ` : ''}
                    </div>
                    <span class="flex-shrink-0 ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${style.bg} ${style.text}">${getTranslatedClassName(deck.class)}</span>
                </div>
            `;
            
            const notesIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
    <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
</svg>`;
            
            const deleteIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" /></svg>`;

            const deleteButtonTitle = isTakeTwoMode ? t('reset') : t('delete');
            const deleteButtonAriaLabel = isTakeTwoMode ? t('resetClassAria', {name: deck.name}) : t('deckAriaDelete', {name: deck.name});

            // The action bar at the bottom of the card.
            const actionBarHTML = `
               <div class="mt-4 border-t border-gray-200 dark:border-gray-700 pt-3 flex items-center justify-between">
                   <div class="flex gap-2">
                       <button data-action="add_game" data-deck-id="${deck.id}" class="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">${t('addGame')}</button>
                       <button data-action="stats" data-deck-id="${deck.id}" class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400">${t('stats')}</button>
                   </div>
                    <div class="flex items-center gap-1">
                       <button data-action="open-notes-modal" data-deck-id="${deck.id}" aria-label="${t('notesFor', {name: deck.name})}" title="${t('notes')}" class="relative p-2 text-gray-400 dark:text-gray-500 rounded-full hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                           ${notesIcon}
                       </button>
                       <button data-action="open-delete-deck-modal" data-deck-id="${deck.id}" aria-label="${deleteButtonAriaLabel}" title="${deleteButtonTitle}" class="p-2 text-gray-400 dark:text-gray-500 rounded-full hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                           ${deleteIcon}
                       </button>
                   </div>
               </div>
            `;

            return `
                <div class="w-full sm:w-80 bg-white dark:bg-gray-800 rounded-lg shadow-md border-l-4 ${style.border} p-4 flex flex-col justify-between transition-all hover:shadow-xl hover:-translate-y-px dark:hover:shadow-lg dark:hover:shadow-blue-500/10">
                    <div class="flex-grow">
                        ${nameSectionHTML}
                        <div class="mt-3 flex justify-between items-baseline text-sm">
                            <div class="flex items-baseline gap-4">
                                <p><span class="font-bold text-lg text-green-600">${wins}</span> <span class="text-gray-500 dark:text-gray-400">${t('wins')}</span></p>
                                <p><span class="font-bold text-lg text-red-600">${losses}</span> <span class="text-gray-500 dark:text-gray-400">${t('losses')}</span></p>
                            </div>
                            ${lastPlayedDate ? `<p class="text-xs text-gray-400 dark:text-gray-500">${lastPlayedDate}</p>` : ''}
                        </div>
                    </div>
                    ${actionBarHTML}
                </div>
            `;
        }).join('');
        contentHTML = `<div class="flex flex-wrap justify-center gap-5">${deckCardsHTML}</div>`;
    }
    
    // --- Header and Global Actions ---
    const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>`;
    const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>`;

    const hasAnyData = state.decks.length > 0 || state.takeTwoDecks.some(d => d.games.length > 0 || (d.runs && d.runs.length > 0)) || state.tags.length > 0;
    
    const primaryActionHTML = isTakeTwoMode ? `
        <button data-action="open-add-result-modal" class="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-transform transform hover:scale-105">
            ${t('addResult')}
        </button>
    ` : `
        <button data-action="open-add-deck-modal" class="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-transform transform hover:scale-105">
            ${t('addNewDeck')}
        </button>
    `;

    // Final assembly of the entire view's HTML.
    appContainer.innerHTML = `
        <main class="w-full max-w-7xl mx-auto">
            <div class="bg-white dark:bg-gray-800 dark:border dark:border-gray-700/50 rounded-xl shadow-lg p-6 md:p-10">
                <h1 class="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight text-center">${t('appName')}</h1>
                <div class="mt-6 flex items-center justify-center gap-2 flex-wrap">
                    <button data-action="toggle-theme" class="p-2 rounded-md text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500">
                       ${state.theme === 'dark' ? sunIcon : moonIcon}
                    </button>
                    <button data-action="toggle-lang" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400">
                        ${state.language === 'en' ? '日本語' : 'English'}
                    </button>
                    <button data-action="import-data" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400">
                        ${t('import')}
                    </button>
                    <button data-action="export-data" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50" ${!hasAnyData ? 'disabled' : ''}>
                        ${t('export')}
                    </button>
                    <button data-action="reset-all" class="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50 disabled:cursor-not-allowed" ${!hasAnyData ? 'disabled' : ''}>
                        ${t('resetAll')}
                    </button>
                    <button data-action="toggle-mode" class="px-4 py-2 text-sm font-medium text-purple-700 bg-purple-100 rounded-md hover:bg-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:hover:bg-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-400">
                        ${isTakeTwoMode ? t('normalMode') : t('takeTwoMode')}
                    </button>
                    ${primaryActionHTML}
                </div>
                <div class="mt-10">${contentHTML}</div>
                <p class="mt-8 text-center text-base text-gray-500 dark:text-gray-400">${t('appSubtitle')}</p>
            </div>
        </main>
    `;

    // After rendering, if a deck is being edited, focus the input field.
    if (state.view.type === 'list' && state.view.editingDeckId) {
        const input = appContainer.querySelector(`input[data-deck-id="${state.view.editingDeckId}"]`);
        if (input) {
            input.focus();
            input.select();
        }
    }
};
