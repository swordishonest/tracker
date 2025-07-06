



import { state, CLASSES, classStyles, CLASS_NAMES, TURN_NAMES, RESULT_NAMES, translations, setNewDeckClass } from './store.js';

// --- DOM CACHE ---
const appContainer = document.getElementById('app');
const addDeckModal = document.getElementById('add-deck-modal');
const deleteDeckConfirmModal = document.getElementById('delete-deck-confirm-modal');
const deleteMatchConfirmModal = document.getElementById('delete-match-confirm-modal');
const importConfirmModal = document.getElementById('import-confirm-modal');
const resetConfirmModal = document.getElementById('reset-confirm-modal');

// --- TRANSLATION HELPERS ---
const t = (key, replacements = {}) => {
    let text = (translations[state.language] && translations[state.language][key]) || translations.en[key] || `[${key}]`;
    for (const placeholder in replacements) {
        text = text.replace(`{${placeholder}}`, replacements[placeholder]);
    }
    return text;
};
const getTranslated = (type, key) => (type[state.language] && type[state.language][key]) || type.en[key] || key;
const getShortClassName = (cls) => {
    const translatedName = getTranslated(CLASS_NAMES, cls);
    if (state.language === 'ja') {
        if (translatedName === 'ビショップ') return 'ビショ';
        return translatedName.substring(0, 2);
    }
    return translatedName.substring(0, 2);
};

// --- THEME ---
export const setTheme = (theme) => {
    state.theme = theme;
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    // Re-render to update theme-dependent button icons etc.
    render(); 
};

// --- UI HELPERS & MODALS ---
export const checkDeckFormValidity = () => {
    const deckNameInput = document.getElementById('deckName');
    const saveDeckButton = document.getElementById('save-deck-button');
    if (!deckNameInput || !saveDeckButton) return;

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
        button.textContent = getTranslated(CLASS_NAMES, cls);
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

const renderModalClassSelector = () => {
    const modalClassSelectorContainer = document.getElementById('modal-class-selector-container');
    modalClassSelectorContainer.innerHTML = '';
    const selector = createClassSelector(state.newDeckClass, (cls) => {
        setNewDeckClass(cls);
        renderModalClassSelector(); // Re-render to show selection
        checkDeckFormValidity();
    });
    modalClassSelectorContainer.appendChild(selector);
};

export const openAddDeckModal = () => {
    document.getElementById('deckName').value = '';
    setNewDeckClass(null);
    renderModalClassSelector();
    checkDeckFormValidity();
    addDeckModal.classList.remove('hidden');
    addDeckModal.querySelector('div').classList.add('animate-fade-in-up');
};
export const closeAddDeckModal = () => {
    addDeckModal.classList.add('hidden');
    addDeckModal.querySelector('div').classList.remove('animate-fade-in-up');
};
export const openDeleteDeckModal = (deckId) => {
    state.deckToDeleteId = deckId;
    renderModals();
    deleteDeckConfirmModal.classList.remove('hidden');
    deleteDeckConfirmModal.querySelector('div').classList.add('animate-fade-in-up');
};
export const closeDeleteDeckModal = () => {
    state.deckToDeleteId = null;
    deleteDeckConfirmModal.classList.add('hidden');
    deleteDeckConfirmModal.querySelector('div').classList.remove('animate-fade-in-up');
};
export const openDeleteMatchModal = (deckId, gameId) => {
    state.matchToDelete = { deckId, gameId };
    deleteMatchConfirmModal.classList.remove('hidden');
    deleteMatchConfirmModal.querySelector('div').classList.add('animate-fade-in-up');
};
export const closeDeleteMatchModal = () => {
    state.matchToDelete = null;
    deleteMatchConfirmModal.classList.add('hidden');
    deleteMatchConfirmModal.querySelector('div').classList.remove('animate-fade-in-up');
};
export const openImportModal = () => {
    importConfirmModal.classList.remove('hidden');
    importConfirmModal.querySelector('div').classList.add('animate-fade-in-up');
};
export const closeImportModal = () => {
    state.fileToImport = null;
    document.getElementById('import-file-input').value = null;
    importConfirmModal.classList.add('hidden');
    importConfirmModal.querySelector('div').classList.remove('animate-fade-in-up');
};
export const openResetModal = () => {
    resetConfirmModal.classList.remove('hidden');
    resetConfirmModal.querySelector('div').classList.add('animate-fade-in-up');
};
export const closeResetModal = () => {
    resetConfirmModal.classList.add('hidden');
    resetConfirmModal.querySelector('div').classList.remove('animate-fade-in-up');
};


// --- VIEW RENDERERS ---
const renderDeckList = () => {
    const decks = state.decks;
    let contentHTML;
    
    if (decks.length === 0) {
        contentHTML = `
            <div class="text-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12">
                <h3 class="text-sm font-medium text-gray-900 dark:text-gray-200">${t('noDecks')}</h3>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">${t('noDecksHint')}</p>
            </div>
        `;
    } else {
        const deckCardsHTML = decks.map(deck => {
            const wins = deck.games.filter(g => g.result === 'Win').length;
            const losses = deck.games.filter(g => g.result === 'Loss').length;
            const style = classStyles[deck.class];
            
            const lastGame = deck.games.length > 0 ? [...deck.games].sort((a, b) => b.timestamp - a.timestamp)[0] : null;
            const lastPlayedDate = lastGame ? new Date(lastGame.timestamp).toLocaleDateString(state.language === 'ja' ? 'ja-JP' : undefined, { month: 'short', day: 'numeric' }) : null;

            const isEditing = state.view.type === 'list' && state.view.editingDeckId === deck.id;

            return `
                <div class="w-full sm:w-80 bg-white dark:bg-gray-800 rounded-lg shadow-md border-l-4 ${style.border} p-4 flex flex-col justify-between transition-all hover:shadow-xl hover:-translate-y-px dark:hover:shadow-lg dark:hover:shadow-blue-500/10">
                    <div class="flex-grow">
                        ${isEditing ? `
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
                                    <button data-action="edit-deck" data-deck-id="${deck.id}" aria-label="${t('renameDeck', {name: deck.name})}" class="p-1.5 text-gray-400 dark:text-gray-500 rounded-full hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 flex-shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                                    </button>
                                </div>
                                <span class="flex-shrink-0 ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${style.bg} ${style.text}">${getTranslated(CLASS_NAMES, deck.class)}</span>
                            </div>
                        `}
                        <div class="mt-3 flex justify-between items-baseline text-sm">
                            <div class="flex items-baseline gap-4">
                                <p><span class="font-bold text-lg text-green-600">${wins}</span> <span class="text-gray-500 dark:text-gray-400">${t('wins')}</span></p>
                                <p><span class="font-bold text-lg text-red-600">${losses}</span> <span class="text-gray-500 dark:text-gray-400">${t('losses')}</span></p>
                            </div>
                            ${lastPlayedDate ? `<p class="text-xs text-gray-400 dark:text-gray-500">${lastPlayedDate}</p>` : ''}
                        </div>
                    </div>
                    <div class="mt-4 border-t border-gray-200 dark:border-gray-700 pt-3 flex items-center justify-between">
                        <div class="flex gap-2">
                            <button data-action="add_game" data-deck-id="${deck.id}" class="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">${t('addGame')}</button>
                            <button data-action="stats" data-deck-id="${deck.id}" class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400">${t('stats')}</button>
                        </div>
                        <button data-action="open-delete-deck-modal" data-deck-id="${deck.id}" aria-label="${t('deckAriaDelete', {name: deck.name})}" class="p-2 text-gray-400 dark:text-gray-500 rounded-full hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        contentHTML = `<div class="flex flex-wrap justify-center gap-5">${deckCardsHTML}</div>`;
    }
    
    const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>`;
    const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>`;

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
                    <button data-action="export-data" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50" ${decks.length === 0 ? 'disabled' : ''}>
                        ${t('export')}
                    </button>
                    <button data-action="reset-all" class="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50 disabled:cursor-not-allowed" ${decks.length === 0 ? 'disabled' : ''}>
                        ${t('resetAll')}
                    </button>
                    <button data-action="open-add-deck-modal" class="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-transform transform hover:scale-105">
                        ${t('addNewDeck')}
                    </button>
                </div>
                <div class="mt-10">${contentHTML}</div>
                <p class="mt-8 text-center text-base text-gray-500 dark:text-gray-400">${t('appSubtitle')}</p>
            </div>
        </main>
    `;

    if (state.view.type === 'list' && state.view.editingDeckId) {
        const input = appContainer.querySelector(`input[data-deck-id="${state.view.editingDeckId}"]`);
        if (input) {
            input.focus();
            input.select();
        }
    }
};

const renderAddGameView = (deckId) => {
    const deck = state.decks.find(d => d.id === deckId);
    if (!deck) {
        // This case should be handled by the controller, e.g., switching view
        appContainer.innerHTML = `<p>Deck not found</p>`;
        return;
    }
    
    const titleWithPlaceholder = t('addGameTitle', { name: '%%DECK_NAME%%' });
    const [prefix, suffix] = titleWithPlaceholder.split('%%DECK_NAME%%');

    appContainer.innerHTML = `
        <main class="w-full max-w-2xl mx-auto">
            <div class="flex items-center justify-between gap-4 mb-4">
                <button data-action="back-to-decks" class="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    <svg class="w-4 h-4 pointer-events-none" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
                    ${t('back')}
                </button>
                <div class="flex-1 min-w-0 overflow-hidden">
                    <h2 class="flex items-baseline justify-end text-xl font-bold text-gray-800 dark:text-gray-100" title="${t('addGameTitle', { name: deck.name })}">
                        <span class="whitespace-nowrap">${prefix}</span>
                        <span class="ml-1 ${classStyles[deck.class].text} truncate">${deck.name}</span>
                        <span class="whitespace-nowrap">${suffix}</span>
                    </h2>
                </div>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
                <form id="add-game-form" class="space-y-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">${t('opponentClass')}</label>
                        <div id="game-class-selector-container"></div>
                    </div>
                    <div>
                        <span class="block text-sm font-medium text-gray-700 dark:text-gray-300">${t('turn')}</span>
                        <div id="turn-selector" class="mt-2 grid grid-cols-2 gap-4">
                            <button type="button" data-value="1st" class="w-full text-center px-4 py-3 font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 transform hover:-translate-y-px bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 ring-blue-500">${getTranslated(TURN_NAMES, '1st')}</button>
                            <button type="button" data-value="2nd" class="w-full text-center px-4 py-3 font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 transform hover:-translate-y-px bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 ring-blue-500">${getTranslated(TURN_NAMES, '2nd')}</button>
                        </div>
                    </div>
                    <div>
                        <span class="block text-sm font-medium text-gray-700 dark:text-gray-300">${t('result')}</span>
                        <div id="result-selector" class="mt-2 grid grid-cols-2 gap-4">
                            <button type="button" data-value="Win" class="w-full text-center px-4 py-3 font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 transform hover:-translate-y-px bg-green-100 text-green-800 hover:bg-green-200 ring-green-500">${getTranslated(RESULT_NAMES, 'Win')}</button>
                            <button type="button" data-value="Loss" class="w-full text-center px-4 py-3 font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 transform hover:-translate-y-px bg-red-100 text-red-800 hover:bg-red-200 ring-red-500">${getTranslated(RESULT_NAMES, 'Loss')}</button>
                        </div>
                    </div>
                    <div class="border-t border-gray-200 dark:border-gray-700 pt-5">
                         <button id="save-game-button" type="submit" disabled class="w-full px-4 py-3 font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 bg-gray-400 text-gray-100 cursor-not-allowed ring-gray-400">
                            ${t('saveGame')}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    `;

    // --- Post-render logic for this specific view ---
    const form = document.getElementById('add-game-form');
    let localState = { opponentClass: null, turn: null, result: null };

    const checkFormComplete = () => {
        const saveButton = document.getElementById('save-game-button');
        if (localState.opponentClass && localState.turn && localState.result) {
            saveButton.disabled = false;
            saveButton.className = 'w-full px-4 py-3 font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 bg-blue-600 text-white hover:bg-blue-700 ring-blue-500';
            form.dataset.opponentClass = localState.opponentClass;
            form.dataset.turn = localState.turn;
            form.dataset.result = localState.result;
        } else {
            saveButton.disabled = true;
            saveButton.className = 'w-full px-4 py-3 font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 bg-gray-400 text-gray-100 cursor-not-allowed ring-gray-400';
        }
    };
    
    const renderGameClassSelector = () => {
        const container = document.getElementById('game-class-selector-container');
        container.innerHTML = '';
        const selector = createClassSelector(localState.opponentClass, (cls) => {
            localState.opponentClass = cls;
            renderGameClassSelector();
            checkFormComplete();
        });
        container.appendChild(selector);
    };
    renderGameClassSelector();
    
    document.getElementById('turn-selector').addEventListener('click', e => {
        if (e.target.tagName === 'BUTTON') {
            localState.turn = e.target.dataset.value;
            document.querySelectorAll('#turn-selector button').forEach(btn => {
                const isSelected = btn.dataset.value === localState.turn;
                btn.setAttribute('aria-pressed', String(isSelected));
                btn.className = `w-full text-center px-4 py-3 font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 transform hover:-translate-y-px ${
                    isSelected ? 'bg-blue-600 text-white shadow-md ring-blue-500' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 ring-blue-500'
                }`;
            });
            checkFormComplete();
        }
    });
    
    document.getElementById('result-selector').addEventListener('click', e => {
        if (e.target.tagName === 'BUTTON') {
            localState.result = e.target.dataset.value;
            document.querySelectorAll('#result-selector button').forEach(btn => {
                const isSelected = btn.dataset.value === localState.result;
                btn.setAttribute('aria-pressed', String(isSelected));
                if (isSelected) {
                    const styleClass = localState.result === 'Win' ? 'bg-green-600 text-white shadow-md ring-green-500' : 'bg-red-600 text-white shadow-md ring-red-500';
                    btn.className = `w-full text-center px-4 py-3 font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 transform hover:-translate-y-px ${styleClass}`;
                } else {
                    const originalStyle = btn.dataset.value === 'Win' ? 'bg-green-100 text-green-800 hover:bg-green-200 ring-green-500' : 'bg-red-100 text-red-800 hover:bg-red-200 ring-red-500';
                    btn.className = `w-full text-center px-4 py-3 font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 transform hover:-translate-y-px ${originalStyle}`;
                }
            });
            checkFormComplete();
        }
    });
};

const renderStatsView = (deckId) => {
    const { filterClass, dateFilter, statsDeckSwitcherVisible, dateFilterVisible, chartType } = state.view;

    let displayDeck;
    let isAllDecksView = deckId === 'all';

    if (isAllDecksView) {
        const allGames = state.decks.flatMap(d => d.games.map(g => ({...g, originalDeckId: d.id, originalDeckClass: d.class})));
        displayDeck = { id: 'all', name: t('allDecks'), class: 'All', games: allGames };
    } else {
        displayDeck = state.decks.find(d => d.id === deckId);
    }

    if (!displayDeck) {
        appContainer.innerHTML = `<p>Deck not found</p>`;
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
        const formatRate = (wins, total) => total > 0 ? `${((wins / total) * 100).toFixed(1)}%` : t('na');
        return {
            total, wins, losses, winRate: formatRate(wins, total),
            firstTurnTotal: firstTurnGames.length, firstTurnWins, firstTurnWinRate: formatRate(firstTurnWins, firstTurnGames.length),
            secondTurnTotal: secondTurnGames.length, secondTurnWins, secondTurnWinRate: formatRate(secondTurnWins, secondTurnGames.length),
            opponentDistribution
        };
    };
    
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
            acc[cls] = t('na');
            return acc;
        }
        const winsVsClass = gamesVsClass.filter(g => g.result === 'Win').length;
        acc[cls] = `${((winsVsClass / gamesVsClass.length) * 100).toFixed(1)}%`;
        return acc;
    }, {});
    
    const renderPieChart = (opponentDistribution, totalGames, filterClass) => {
        if (totalGames === 0) return `<div class="w-full max-w-[240px] h-[240px] flex items-center justify-center text-gray-400">${t('na')}</div>`;
        const radius = 110, strokeWidth = 30, circumference = 2 * Math.PI * radius, gapSize = circumference * 0.005;
        let offset = 0;
        const segments = CLASSES.map(cls => {
            const count = opponentDistribution[cls] || 0;
            if (count === 0) return '';
            const percentage = count / totalGames;
            const arcLength = percentage * circumference;
            const isFiltered = filterClass && cls === filterClass;
            const isInactive = filterClass && !isFiltered;
            const style = `opacity: ${isInactive ? '0.4' : '1'}; transform: ${isFiltered ? 'scale(1.05)' : 'scale(1)'}; transform-origin: center;`;
            const segment = `<circle class="transition-all duration-300" cx="130" cy="130" r="${radius}" fill="transparent" stroke="${classStyles[cls].chart}" stroke-width="${strokeWidth}" stroke-dasharray="${arcLength - gapSize} ${circumference}" stroke-dashoffset="-${offset}" style="${style}"><title>${getTranslated(CLASS_NAMES, cls)}: ${count} ${t('games')}</title></circle>`;
            offset += arcLength;
            return segment;
        }).join('');
        return `<div class="relative flex-shrink-0 w-full max-w-[240px]"><svg width="100%" viewBox="0 0 260 260" class="-rotate-90">${segments}</svg><div class="absolute inset-0 flex items-center justify-center pointer-events-none"><div class="text-center"><p class="text-4xl font-bold text-gray-800 dark:text-gray-100">${stats.total}</p><p class="text-sm text-gray-500 dark:text-gray-400">${t('games')}</p></div></div></div>`;
    };

    const renderBarChart = (winRateByClass, filterClass) => {
        if (filteredDeckGames.length === 0 || Object.values(winRateByClass).every(wr => wr === t('na'))) {
            return `<div class="w-full h-[240px] flex items-center justify-center text-gray-400">${t('na')}</div>`;
        }
    
        const width = 400;
        const height = 240;
        const margin = { top: 20, right: 10, bottom: 15, left: 35 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;
    
        const yAxisLabels = [0, 25, 50, 75, 100];
        const yAxisHTML = yAxisLabels.map(label => {
            const isFiftyPercentLine = label === 50;
            const lineStrokeColor = isFiftyPercentLine
                ? (document.documentElement.classList.contains('dark') ? '#9ca3af' : '#9ca3af') // gray-400
                : (document.documentElement.classList.contains('dark') ? '#6b7280' : '#d1d5db'); // dark: gray-500, light: gray-300
    
            return `
                <g transform="translate(0, ${margin.top + chartHeight - (label / 100) * chartHeight})">
                    <line 
                        x1="${margin.left}" 
                        x2="${margin.left + chartWidth}" 
                        stroke="${lineStrokeColor}" 
                        stroke-width="1"
                        ${isFiftyPercentLine ? 'stroke-dasharray="2 2"' : ''}>
                    </line>
                    <text x="${margin.left - 8}" y="4" text-anchor="end" font-size="12" class="fill-gray-500 dark:fill-gray-400">${label}%</text>
                </g>
            `;
        }).join('');
    
        const barWidth = chartWidth / CLASSES.length;
        const barsHTML = CLASSES.map((cls, i) => {
            const wrString = winRateByClass[cls];
            if (wrString === t('na')) return '';
            
            const wr = parseFloat(wrString);
            const barHeight = (wr / 100) * chartHeight;
            const isInactive = filterClass && filterClass !== cls;
            const style = `opacity: ${isInactive ? '0.4' : '1'};`;
            
            return `
                <g class="transition-all duration-300" 
                   transform="translate(${margin.left + i * barWidth}, 0)">
                    <rect 
                        x="${barWidth * 0.15}" 
                        y="${margin.top + chartHeight - barHeight}" 
                        width="${barWidth * 0.7}" 
                        height="${barHeight}" 
                        fill="${classStyles[cls].chart}" 
                        rx="2"
                        style="${style}">
                        <title>${getTranslated(CLASS_NAMES, cls)}: ${wrString}</title>
                    </rect>
                </g>
            `;
        }).join('');
    
        return `<div class="relative w-full" aria-label="${t('barChartTitle')}">
            <svg width="100%" viewBox="0 0 ${width} ${height}" style="aspect-ratio: ${width} / ${height}; max-height: 240px;">
                <title>${t('barChartTitle')}</title>
                ${yAxisHTML}
                ${barsHTML}
            </svg>
        </div>`;
    };
    
    const renderChartContainer = () => {
        const chartTitle = chartType === 'bar' ? t('barChartTitle') : t('pieChartTitle');
        const chartHTML = chartType === 'bar' 
            ? renderBarChart(winRateByClass, filterClass)
            : renderPieChart(totalStatsForPie.opponentDistribution, filteredDeckGames.length, filterClass);

        const wrapperClasses = chartType === 'bar' ? 'w-full' : 'inline-block';

        return `
            <div class="text-center ${wrapperClasses}">
                <h4 class="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">${chartTitle}</h4>
                <div data-action="toggle-chart-type" role="button" tabindex="0" aria-label="${t('toggleChartType')}" class="cursor-pointer p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    ${chartHTML}
                </div>
            </div>
        `;
    };

    const opponentBreakdownHTML = CLASSES.map(cls => {
        const count = totalStatsForPie.opponentDistribution[cls] || 0;
        if (count === 0 && filteredDeckGames.length > 0) return '';
        const percentage = filteredDeckGames.length > 0 ? ((count / filteredDeckGames.length) * 100).toFixed(1) : '0.0';
        const style = classStyles[cls], winRate = winRateByClass[cls], isFiltered = filterClass === cls;
        return `<button data-action="filter-stats" data-class="${cls}" class="grid grid-cols-4 w-full text-left p-2 rounded-md items-center transition-all duration-200 ${isFiltered ? `bg-blue-100 dark:bg-blue-900/40 ring-1 ring-blue-400 shadow-sm` : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}"><span class="flex items-center gap-3 col-span-2 truncate"><span class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: ${style.chart}"></span><span class="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">${getTranslated(CLASS_NAMES, cls)}</span></span><span class="text-sm text-gray-600 dark:text-gray-400 text-center col-span-1"><span class="font-semibold text-gray-800 dark:text-gray-100">${percentage}%</span></span><span class="text-sm text-gray-600 dark:text-gray-400 text-right col-span-1"><span class="font-semibold text-gray-800 dark:text-gray-100">${winRate}</span></span></button>`;
    }).join('');

    const recentMatchesHTML = sortedGames.map(game => {
        const opponentStyle = classStyles[game.opponentClass];
        const resultStyle = game.result === 'Win' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
        const date = new Date(game.timestamp).toLocaleDateString(state.language === 'ja' ? 'ja-JP' : undefined, { month: 'short', day: 'numeric' });
        
        const deckForGame = isAllDecksView ? state.decks.find(d => d.id === game.originalDeckId) : null;
        const deckName = deckForGame ? deckForGame.name : 'Unknown';

        const deckInfoHTML = isAllDecksView 
            ? `<div class="flex-grow text-left px-2 min-w-0">
                   <span class="inline-block max-w-full px-2 py-1 text-xs font-semibold rounded-full truncate ${classStyles[game.originalDeckClass].bg} ${classStyles[game.originalDeckClass].text}" title="${deckName}">${deckName}</span>
               </div>`
            : '<div class="flex-grow"></div>';

        return `
            <li class="p-3" data-game-id="${game.id}" data-deck-id="${game.originalDeckId || deckId}">
                <div class="flex items-center gap-3">
                    
                    <!-- Left Section: Opponent Info (Fixed Width) -->
                    <div class="flex items-center gap-3 flex-shrink-0">
                        <span class="w-14 flex-shrink-0 text-center px-2 py-1 text-xs font-semibold rounded-full ${opponentStyle.bg} ${opponentStyle.text}" title="${getTranslated(CLASS_NAMES, game.opponentClass)}">
                            ${getShortClassName(game.opponentClass)}
                        </span>
                        <div class="w-16">
                            <p class="font-semibold ${resultStyle} truncate">${getTranslated(RESULT_NAMES, game.result)}</p>
                            <p class="text-xs text-gray-500 dark:text-gray-400 truncate">${t('wentTurn', {turn: getTranslated(TURN_NAMES, game.turn)})}</p>
                        </div>
                    </div>

                    <!-- Middle Section (Stretchy): Deck Name -->
                    ${deckInfoHTML}

                    <!-- Right Section: Date & Delete (Fixed Width) -->
                    <div class="flex items-center gap-2 flex-shrink-0">
                        <p class="text-sm text-gray-400 dark:text-gray-500 w-14 text-right">${date}</p>
                        <button data-action="delete-match" aria-label="${t('matchAriaDelete')}" class="p-1 text-gray-400 dark:text-gray-500 rounded-full hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" /></svg>
                        </button>
                    </div>
                </div>
            </li>
        `;
    }).join('');

    const statsLayoutHTML = `<div class="flex justify-around items-start text-center md:grid md:grid-cols-[max-content,auto] md:gap-x-4 md:gap-y-4 md:text-left"><div class="md:contents"><p class="text-sm text-gray-500 dark:text-gray-400 md:text-right md:font-semibold md:self-center">${t('winRate')}</p><div><p class="text-xl font-bold text-gray-800 dark:text-gray-100">${stats.winRate}</p><p class="text-xs text-gray-400 dark:text-gray-500">${stats.wins}${t('winsShort')} / ${stats.losses}${t('lossesShort')}</p></div></div><div class="md:contents"><p class="text-sm text-gray-500 dark:text-gray-400 md:text-right md:font-semibold md:self-center">${t('firstWinRate')}</p><div><p class="text-lg font-semibold text-gray-800 dark:text-gray-100">${stats.firstTurnWinRate}</p><p class="text-xs text-gray-400 dark:text-gray-500">${stats.firstTurnTotal > 0 ? `${stats.firstTurnWins}${t('winsShort')} / ${stats.firstTurnTotal}${t('gamesShort')}` : t('na')}</p></div></div><div class="md:contents"><p class="text-sm text-gray-500 dark:text-gray-400 md:text-right md:font-semibold md:self-center">${t('secondWinRate')}</p><div><p class="text-lg font-semibold text-gray-800 dark:text-gray-100">${stats.secondTurnWinRate}</p><p class="text-xs text-gray-400 dark:text-gray-500">${stats.secondTurnTotal > 0 ? `${stats.secondTurnWins}${t('winsShort')} / ${stats.secondTurnTotal}${t('gamesShort')}` : t('na')}</p></div></div></div>`;

    appContainer.innerHTML = `
        <main class="w-full max-w-7xl mx-auto"><div class="relative"><div class="flex justify-between items-center"><div class="flex items-center gap-2 min-w-0"><button data-action="back-to-decks" class="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"><svg class="w-4 h-4 pointer-events-none" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>${t('back')}</button><div class="relative flex-1 min-w-0 ml-2"><button data-action="toggle-deck-switcher" id="deck-switcher-btn" class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors w-full text-left"><h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100 truncate flex-1 min-w-0">${t('statsFor', {name: `<span class="${classStyles[displayDeck.class].text}">${displayDeck.name}</span>`})}</h2><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform flex-shrink-0 ${statsDeckSwitcherVisible ? 'rotate-180' : ''}" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" /></svg></button><div id="deck-switcher-dropdown" class="${statsDeckSwitcherVisible ? '' : 'hidden'} absolute top-full left-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 z-20 overflow-hidden"><ul class="max-h-60 overflow-y-auto"><li><button data-action="switch-stats-deck" data-deck-id="all" class="w-full text-left px-4 py-3 text-sm font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors ${isAllDecksView ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}">${t('allDecks')}</button></li>${state.decks.map(d => `<li><button data-action="switch-stats-deck" data-deck-id="${d.id}" class="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors ${d.id === deckId ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-700 dark:text-gray-300'}">${d.name} <span class="text-xs ${classStyles[d.class].text}">(${getTranslated(CLASS_NAMES, d.class)})</span></button></li>`).join('')}</ul></div></div></div><div class="relative"><button data-action="toggle-date-filter" id="toggle-date-filter-btn" class="p-2 rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></button><div id="date-filter-card" class="${dateFilterVisible ? '' : 'hidden'} absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 z-20 p-4"><p class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">${t('toggleDateFilter')}</p><form id="date-filter-form" class="space-y-3"><div><label for="start-date" class="block text-xs font-medium text-gray-600 dark:text-gray-400">${t('from')}</label><input type="date" id="start-date" name="start-date" value="${dateFilter.start || ''}" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white text-black"></div><div><label for="end-date" class="block text-xs font-medium text-gray-600 dark:text-gray-400">${t('to')}</label><input type="date" id="end-date" name="end-date" value="${dateFilter.end || ''}" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white text-black"></div><div class="flex items-center justify-end gap-2 pt-2"><button type="button" data-action="clear-date-filter" id="clear-date-filter-btn" class="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400">${t('clear')}</button><button type="submit" class="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">${t('apply')}</button></div></form></div></div></div><div class="mt-1 min-h-[1.25rem]">${filterClass || (dateFilter.start || dateFilter.end) ? `<div class="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">${filterClass ? `<p>${t('filterOpponent', {name: `<span class="font-semibold ${classStyles[filterClass].text}">${getTranslated(CLASS_NAMES, filterClass)}</span>`})}</p>` : ''}${dateFilter.start || dateFilter.end ? `<p>${t('filterPeriod', {start: `<span class="font-semibold text-gray-700 dark:text-gray-300">${dateFilter.start || '...'}</span>`, end: `<span class="font-semibold text-gray-700 dark:text-gray-300">${dateFilter.end || '...'}</span>`})}</p>` : ''}</div>` : ''}</div></div>${displayDeck.games.length === 0 ? `<div class="text-center bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-dashed border-gray-300 dark:border-gray-600 p-12 mt-1"><h3 class="text-sm font-medium text-gray-900 dark:text-gray-200">${t('noGames')}</h3><p class="mt-1 text-sm text-gray-500 dark:text-gray-400">${t('noGamesHint')}</p></div>` : `<div class="mt-1 grid grid-cols-1 xl:grid-cols-2 gap-8 items-start"><div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"><div class="flex flex-col md:flex-row items-center justify-around gap-6"><div class="flex-shrink-0 w-full md:w-60">${statsLayoutHTML}</div><div class="flex-grow flex justify-center">${renderChartContainer()}</div></div><div class="mt-6"><div class="flex justify-end items-center mb-2 h-5">${filterClass ? `<button data-action="clear-class-filter" class="text-xs text-blue-500 hover:underline">${t('showAllClasses')}</button>` : ''}</div><div class="grid grid-cols-4 text-xs text-gray-500 dark:text-gray-400 font-medium px-2 pb-1 border-b dark:border-gray-700"><span class="col-span-2">${t('opponent')}</span><span class="text-center col-span-1">${t('playRate')}</span><span class="text-right col-span-1">${t('winRate')}</span></div><div class="space-y-1 mt-2">${opponentBreakdownHTML}</div></div></div><div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"><h3 class="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">${t('matchHistory')} ${filterClass ? t('vs', {name: getTranslated(CLASS_NAMES, filterClass)}): ''}</h3><div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"><ul id="recent-matches-list" class="max-h-[36rem] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">${recentMatchesHTML || `<li class="p-4 text-center text-gray-500 dark:text-gray-400">${t('noMatchesFilter')}</li>`}</ul></div></div></div>`}</main>`;
};

const renderModals = () => {
    // Add Deck Modal
    document.querySelector('#add-deck-modal h2').textContent = t('addNewDeck');
    document.querySelector('#add-deck-modal label[for="deckName"]').textContent = t('deckName');
    document.querySelector('#add-deck-modal #deckName').placeholder = t('deckNamePlaceholder');
    document.querySelector('#add-deck-modal #deck-class-label').textContent = t('class');
    document.querySelector('#add-deck-modal #cancel-deck-button').textContent = t('cancel');
    document.querySelector('#add-deck-modal #save-deck-button').textContent = t('saveDeck');

    // Delete Deck Modal
    document.querySelector('#delete-deck-confirm-modal #delete-deck-modal-title').textContent = t('deleteDeckTitle');
    const deckToDelete = state.deckToDeleteId ? state.decks.find(d => d.id === state.deckToDeleteId) : null;
    document.querySelector('#delete-deck-confirm-modal p.text-sm').innerHTML = t('deleteDeckConfirm', {name: `<strong id="deck-to-delete-name" class="text-gray-600 dark:text-gray-300">${deckToDelete ? deckToDelete.name : ''}</strong>`});
    document.querySelector('#delete-deck-confirm-modal #confirm-delete-deck-button').textContent = t('delete');
    document.querySelector('#delete-deck-confirm-modal #cancel-delete-deck-button').textContent = t('cancel');
    
    // Delete Match Modal
    document.querySelector('#delete-match-confirm-modal #delete-match-modal-title').textContent = t('deleteMatchTitle');
    document.querySelector('#delete-match-confirm-modal p.text-sm').textContent = t('deleteMatchConfirm');
    document.querySelector('#delete-match-confirm-modal #confirm-delete-match-button').textContent = t('delete');
    document.querySelector('#delete-match-confirm-modal #cancel-delete-match-button').textContent = t('cancel');
    
    // Import Modal
    document.querySelector('#import-confirm-modal #import-modal-title').textContent = t('importTitle');
    document.querySelector('#import-confirm-modal p.text-sm').textContent = t('importConfirm');
    document.querySelector('#import-confirm-modal #confirm-import-button').textContent = t('importAndOverwrite');
    document.querySelector('#import-confirm-modal #cancel-import-button').textContent = t('cancel');

    // Reset Modal
    document.querySelector('#reset-confirm-modal #reset-modal-title').textContent = t('resetTitle');
    document.querySelector('#reset-confirm-modal p.text-sm').textContent = t('resetConfirm');
    document.querySelector('#reset-confirm-modal #confirm-reset-button').textContent = t('reset');
    document.querySelector('#reset-confirm-modal #cancel-reset-button').textContent = t('cancel');
};


// --- MAIN RENDER FUNCTION ---
export const render = () => {
    document.documentElement.lang = state.language;
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
    renderModals();
};