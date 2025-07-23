import { state, CLASSES, classStyles, CLASS_NAMES, TURN_NAMES, RESULT_NAMES, translations, getTranslated, setDeckNotesState, setNewDeckClass, getTranslatedClassName, setTagToDeleteId, setTagToMerge, addTag, updateTagUsage } from './store.js';
import { getStatsForView } from './calculator.js';

// --- DOM CACHE ---
const appContainer = document.getElementById('app');
const addDeckModal = document.getElementById('add-deck-modal');
const deleteDeckConfirmModal = document.getElementById('delete-deck-confirm-modal');
const deleteMatchConfirmModal = document.getElementById('delete-match-confirm-modal');
const deleteTagConfirmModal = document.getElementById('delete-tag-confirm-modal');
const mergeTagConfirmModal = document.getElementById('merge-tag-confirm-modal');
const importConfirmModal = document.getElementById('import-confirm-modal');
const resetConfirmModal = document.getElementById('reset-confirm-modal');
const deckNotesModal = document.getElementById('deck-notes-modal');
const matchInfoModal = document.getElementById('match-info-modal');
const tagFilterModal = document.getElementById('tag-filter-modal');

// --- CONSTANTS ---
const ITEMS_PER_PAGE = 50;

// --- TRANSLATION HELPERS ---
const t = (key, replacements = {}) => {
    let text = (translations[state.language] && translations[state.language][key]) || translations.en[key] || `[${key}]`;
    for (const placeholder in replacements) {
        text = text.replace(`{${placeholder}}`, replacements[placeholder]);
    }
    return text;
};
const getShortClassName = (cls) => {
    const translatedName = getTranslatedClassName(cls);
    if (state.language === 'ja') {
        if (translatedName === 'ビショップ') return 'ビショ';
        return translatedName.substring(0, 2);
    }
    return translatedName.substring(0, 2);
};

// --- URL PARSER ---
const linkify = (text) => {
    if (!text) return '';
    const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    // Sanitize text first to prevent XSS by setting textContent, then read innerHTML
    const tempDiv = document.createElement('div');
    tempDiv.textContent = text;
    return tempDiv.innerHTML.replace(urlRegex, url => 
        `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-500 dark:text-blue-400 hover:underline break-all">${url}</a>`
    );
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

const createClassSelector = (selectedClass, onSelectCallback, namePrefix = '') => {
    const container = document.createElement('div');
    container.className = 'grid grid-cols-4 gap-2 mt-2';
    container.setAttribute('role', 'group');

    [...CLASSES, 'Neutral'].forEach(cls => {
        const isSelected = selectedClass === cls;
        const style = classStyles[cls];
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = getTranslatedClassName(cls);
        
        if (namePrefix) {
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = namePrefix;
            radio.value = cls;
            radio.id = `${namePrefix}-${cls}`;
            radio.className = 'sr-only';
            if (isSelected) radio.checked = true;
            radio.addEventListener('change', () => onSelectCallback(cls));
            
            const label = document.createElement('label');
            label.htmlFor = `${namePrefix}-${cls}`;
            label.textContent = getTranslatedClassName(cls);
            label.className = `w-full text-center block px-2 py-2 text-sm font-medium rounded-md focus:outline-none transition-all duration-150 transform hover:-translate-y-px cursor-pointer ${
                isSelected
                    ? `${style.button} text-white shadow-md focus-within:ring-2 focus-within:ring-offset-2 ${style.ring}`
                    : `${style.bg} ${style.text} hover:brightness-95 focus-within:ring-2 focus-within:ring-offset-2 ${style.ring}`
            }`;
            label.appendChild(radio);
            container.appendChild(label);

        } else {
            button.setAttribute('aria-pressed', String(isSelected));
            button.className = `w-full text-center px-2 py-2 text-sm font-medium rounded-md focus:outline-none transition-all duration-150 transform hover:-translate-y-px ${
                isSelected
                    ? `${style.button} text-white shadow-md focus:ring-2 focus:ring-offset-2 ${style.ring}`
                    : `${style.bg} ${style.text} hover:brightness-95 focus:ring-2 focus:ring-offset-2 ${style.ring}`
            }`;
            button.addEventListener('click', () => onSelectCallback(cls));
            container.appendChild(button);
        }
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
    // Remove "Neutral" from deck class selector
    const neutralButton = Array.from(selector.children).find(child => (child.textContent || child.querySelector('label')?.textContent) === getTranslatedClassName('Neutral'));
    if(neutralButton) neutralButton.remove();

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
export const openDeleteTagModal = (tagId) => {
    setTagToDeleteId(tagId);
    renderModals();
    deleteTagConfirmModal.classList.remove('hidden');
    deleteTagConfirmModal.querySelector('div').classList.add('animate-fade-in-up');
};
export const closeDeleteTagModal = () => {
    setTagToDeleteId(null);
    deleteTagConfirmModal.classList.add('hidden');
    deleteTagConfirmModal.querySelector('div').classList.remove('animate-fade-in-up');
};
export const openMergeTagModal = () => {
    renderModals();
    mergeTagConfirmModal.classList.remove('hidden');
    mergeTagConfirmModal.querySelector('div').classList.add('animate-fade-in-up');
};
export const closeMergeTagModal = () => {
    setTagToMerge(null);
    mergeTagConfirmModal.classList.add('hidden');
    mergeTagConfirmModal.querySelector('div').classList.remove('animate-fade-in-up');
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
export const openMatchInfoModal = (deckId, gameId) => {
    state.matchInfoToShow = { deckId, gameId };
    renderModals();
    matchInfoModal.classList.remove('hidden');
    matchInfoModal.querySelector('div').classList.add('animate-fade-in-up');
};
export const closeMatchInfoModal = () => {
    state.matchInfoToShow = null;
    matchInfoModal.classList.add('hidden');
    matchInfoModal.querySelector('div').classList.remove('animate-fade-in-up');
};
export const openNotesModal = (deckId) => {
    setDeckNotesState({ deckId, isEditing: false });
    renderModals();
    deckNotesModal.classList.remove('hidden');
    deckNotesModal.querySelector('div').classList.add('animate-fade-in-up');
};
export const closeNotesModal = () => {
    setDeckNotesState({ deckId: null, isEditing: false });
    deckNotesModal.classList.add('hidden');
    deckNotesModal.querySelector('div').classList.remove('animate-fade-in-up');
};
export const openTagFilterModal = () => {
    renderTagFilterModalContent();
    tagFilterModal.classList.remove('hidden');
    tagFilterModal.querySelector('div').classList.add('animate-fade-in-up');
};
export const closeTagFilterModal = () => {
    tagFilterModal.classList.add('hidden');
    tagFilterModal.querySelector('div').classList.remove('animate-fade-in-up');
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

const renderTagPills = (tagIds, tagsById, deletable = false, onPillClick = null, pillType = 'existing') => {
    if (!tagIds || tagIds.length === 0) return '';
    return tagIds.map((idOrData, index) => {
        const isNewTag = typeof idOrData === 'object';
        const tag = isNewTag ? idOrData : tagsById[idOrData];
        const tagId = isNewTag ? null : idOrData;
        const newTagIndex = isNewTag ? index : null;

        if (!tag) return '';
        const style = classStyles.Neutral;
        
        const pill = document.createElement('span');
        pill.className = `inline-flex items-center gap-1.5 py-1 px-2.5 text-xs font-medium rounded-full ${style.tag}`;
        
        const textSpan = document.createElement('span');
        textSpan.textContent = tag.name;
        pill.appendChild(textSpan);

        if (deletable) {
            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.setAttribute('aria-label', `Remove tag ${tag.name}`);
            deleteButton.className = 'p-0.5 -mr-1 rounded-full hover:bg-black/10';
            deleteButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>`;
            if (pillType === 'existing') {
                deleteButton.dataset.tagId = tagId;
            } else {
                deleteButton.dataset.newTagIndex = newTagIndex;
            }
            deleteButton.onclick = (e) => onPillClick(e);
            pill.appendChild(deleteButton);
        }
        return pill;
    });
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

            const nameSectionHTML = isEditing ? `
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
                    <span class="flex-shrink-0 ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${style.bg} ${style.text}">${getTranslatedClassName(deck.class)}</span>
                </div>
            `;
            
            const notesIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg>`;
            
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
                       <button data-action="open-delete-deck-modal" data-deck-id="${deck.id}" aria-label="${t('deckAriaDelete', {name: deck.name})}" title="${t('delete')}" class="p-2 text-gray-400 dark:text-gray-500 rounded-full hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                           <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
                               <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" />
                           </svg>
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
                    <button data-action="export-data" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50" ${decks.length === 0 && state.tags.length === 0 ? 'disabled' : ''}>
                        ${t('export')}
                    </button>
                    <button data-action="reset-all" class="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50 disabled:cursor-not-allowed" ${decks.length === 0 && state.tags.length === 0 ? 'disabled' : ''}>
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

let addGameLocalState = null;

export const resetAddGameState = () => {
    addGameLocalState = null;
};

export const clearAddGameSelections = () => {
    if (addGameLocalState) {
        addGameLocalState.opponentClass = null;
        addGameLocalState.turn = null;
        addGameLocalState.result = null;
        addGameLocalState.mySelectedTagIds = [];
        addGameLocalState.opponentSelectedTagIds = [];
    }
};

const renderAddGameView = (deckId) => {
    const deck = state.decks.find(d => d.id === deckId);
    if (!deck) {
        appContainer.innerHTML = `<p>Deck not found</p>`;
        return;
    }
    
    if (!addGameLocalState || addGameLocalState.deckId !== deckId) {
        addGameLocalState = {
            deckId: deckId,
            opponentClass: null,
            turn: null,
            result: null,
            mySelectedTagIds: [],
            opponentSelectedTagIds: [],
        };
    }

    appContainer.innerHTML = `
        <main class="w-full max-w-2xl mx-auto">
            <div class="flex items-center gap-4 mb-4">
                <button data-action="back-to-decks" class="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    <svg class="w-4 h-4 pointer-events-none" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
                    ${t('back')}
                </button>
                <div class="relative flex-1 min-w-0">
                    <button data-action="toggle-add-game-deck-switcher" id="add-game-deck-switcher-btn" class="flex w-full items-center gap-2 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors">
                        <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 truncate" title="${t('addGameTitle', { name: deck.name })}">
                            ${t('addGameTitle', {name: `<span class="${classStyles[deck.class].text}">${deck.name}</span>`})}
                        </h2>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform flex-shrink-0 ${state.view.addGameDeckSwitcherVisible ? 'rotate-180' : ''}" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                    </button>
                    <div id="add-game-deck-switcher-dropdown" class="${state.view.addGameDeckSwitcherVisible ? '' : 'hidden'} absolute top-full left-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 z-20 overflow-hidden">
                        <ul class="max-h-60 overflow-y-auto">
                            ${state.decks.map(d => `<li><button data-action="switch-add-game-deck" data-deck-id="${d.id}" class="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors ${d.id === deck.id ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-700 dark:text-gray-300'}">${d.name} <span class="text-xs ${classStyles[d.class].text}">(${getTranslatedClassName(d.class)})</span></button></li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
                <form id="add-game-form" class="space-y-6" novalidate>
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
                    
                    <div class="border-t border-gray-200 dark:border-gray-600">
                        <button type="button" data-action="toggle-add-game-tags" class="flex justify-between items-center w-full pt-6 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                            <span>${t('tags')}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transition-transform duration-200 ${state.addGameTagsExpanded ? 'rotate-180' : ''}" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                        </button>
                        <div id="collapsible-tags-section" class="${state.addGameTagsExpanded ? 'mt-4 space-y-4' : 'hidden'}">
                            <div id="my-tags-container"></div>
                            <div id="opponent-tags-container"></div>
                        </div>
                    </div>

                    <div class="border-t border-gray-200 dark:border-gray-700 pt-5">
                         <button id="save-game-button" type="button" data-action="save-game" disabled class="w-full px-4 py-3 font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 bg-gray-400 text-gray-100 cursor-not-allowed ring-gray-400">
                            ${t('saveGame')}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    `;

    // --- Post-render logic for this specific view ---
    const form = document.getElementById('add-game-form');
    
    const updateFormDataset = () => {
        form.dataset.opponentClass = addGameLocalState.opponentClass;
        form.dataset.turn = addGameLocalState.turn;
        form.dataset.result = addGameLocalState.result;
        form.dataset.myTagIds = JSON.stringify(addGameLocalState.mySelectedTagIds);
        form.dataset.opponentTagIds = JSON.stringify(addGameLocalState.opponentSelectedTagIds);
    };
    
    const checkFormComplete = () => {
        const saveButton = document.getElementById('save-game-button');
        if (addGameLocalState.opponentClass && addGameLocalState.turn && addGameLocalState.result) {
            saveButton.disabled = false;
            saveButton.className = 'w-full px-4 py-3 font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 bg-blue-600 text-white hover:bg-blue-700 ring-blue-500';
        } else {
            saveButton.disabled = true;
            saveButton.className = 'w-full px-4 py-3 font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 bg-gray-400 text-gray-100 cursor-not-allowed ring-gray-400';
        }
        updateFormDataset();
    };
    
    // --- Tag Input Component (Refactored for stability) ---
    const renderTagInput = (containerId, label, selectedTagIds, onUpdate) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <label for="${containerId}-input" class="block text-sm font-medium text-gray-700 dark:text-gray-300">${label}</label>
            <div class="mt-1 relative">
                <div class="w-full flex items-center gap-2 pr-1 pl-2 min-h-[42px] border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700">
                    <div id="${containerId}-pills" class="flex flex-wrap gap-1.5 items-center"></div>
                    <input type="text" id="${containerId}-input" placeholder="${t('addTagPlaceholder')}" class="flex-grow p-0 border-none focus:ring-0 bg-transparent dark:placeholder-gray-400 dark:text-white text-gray-900" autocomplete="off">
                    <button type="button" id="${containerId}-action-btn" class="flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors duration-150 disabled:bg-gray-200 dark:disabled:bg-gray-600 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed" disabled>
                        ${t('createTagButton')}
                    </button>
                </div>
                <div id="${containerId}-suggestions" class="hidden absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border dark:border-gray-700 max-h-60 overflow-y-auto"></div>
            </div>
        `;

        const input = document.getElementById(`${containerId}-input`);
        const suggestionsContainer = document.getElementById(`${containerId}-suggestions`);
        const pillsContainer = document.getElementById(`${containerId}-pills`);
        const actionButton = document.getElementById(`${containerId}-action-btn`);
        let highlightedIndex = -1;
        
        const updatePills = () => {
            pillsContainer.innerHTML = '';
            const tagsById = Object.fromEntries(state.tags.map(t => [t.id, t]));
            
            const handlePillClick = (e) => {
                const button = e.currentTarget;
                const tagId = button.dataset.tagId;
                if (tagId) {
                    onUpdate(selectedTagIds.filter(id => id !== tagId));
                }
            };

            const pills = renderTagPills(selectedTagIds, tagsById, true, handlePillClick, 'existing');
            if (pills) pills.forEach(p => pillsContainer.appendChild(p));
        };

        const updateHighlight = () => {
            const suggestions = suggestionsContainer.querySelectorAll('.suggestion-item');
            suggestions.forEach((suggestion, index) => {
                if (index === highlightedIndex) {
                    suggestion.classList.add('bg-blue-100', 'dark:bg-blue-900/50');
                    suggestion.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                } else {
                    suggestion.classList.remove('bg-blue-100', 'dark:bg-blue-900/50');
                }
            });
        };

        const renderSuggestions = (query) => {
            query = query.toLowerCase();
            const allSelectedNames = selectedTagIds.map(id => {
                const tag = state.tags.find(t => t.id === id);
                return tag ? tag.name.toLowerCase() : null;
            }).filter(Boolean);

            const getScore = (tagName) => {
                const lowerTagName = tagName.toLowerCase();
                if (lowerTagName.startsWith(query)) return 2;
                if (lowerTagName.includes(query)) return 1;
                return 0;
            };

            const filteredTags = query
                ? state.tags
                    .map(tag => ({ tag, score: getScore(tag.name) }))
                    .filter(item => item.score > 0 && !allSelectedNames.includes(item.tag.name.toLowerCase()))
                    .sort((a, b) => {
                        if (b.score !== a.score) {
                            return b.score - a.score; // Higher score first
                        }
                        // For ties, sort by most recently used
                        return (state.tagUsage[b.tag.id] || 0) - (state.tagUsage[a.tag.id] || 0);
                    })
                    .map(item => item.tag)
                : [];

            const recentTags = Object.entries(state.tagUsage)
                .sort(([,tsA], [,tsB]) => tsB - tsA)
                .map(([id]) => state.tags.find(t => t.id === id))
                .filter(tag => tag && !allSelectedNames.includes(tag.name.toLowerCase()) && !filteredTags.some(ft => ft.id === tag.id))
                .slice(0, 30);
            
            let html = '';
            
            if (query && filteredTags.length > 0) {
                 html += `<h4 class="px-4 pt-2 pb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">${t('matchingTags')}</h4>`;
                 html += filteredTags.map(tag => `<div class="suggestion-item p-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/40" data-tag-id="${tag.id}"><span class="font-medium text-sm text-gray-800 dark:text-gray-200">${tag.name}</span></div>`).join('');
            }
            if (!query && recentTags.length > 0) {
                 html += `<h4 class="px-4 pt-2 pb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">${t('recentTags')}</h4>`;
                 html += recentTags.map(tag => `<div class="suggestion-item p-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/40" data-tag-id="${tag.id}"><span class="font-medium text-sm text-gray-800 dark:text-gray-200">${tag.name}</span></div>`).join('');
            }
            
            if (!html && query) {
                 html = `<div class="p-3 text-sm text-gray-500 dark:text-gray-400">${t('noTagsFound')}</div>`;
            }

            if (!html) {
                 suggestionsContainer.classList.add('hidden');
                 highlightedIndex = -1;
            } else {
                suggestionsContainer.innerHTML = html;
                suggestionsContainer.classList.remove('hidden');
            }
            
            const suggestions = suggestionsContainer.querySelectorAll('.suggestion-item');
            if (highlightedIndex >= suggestions.length) {
                highlightedIndex = -1;
            }
            updateHighlight();
        };
        
        const updateActionButtonState = (query) => {
            const trimmedQuery = query.trim();
            if (!trimmedQuery) {
                actionButton.disabled = true;
                actionButton.textContent = t('createTagButton');
                actionButton.className = 'flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors duration-150 disabled:bg-gray-200 dark:disabled:bg-gray-600 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed';
                return;
            }

            const lowerCaseQuery = trimmedQuery.toLowerCase();
            
            const isAlreadySelected = selectedTagIds.some(id => {
                const tag = state.tags.find(t => t.id === id);
                return tag && tag.name.toLowerCase() === lowerCaseQuery;
            });

            if (isAlreadySelected) {
                actionButton.disabled = true;
                actionButton.textContent = t('selectTagButton');
                actionButton.className = 'flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors duration-150 disabled:bg-gray-200 dark:disabled:bg-gray-600 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed';
                return;
            }
            
            const existingTag = state.tags.find(t => t.name.toLowerCase() === lowerCaseQuery);
            
            actionButton.disabled = false;
            if (existingTag) {
                actionButton.textContent = t('selectTagButton');
                actionButton.dataset.action = 'select';
                actionButton.dataset.tagId = existingTag.id;
                actionButton.className = 'flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors duration-150 bg-blue-600 text-white hover:bg-blue-700';
            } else {
                actionButton.textContent = t('createTagButton');
                actionButton.dataset.action = 'create';
                actionButton.dataset.tagName = trimmedQuery;
                actionButton.className = 'flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors duration-150 bg-green-600 text-white hover:bg-green-700';
            }
        };

        actionButton.addEventListener('click', () => {
            if (actionButton.disabled) return;
            const inputId = input.id;

            const action = actionButton.dataset.action;
            if (action === 'select') {
                const tagId = actionButton.dataset.tagId;
                if (tagId && !selectedTagIds.includes(tagId)) {
                    onUpdate([...selectedTagIds, tagId]);
                }
            } else if (action === 'create') {
                const tagName = actionButton.dataset.tagName;
                const newTag = { id: crypto.randomUUID(), name: tagName };
                addTag(newTag);
                updateTagUsage([newTag.id]);
                onUpdate([...selectedTagIds, newTag.id]);
            }

            input.value = '';
            suggestionsContainer.classList.add('hidden');
            setTimeout(() => document.getElementById(inputId)?.focus(), 0);
        });
        
        suggestionsContainer.addEventListener('click', e => {
            const itemToSelect = e.target.closest('.suggestion-item');
            if (itemToSelect) {
                const tagId = itemToSelect.dataset.tagId;
                const inputId = input.id;
                if (tagId && !selectedTagIds.includes(tagId)) {
                    onUpdate([...selectedTagIds, tagId]);
                }
                input.value = '';
                suggestionsContainer.classList.add('hidden');
                setTimeout(() => document.getElementById(inputId)?.focus(), 0);
            }
        });

        suggestionsContainer.addEventListener('mousemove', (e) => {
            const item = e.target.closest('.suggestion-item');
            if (!item) return;
            const suggestions = Array.from(suggestionsContainer.querySelectorAll('.suggestion-item'));
            const newIndex = suggestions.indexOf(item);
            if (newIndex !== highlightedIndex) {
                highlightedIndex = newIndex;
                updateHighlight();
            }
        });

        const handleOutsideClick = (event) => {
            if (!container.contains(event.target)) {
                suggestionsContainer.classList.add('hidden');
                input.blur();
                document.removeEventListener('click', handleOutsideClick, true);
            }
        };

        input.addEventListener('focus', () => {
            renderSuggestions(input.value.trim());
            updateHighlight();
            document.addEventListener('click', handleOutsideClick, true);
        });
        
        input.addEventListener('input', () => {
            const query = input.value;
            renderSuggestions(query.trim());
            updateActionButtonState(query);
        });

        input.addEventListener('keydown', (e) => {
            const suggestions = suggestionsContainer.querySelectorAll('.suggestion-item');
            const suggestionsVisible = !suggestionsContainer.classList.contains('hidden');

            if (!suggestionsVisible) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    renderSuggestions(input.value.trim());
                } else if (e.key === 'Enter' && !actionButton.disabled) {
                    e.preventDefault();
                    actionButton.click();
                }
                return;
            }

            if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
                if (suggestions.length > 0) {
                    e.preventDefault();
                    highlightedIndex = (highlightedIndex + 1) % suggestions.length;
                    updateHighlight();
                }
            } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
                if (suggestions.length > 0) {
                    e.preventDefault();
                    highlightedIndex = (highlightedIndex - 1 + suggestions.length) % suggestions.length;
                    updateHighlight();
                }
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (highlightedIndex > -1 && suggestions[highlightedIndex]) {
                    const selectedItem = suggestions[highlightedIndex];
                    const tagId = selectedItem.dataset.tagId;
                    const inputId = input.id;
                    if (tagId && !selectedTagIds.includes(tagId)) {
                        onUpdate([...selectedTagIds, tagId]);
                    }
                    input.value = '';
                    suggestionsContainer.classList.add('hidden');
                    setTimeout(() => document.getElementById(inputId)?.focus(), 0);
                } else if (!actionButton.disabled) {
                    actionButton.click();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                suggestionsContainer.classList.add('hidden');
            }
        });

        updatePills();
        updateActionButtonState(''); // Set initial state
    };
    
    // Initial renders
    const renderAllTagInputs = () => {
        if (!state.addGameTagsExpanded) {
            document.getElementById('my-tags-container').innerHTML = '';
            document.getElementById('opponent-tags-container').innerHTML = '';
            return;
        }

        const myTagUpdateCallback = (updatedSelectedIds) => {
            addGameLocalState.mySelectedTagIds = updatedSelectedIds;
            setTimeout(render, 0);
        };

        const opponentTagUpdateCallback = (updatedSelectedIds) => {
            addGameLocalState.opponentSelectedTagIds = updatedSelectedIds;
            setTimeout(render, 0);
        };

        renderTagInput('my-tags-container', t('myTags'), addGameLocalState.mySelectedTagIds, myTagUpdateCallback);
        renderTagInput('opponent-tags-container', t('opponentTags'), addGameLocalState.opponentSelectedTagIds, opponentTagUpdateCallback);
    };
    
    const renderGameClassSelector = () => {
        const container = document.getElementById('game-class-selector-container');
        container.innerHTML = '';
        const selector = createClassSelector(addGameLocalState.opponentClass, (cls) => {
            addGameLocalState.opponentClass = cls;
            renderGameClassSelector();
            checkFormComplete();
        });
        const neutralButton = Array.from(selector.children).find(child => child.textContent === getTranslatedClassName('Neutral'));
        if(neutralButton) neutralButton.remove();

        container.appendChild(selector);
    };
    renderGameClassSelector();
    renderAllTagInputs();
    
    document.querySelectorAll('#turn-selector button').forEach(btn => {
        const isSelected = btn.dataset.value === addGameLocalState.turn;
        btn.setAttribute('aria-pressed', String(isSelected));
        btn.className = `w-full text-center px-4 py-3 font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 transform hover:-translate-y-px ${
            isSelected ? 'bg-blue-600 text-white shadow-md ring-blue-500' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 ring-blue-500'
        }`;
    });
    
    document.getElementById('turn-selector').addEventListener('click', e => {
        if (e.target.tagName === 'BUTTON') {
            addGameLocalState.turn = e.target.dataset.value;
            checkFormComplete();
            document.querySelectorAll('#turn-selector button').forEach(btn => {
                const isSelected = btn.dataset.value === addGameLocalState.turn;
                btn.setAttribute('aria-pressed', String(isSelected));
                btn.className = `w-full text-center px-4 py-3 font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 transform hover:-translate-y-px ${
                    isSelected ? 'bg-blue-600 text-white shadow-md ring-blue-500' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 ring-blue-500'
                }`;
            });
        }
    });
    
    document.querySelectorAll('#result-selector button').forEach(btn => {
        const isSelected = btn.dataset.value === addGameLocalState.result;
        btn.setAttribute('aria-pressed', String(isSelected));
        if (isSelected) {
            const styleClass = addGameLocalState.result === 'Win' ? 'bg-green-600 text-white shadow-md ring-green-500' : 'bg-red-600 text-white shadow-md ring-red-500';
            btn.className = `w-full text-center px-4 py-3 font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 transform hover:-translate-y-px ${styleClass}`;
        } else {
            const originalStyle = btn.dataset.value === 'Win' ? 'bg-green-100 text-green-800 hover:bg-green-200 ring-green-500' : 'bg-red-100 text-red-800 hover:bg-red-200 ring-red-500';
            btn.className = `w-full text-center px-4 py-3 font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 transform hover:-translate-y-px ${originalStyle}`;
        }
    });

    document.getElementById('result-selector').addEventListener('click', e => {
        if (e.target.tagName === 'BUTTON') {
            addGameLocalState.result = e.target.dataset.value;
            checkFormComplete();
            document.querySelectorAll('#result-selector button').forEach(btn => {
                const isSelected = btn.dataset.value === addGameLocalState.result;
                btn.setAttribute('aria-pressed', String(isSelected));
                if (isSelected) {
                    const styleClass = addGameLocalState.result === 'Win' ? 'bg-green-600 text-white shadow-md ring-green-500' : 'bg-red-600 text-white shadow-md ring-red-500';
                    btn.className = `w-full text-center px-4 py-3 font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 transform hover:-translate-y-px ${styleClass}`;
                } else {
                    const originalStyle = btn.dataset.value === 'Win' ? 'bg-green-100 text-green-800 hover:bg-green-200 ring-green-500' : 'bg-red-100 text-red-800 hover:bg-red-200 ring-red-500';
                    btn.className = `w-full text-center px-4 py-3 font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 transform hover:-translate-y-px ${originalStyle}`;
                }
            });
        }
    });
    
    // Final check on initial load
    checkFormComplete();
};

const renderStatsView = (deckId) => {
    // --- 1. Get memoized stats from the calculator ---
    const calculatedData = getStatsForView(state.view, state.decks, state.tags, t, state.language);

    if (!calculatedData) {
        appContainer.innerHTML = `<p>Deck not found</p>`;
        return;
    }

    const {
        displayDeck,
        stats,
        totalStatsForPie,
        winRateByClass,
        sortedGames,
        filteredDeckGamesCount
    } = calculatedData;
    
    const { filterClass, dateFilter, tagFilter, statsDeckSwitcherVisible, dateFilterVisible, chartType, currentPage = 1 } = state.view;
    const isAllDecksView = deckId === 'all';
    
    // --- 2. Pagination Logic ---
    const totalGames = sortedGames.length;
    const totalPages = Math.ceil(totalGames / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedGames = sortedGames.slice(startIndex, endIndex);

    // --- 3. Render functions for sub-components (Charts, Lists, etc.) ---
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
    
    const renderChartContainer = () => {
        const chartTitle = chartType === 'bar' ? t('barChartTitle') : t('pieChartTitle');
        const chartHTML = chartType === 'bar' ? renderBarChart(winRateByClass, filterClass) : renderPieChart(totalStatsForPie.opponentDistribution, filteredDeckGamesCount, filterClass);
        const wrapperClasses = chartType === 'bar' ? 'w-full' : 'inline-block';
        return `<div class="text-center ${wrapperClasses}"><h4 class="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">${chartTitle}</h4><div data-action="toggle-chart-type" role="button" tabindex="0" aria-label="${t('toggleChartType')}" class="cursor-pointer p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">${chartHTML}</div></div>`;
    };

    const opponentBreakdownHTML = CLASSES.map(cls => {
        const count = totalStatsForPie.opponentDistribution[cls] || 0;
        if (count === 0 && filteredDeckGamesCount > 0) return '';
        const percentage = filteredDeckGamesCount > 0 ? ((count / filteredDeckGamesCount) * 100).toFixed(1) : '0.0';
        const style = classStyles[cls], winRate = winRateByClass[cls], isFiltered = filterClass === cls;
        return `<button data-action="filter-stats" data-class="${cls}" class="grid grid-cols-4 w-full text-left p-2 rounded-md items-center transition-all duration-200 ${isFiltered ? `bg-blue-100 dark:bg-blue-900/40 ring-1 ring-blue-400 shadow-sm` : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}"><span class="flex items-center gap-3 col-span-2 truncate"><span class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: ${style.chart}"></span><span class="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">${getTranslatedClassName(cls)}</span></span><span class="text-sm text-gray-600 dark:text-gray-400 text-center col-span-1"><span class="font-semibold text-gray-800 dark:text-gray-100">${percentage}%</span></span><span class="text-sm text-gray-600 dark:text-gray-400 text-right col-span-1"><span class="font-semibold text-gray-800 dark:text-gray-100">${winRate}</span></span></button>`;
    }).join('');

    const tagsById = Object.fromEntries(state.tags.map(t => [t.id, t]));
    const recentMatchesHTML = paginatedGames.map(game => {
        const opponentStyle = classStyles[game.opponentClass];
        const resultStyle = game.result === 'Win' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
        
        const deckName = (isAllDecksView || deckId.startsWith('all-')) ? (state.decks.find(d => d.id === game.originalDeckId)?.name || 'Unknown') : '';
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

    const paginationControlsHTML = () => {
        if (totalPages <= 1) return '';
        const showingFrom = totalGames > 0 ? startIndex + 1 : 0;
        const showingTo = Math.min(endIndex, totalGames);

        return `<nav class="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-4 py-3 sm:px-6"><div class="hidden sm:block"><p class="text-sm text-gray-700 dark:text-gray-400">${t('paginationResults', { from: showingFrom, to: showingTo, total: totalGames })}</p></div><div class="flex-1 flex justify-between sm:justify-end gap-2"><button data-action="prev-page" class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed" ${currentPage <= 1 ? 'disabled' : ''}>${t('paginationPrevious')}</button><button data-action="next-page" class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed" ${currentPage >= totalPages ? 'disabled' : ''}>${t('paginationNext')}</button></div></nav>`;
    };
    
    const statsLayoutHTML = `<div class="flex flex-wrap justify-around items-start text-center gap-y-4 md:grid md:grid-cols-[max-content,auto] md:gap-x-4 md:gap-y-3 md:text-left"><div class="md:contents"><p class="text-sm text-gray-500 dark:text-gray-400 md:text-right md:font-semibold md:self-center">${t('winRate')}</p><div><p class="text-lg font-bold text-gray-800 dark:text-gray-100">${stats.winRate}</p><p class="text-xs text-gray-400 dark:text-gray-500">${stats.wins}${t('winsShort')} / ${stats.losses}${t('lossesShort')}</p></div></div><div class="md:contents"><p class="text-sm text-gray-500 dark:text-gray-400 md:text-right md:font-semibold md:self-center">${t('firstWinRate')}</p><div><p class="text-lg font-semibold text-gray-800 dark:text-gray-100">${stats.firstTurnWinRate}</p><p class="text-xs text-gray-400 dark:text-gray-500">${stats.firstTurnTotal > 0 ? `${stats.firstTurnWins}${t('winsShort')} / ${stats.firstTurnTotal}${t('gamesShort')}` : t('na')}</p></div></div><div class="md:contents"><p class="text-sm text-gray-500 dark:text-gray-400 md:text-right md:font-semibold md:self-center">${t('secondWinRate')}</p><div><p class="text-lg font-semibold text-gray-800 dark:text-gray-100">${stats.secondTurnWinRate}</p><p class="text-xs text-gray-400 dark:text-gray-500">${stats.secondTurnTotal > 0 ? `${stats.secondTurnWins}${t('winsShort')} / ${stats.secondTurnTotal}${t('gamesShort')}` : t('na')}</p></div></div><div class="md:contents"><p class="text-sm text-gray-500 dark:text-gray-400 md:text-right md:font-semibold md:self-center">${t('longestStreak')}</p><div><p class="text-lg font-bold text-gray-800 dark:text-gray-100">${stats.longestStreak}</p><p class="text-xs text-gray-400 dark:text-gray-500">${t('wins')}</p></div></div></div>`;

    const tagFilterCount = tagFilter ? (tagFilter.my.include.length + tagFilter.my.exclude.length + tagFilter.opp.include.length + tagFilter.opp.exclude.length) : 0;
    
    const filtersActiveHTML = () => {
        const filters = [];
        if (filterClass) filters.push(t('filterOpponent', {name: `<span class="font-semibold ${classStyles[filterClass].text}">${getTranslatedClassName(filterClass)}</span>`}));
        if (dateFilter.start || dateFilter.end) filters.push(`<button id="stats-date-filter-text" type="button" data-action="toggle-date-filter" class="hover:underline">${t('filterPeriod', {start: `<span class="font-semibold text-gray-700 dark:text-gray-300">${dateFilter.start || '...'}</span>`, end: `<span class="font-semibold text-gray-700 dark:text-gray-300">${dateFilter.end || '...'}</span>`})}</button>`);
        if (tagFilterCount > 0) filters.push(`<button data-action="open-tag-filter-modal" class="hover:underline">${t('tagFiltersActive', {count: tagFilterCount})}</button>`);
        if (filters.length === 0) return '';
        return `<div class="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">${filters.join(' &bull; ')}</div>`;
    };

    // --- 4. Assemble the final HTML ---
    appContainer.innerHTML = `<main class="w-full max-w-7xl mx-auto"><div class="relative"><div class="flex justify-between items-center gap-2"><div class="flex items-center gap-2 min-w-0"><button data-action="back-to-decks" class="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"><svg class="w-4 h-4 pointer-events-none" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>${t('back')}</button><div class="relative flex-1 min-w-0 ml-2"><button data-action="toggle-deck-switcher" id="deck-switcher-btn" class="flex w-full items-center gap-2 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors"><h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100 truncate" title="${displayDeck.name}">${t('statsFor', {name: `<span class="${classStyles[displayDeck.class].text}">${displayDeck.name}</span>`})}</h2><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform flex-shrink-0 ${statsDeckSwitcherVisible ? 'rotate-180' : ''}" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" /></svg></button><div id="deck-switcher-dropdown" class="${statsDeckSwitcherVisible ? '' : 'hidden'} absolute top-full left-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 z-20 overflow-hidden"><ul class="max-h-80 overflow-y-auto"><li><button data-action="switch-stats-deck" data-deck-id="all" class="w-full text-left px-4 py-3 text-sm font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors ${isAllDecksView ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}">${t('allDecks')}</button></li>${CLASSES.map(cls => { const isSelected = deckId === `all-${cls}`; const translatedClassName = getTranslatedClassName(cls); const coloredTranslatedClassName = `<span class="${classStyles[cls].text}">${translatedClassName}</span>`; return `<li><button data-action="switch-stats-deck" data-deck-id="all-${cls}" class="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors ${isSelected ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-700 dark:text-gray-300'}">${t('allClassDecks', {class: coloredTranslatedClassName})}</button></li>`; }).join('')}${state.decks.length > 0 ? `<li class="border-t border-gray-200 dark:border-gray-700"></li>` : ''}${state.decks.map(d => `<li><button data-action="switch-stats-deck" data-deck-id="${d.id}" class="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors ${d.id === deckId ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-700 dark:text-gray-300'}">${d.name} <span class="text-xs ${classStyles[d.class].text}">(${getTranslatedClassName(d.class)})</span></button></li>`).join('')}</ul></div></div></div><div class="flex items-center gap-2 flex-shrink-0"><button data-action="open-tag-filter-modal" id="toggle-tag-filter-btn" title="${t('filterByTags')}" class="p-2 rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 8 0 013 8v-5z" /></svg></button><div class="relative"><button data-action="toggle-date-filter" id="toggle-date-filter-btn" title="${t('toggleDateFilter')}" class="p-2 rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></button><div id="date-filter-card" class="${dateFilterVisible ? '' : 'hidden'} absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 z-20 p-4"><p class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">${t('toggleDateFilter')}</p><form id="date-filter-form" class="space-y-3"><div><label for="start-date" class="block text-xs font-medium text-gray-600 dark:text-gray-400">${t('from')}</label><input type="date" id="start-date" name="start-date" value="${dateFilter.start || ''}" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white text-black"></div><div><label for="end-date" class="block text-xs font-medium text-gray-600 dark:text-gray-400">${t('to')}</label><input type="date" id="end-date" name="end-date" value="${dateFilter.end || ''}" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white text-black"></div><div class="flex items-center justify-end gap-2 pt-2"><button type="button" data-action="clear-date-filter" id="clear-date-filter-btn" class="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400">${t('clear')}</button><button type="submit" class="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">${t('apply')}</button></div></form></div></div></div></div><div class="mt-1 min-h-[1.25rem]">${filtersActiveHTML()}</div></div>${displayDeck.games.length === 0 ? `<div class="text-center bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-dashed border-gray-300 dark:border-gray-600 p-12 mt-1"><h3 class="text-sm font-medium text-gray-900 dark:text-gray-200">${t('noGames')}</h3><p class="mt-1 text-sm text-gray-500 dark:text-gray-400">${t('noGamesHint')}</p></div>` : `<div class="mt-1 grid grid-cols-1 xl:grid-cols-2 gap-8 items-start"><div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"><div class="flex flex-col md:flex-row items-center justify-around gap-6"><div class="flex-shrink-0 w-full md:w-60">${statsLayoutHTML}</div><div class="flex-grow flex justify-center">${renderChartContainer()}</div></div><div class="mt-6"><div class="flex justify-end items-center mb-2 h-5">${filterClass ? `<button data-action="clear-class-filter" class="text-xs text-blue-500 hover:underline">${t('showAllClasses')}</button>` : ''}</div><div class="grid grid-cols-4 text-xs text-gray-500 dark:text-gray-400 font-medium px-2 pb-1 border-b dark:border-gray-700"><span class="col-span-2">${t('opponent')}</span><span class="text-center col-span-1">${t('playRate')}</span><span class="text-right col-span-1">${t('winRate')}</span></div><div class="space-y-1 mt-2">${opponentBreakdownHTML}</div></div></div><div class="bg-white dark:bg-gray-800 rounded-lg shadow-md"><h3 class="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 px-6 pt-6">${t('matchHistory')} ${filterClass ? t('vs', {name: getTranslatedClassName(filterClass)}): ''}</h3><div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"><ul id="recent-matches-list" class="divide-y divide-gray-100 dark:divide-gray-700">${recentMatchesHTML || `<li class="p-4 text-center text-gray-500 dark:text-gray-400">${t('noMatchesFilter')}</li>`}</ul></div>${paginationControlsHTML()}</div></div>`}</main>`;
};

const renderTagFilterModalContent = () => {
    const formContainer = tagFilterModal.querySelector('div');
    const formId = 'tag-filter-form';

    // Keep a mutable copy of the filters that lives for the lifetime of the modal's open state.
    // This is the source of truth for the modal's UI.
    const localFilterState = JSON.parse(JSON.stringify(state.view.tagFilter));

    // This function re-renders the entire modal content. It is called recursively by the inputs.
    const rerender = () => {
        const createFilterGroup = (type, title) => {
            const safeType = type.toLowerCase();
            return `
                <div class="space-y-4 p-4 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <h4 class="text-base font-semibold text-gray-800 dark:text-gray-200">${title}</h4>
                    <div id="${safeType}-include-container"></div>
                    <div id="${safeType}-exclude-container"></div>
                </div>`;
        };

        formContainer.innerHTML = `<form id="${formId}" class="flex flex-col h-[80vh] md:h-auto md:max-h-[80vh]">
            <div class="p-6 border-b dark:border-gray-700 flex justify-between items-center">
                <h3 id="tag-filter-modal-title" class="text-lg font-medium text-gray-900 dark:text-gray-100">${t('tagFilterTitle')}</h3>
                <button type="button" data-action="manage-tags" class="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400">${t('manageTags')}</button>
            </div>
            <div class="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 overflow-y-auto flex-grow">
                ${createFilterGroup('my', t('tagFilterMy'))}
                ${createFilterGroup('opp', t('tagFilterOpponent'))}
            </div>
            <div class="p-4 bg-gray-50 dark:bg-gray-700/50 border-t dark:border-gray-700 flex justify-between items-center rounded-b-lg flex-shrink-0">
                <button type="button" data-action="clear-tag-filters" class="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline focus:outline-none">${t('clearTagFilters')}</button>
                <div class="flex gap-3">
                    <button type="button" data-action="close-tag-filter-modal" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">${t('cancel')}</button>
                    <button type="submit" class="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none">${t('applyTagFilters')}</button>
                </div>
            </div>
        </form>`;
        
        const form = document.getElementById(formId);
        if (form) {
            form.dataset.myInclude = JSON.stringify(localFilterState.my.include);
            form.dataset.myExclude = JSON.stringify(localFilterState.my.exclude);
            form.dataset.oppInclude = JSON.stringify(localFilterState.opp.include);
            form.dataset.oppExclude = JSON.stringify(localFilterState.opp.exclude);
        }
        
        const createFilterTagInput = (parentId, label, allTags, selectedTagIds, onUpdate) => {
            const id = `${parentId}-${label.replace(/[^a-zA-Z]/g, '')}`;
            const container = document.getElementById(parentId);
            if (!container) return;
    
            container.innerHTML = `
                <label for="${id}-input" class="block text-sm font-medium text-gray-500 dark:text-gray-400">${label}</label>
                <div class="mt-1 relative">
                    <div class="w-full flex flex-wrap gap-2 p-2 min-h-[42px] border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700">
                        <div id="${id}-pills" class="flex flex-wrap gap-1.5 items-center"></div>
                        <input type="text" id="${id}-input" placeholder="${t('addTagPlaceholder')}" class="flex-grow p-0 border-none focus:ring-0 bg-transparent dark:placeholder-gray-400 dark:text-white text-gray-900" autocomplete="off">
                    </div>
                    <div id="${id}-suggestions" class="hidden absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border dark:border-gray-700 max-h-48 overflow-y-auto"></div>
                </div>`;
    
            const input = document.getElementById(`${id}-input`);
            const suggestionsContainer = document.getElementById(`${id}-suggestions`);
            const pillsContainer = document.getElementById(`${id}-pills`);
            const tagsById = Object.fromEntries(allTags.map(tag => [tag.id, tag]));
            let highlightedIndex = -1;
    
            const renderPills = () => {
                pillsContainer.innerHTML = '';
                const pillElements = renderTagPills(selectedTagIds, tagsById, true, (e) => {
                    const tagId = e.currentTarget.dataset.tagId;
                    onUpdate(selectedTagIds.filter(id => id !== tagId));
                });
                if(pillElements) pillElements.forEach(p => pillsContainer.appendChild(p));
            };
            
            const updateHighlight = () => {
                const suggestions = suggestionsContainer.querySelectorAll('.suggestion-item');
                suggestions.forEach((suggestion, index) => {
                    if (index === highlightedIndex) {
                        suggestion.classList.add('bg-blue-100', 'dark:bg-blue-900/50');
                        suggestion.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                    } else {
                        suggestion.classList.remove('bg-blue-100', 'dark:bg-blue-900/50');
                    }
                });
            };

            const renderSuggestions = (query) => {
                query = query.toLowerCase();
                const allSelectedIds = new Set([
                    ...localFilterState.my.include, ...localFilterState.my.exclude,
                    ...localFilterState.opp.include, ...localFilterState.opp.exclude
                ]);

                let availableTags;

                if (query) {
                    const getScore = (tagName) => {
                        const lowerTagName = tagName.toLowerCase();
                        if (lowerTagName.startsWith(query)) return 2;
                        if (lowerTagName.includes(query)) return 1;
                        return 0;
                    };
                    availableTags = allTags
                        .map(tag => ({ tag, score: getScore(tag.name) }))
                        .filter(item => item.score > 0 && !allSelectedIds.has(item.tag.id))
                        .sort((a, b) => {
                            if (b.score !== a.score) {
                                return b.score - a.score; // Higher score first
                            }
                            // For ties, sort by most recently used
                            return (state.tagUsage[b.tag.id] || 0) - (state.tagUsage[a.tag.id] || 0);
                        })
                        .map(item => item.tag);
                } else {
                    // Original logic for when search is empty: show all available tags sorted by recency
                    availableTags = allTags
                        .filter(tag => !allSelectedIds.has(tag.id))
                        .sort((a,b) => (state.tagUsage[b.id] || 0) - (state.tagUsage[a.id] || 0));
                }
    
                if (availableTags.length === 0) {
                     suggestionsContainer.classList.add('hidden');
                     highlightedIndex = -1;
                     return;
                }
                
                suggestionsContainer.innerHTML = availableTags.map(tag => 
                    `<div class="suggestion-item p-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/40" data-tag-id="${tag.id}">
                        <span class="font-medium text-sm text-gray-800 dark:text-gray-200">${tag.name}</span>
                    </div>`
                ).join('');
                suggestionsContainer.classList.remove('hidden');

                const suggestions = suggestionsContainer.querySelectorAll('.suggestion-item');
                if (highlightedIndex >= suggestions.length) {
                    highlightedIndex = -1;
                }
                updateHighlight();
            };
            
            const handleSelection = (selectedItem) => {
                if (!selectedItem) return;
                const tagId = selectedItem.dataset.tagId;
                if (tagId) {
                    onUpdate([...selectedTagIds, tagId]);
                    setTimeout(() => document.getElementById(`${id}-input`)?.focus(), 0);
                }
            };

            input.addEventListener('keydown', (e) => {
                const suggestions = suggestionsContainer.querySelectorAll('.suggestion-item');
                const suggestionsVisible = !suggestionsContainer.classList.contains('hidden');

                if (!suggestionsVisible && e.key === 'ArrowDown') {
                    e.preventDefault();
                    renderSuggestions(input.value);
                    return;
                }
            
                if (!suggestionsVisible) return;
            
                if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
                    if (suggestions.length > 0) {
                        e.preventDefault();
                        highlightedIndex = (highlightedIndex + 1) % suggestions.length;
                        updateHighlight();
                    }
                } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
                    if (suggestions.length > 0) {
                        e.preventDefault();
                        highlightedIndex = (highlightedIndex - 1 + suggestions.length) % suggestions.length;
                        updateHighlight();
                    }
                } else if (e.key === 'Enter') {
                    if (highlightedIndex > -1 && suggestions[highlightedIndex]) {
                        e.preventDefault();
                        handleSelection(suggestions[highlightedIndex]);
                    }
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                    suggestionsContainer.classList.add('hidden');
                    input.blur();
                }
            });

            suggestionsContainer.addEventListener('mousemove', (e) => {
                const item = e.target.closest('.suggestion-item');
                if (!item) return;
                const suggestions = Array.from(suggestionsContainer.querySelectorAll('.suggestion-item'));
                const newIndex = suggestions.indexOf(item);
                if (newIndex !== highlightedIndex) {
                    highlightedIndex = newIndex;
                    updateHighlight();
                }
            });
    
            const handleOutsideClick = (event) => {
                if (!container.contains(event.target)) {
                    suggestionsContainer.classList.add('hidden');
                    input.blur();
                    document.removeEventListener('click', handleOutsideClick, true);
                }
            };

            input.addEventListener('focus', () => {
                renderSuggestions(input.value);
                document.addEventListener('click', handleOutsideClick, true);
            });
            
            input.addEventListener('input', () => {
                 const currentHighlight = highlightedIndex > -1
                    ? suggestionsContainer.querySelectorAll('.suggestion-item')[highlightedIndex]?.textContent
                    : null;
                renderSuggestions(input.value.trim());

                if (currentHighlight) {
                    const newSuggestions = Array.from(suggestionsContainer.querySelectorAll('.suggestion-item'));
                    const newIndex = newSuggestions.findIndex(el => el.textContent === currentHighlight);
                    if (newIndex > -1) {
                        highlightedIndex = newIndex;
                        updateHighlight();
                    } else {
                        highlightedIndex = -1;
                    }
                }
            });
            
            suggestionsContainer.addEventListener('click', e => {
                handleSelection(e.target.closest('.suggestion-item'));
            });
    
            renderPills();
        };

        // Create all 4 inputs, which will update localFilterState and call rerender()
        createFilterTagInput('my-include-container', t('tagFilterInclude'), state.tags, localFilterState.my.include, (updated) => {
            localFilterState.my.include = updated;
            rerender();
        });
        createFilterTagInput('my-exclude-container', t('tagFilterExclude'), state.tags, localFilterState.my.exclude, (updated) => {
            localFilterState.my.exclude = updated;
            rerender();
        });
        createFilterTagInput('opp-include-container', t('tagFilterInclude'), state.tags, localFilterState.opp.include, (updated) => {
            localFilterState.opp.include = updated;
            rerender();
        });
        createFilterTagInput('opp-exclude-container', t('tagFilterExclude'), state.tags, localFilterState.opp.exclude, (updated) => {
            localFilterState.opp.exclude = updated;
            rerender();
        });
    };

    rerender(); // Initial render
};

const renderManageTagsView = () => {
    // If the main view container for this screen doesn't exist, create its skeleton.
    // This part runs only once when navigating to the screen.
    if (!document.getElementById('manage-tags-view')) {
        appContainer.innerHTML = `
            <main id="manage-tags-view" class="w-full max-w-2xl mx-auto">
                 <div class="flex items-center gap-4 mb-6">
                    <button data-action="back-to-stats" class="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                        <svg class="w-4 h-4 pointer-events-none" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
                        ${t('back')}
                    </button>
                    <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100">${t('manageTags')}</h2>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 mb-6">
                    <form id="add-tag-form" autocomplete="off">
                        <div class="mb-4">
                            <label for="new-tag-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">${t('addOrSearchTags')}</label>
                            <input 
                                type="text"
                                id="new-tag-name"
                                name="new-tag-name"
                                required
                                class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white text-gray-900"
                                placeholder="${t('tagSearchPlaceholder')}"
                                value="${state.view.tagSearchQuery || ''}"
                             />
                        </div>
                        <div class="flex justify-end">
                            <button type="submit" class="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">${t('addNewTag')}</button>
                        </div>
                    </form>
                </div>
                
                <ul id="tag-list-container" class="space-y-4">
                    <!-- Tag list will be rendered here -->
                </ul>
            </main>
        `;
    }

    // This part runs on every render for this view, updating only the dynamic content.
    const tagListContainer = document.getElementById('tag-list-container');
    const searchInput = document.getElementById('new-tag-name');
    
    // Sync search input value with state (in case of programmatic changes)
    if (searchInput && searchInput.value !== (state.view.tagSearchQuery || '')) {
        searchInput.value = state.view.tagSearchQuery || '';
    }

    const searchQuery = (state.view.tagSearchQuery || '').toLowerCase();
    const editingTagId = state.view.editingTagId;

    const sortedTags = [...state.tags].sort((a, b) => a.name.localeCompare(b.name, state.language, { sensitivity: 'base' }));

    const filteredTags = sortedTags.filter(tag => {
        // Always show the tag being edited, regardless of the search filter
        if (tag.id === editingTagId) return true;
        // Otherwise, filter by the search query. Use normalize() for better IME compatibility.
        return tag.name.normalize().toLowerCase().includes(searchQuery.normalize());
    });

    if (tagListContainer) {
        const tagListHTML = filteredTags.map(tag => {
            const isEditing = tag.id === editingTagId;
            const style = classStyles.Neutral;
    
            if (isEditing) {
                return `
                    <li class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border-l-4 border-blue-500">
                        <form data-action="save-tag" data-tag-id="${tag.id}">
                            <div class="mb-4">
                                <label for="tag-name-edit-${tag.id}" class="block text-sm font-medium text-gray-700 dark:text-gray-300">${t('tagName')}</label>
                                <input
                                    type="text"
                                    name="tag-name"
                                    id="tag-name-edit-${tag.id}"
                                    value="${tag.name}"
                                    required
                                    class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white text-gray-900"
                                />
                            </div>
                            <div class="flex justify-end gap-3">
                                <button type="button" data-action="cancel-edit-tag" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">${t('cancel')}</button>
                                <button type="submit" class="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">${t('save')}</button>
                            </div>
                        </form>
                    </li>
                `;
            } else {
                 return `
                    <li class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow flex items-center justify-between gap-4">
                        <span class="py-1 px-3 text-sm font-medium rounded-full ${style.tag}">${tag.name}</span>
                        <div class="flex items-center gap-2">
                             <button data-action="edit-tag" data-tag-id="${tag.id}" class="px-3 py-1 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">${t('edit')}</button>
                             <button data-action="open-delete-tag-modal" data-tag-id="${tag.id}" class="px-3 py-1 text-xs font-semibold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/50 rounded-md hover:bg-red-200 dark:hover:bg-red-900">${t('delete')}</button>
                        </div>
                    </li>
                `;
            }
        }).join('');
    
        tagListContainer.innerHTML = tagListHTML || (searchQuery ? `<li class="text-center text-gray-500 dark:text-gray-400 py-8">${t('noTagsFound')}</li>` : `<li class="text-center text-gray-500 dark:text-gray-400 py-8">${t('noTagsDefined')}</li>`);
    }

    // Post-render DOM manipulations for focus handling
    if (editingTagId) {
        const editInput = document.getElementById(`tag-name-edit-${editingTagId}`);
        editInput?.focus();
        editInput?.select();
    } else {
        // Only set focus if the input isn't already focused.
        if (searchInput && document.activeElement?.id !== 'new-tag-name') {
            searchInput.focus();
            // Move cursor to the end of the input
            const val = searchInput.value;
            searchInput.value = '';
            searchInput.value = val;
        }
    }
};

const renderModals = () => {
    // Add Deck Modal
    document.querySelector('#add-deck-modal #add-deck-modal-title').textContent = t('addNewDeck');
    document.querySelector('#add-deck-modal label[for="deckName"]').textContent = t('deckName');
    document.querySelector('#add-deck-modal #deckName').placeholder = t('deckNamePlaceholder');
    document.querySelector('#add-deck-modal #deck-class-label').textContent = t('class');
    document.querySelector('#add-deck-modal #cancel-deck-button').textContent = t('cancel');
    document.querySelector('#add-deck-modal #save-deck-button').textContent = t('saveDeck');

    // Delete Deck Modal
    document.querySelector('#delete-deck-confirm-modal #delete-deck-modal-title').textContent = t('deleteDeckTitle');
    const deckToDelete = state.deckToDeleteId ? state.decks.find(d => d.id === state.deckToDeleteId) : null;
    const deckNameToDelete = deckToDelete ? deckToDelete.name : '';
    document.querySelector('#delete-deck-confirm-modal p.text-sm').innerHTML = t('deleteDeckConfirm', {name: `<strong id="deck-to-delete-name" class="font-semibold text-gray-600 dark:text-gray-300 inline-block max-w-full sm:max-w-xs truncate align-bottom" title="${deckNameToDelete}">${deckNameToDelete}</strong>`});
    document.querySelector('#delete-deck-confirm-modal #confirm-delete-deck-button').textContent = t('delete');
    document.querySelector('#delete-deck-confirm-modal #cancel-delete-deck-button').textContent = t('cancel');
    
    // Delete Tag Modal
    document.querySelector('#delete-tag-confirm-modal #delete-tag-modal-title').textContent = t('deleteTagTitle');
    const tagToDelete = state.tagToDeleteId ? state.tags.find(tag => tag.id === state.tagToDeleteId) : null;
    const tagNameToDelete = tagToDelete ? tagToDelete.name : '';
    document.querySelector('#delete-tag-confirm-modal p.text-sm').innerHTML = t('deleteTagConfirm', {name: `<strong id="tag-to-delete-name" class="font-semibold text-gray-600 dark:text-gray-300 inline-block max-w-full sm:max-w-xs truncate align-bottom" title="${tagNameToDelete}">${tagNameToDelete}</strong>`});
    document.querySelector('#delete-tag-confirm-modal #confirm-delete-tag-button').textContent = t('delete');
    document.querySelector('#delete-tag-confirm-modal #cancel-delete-tag-button').textContent = t('cancel');

    // Merge Tag Modal
    document.querySelector('#merge-tag-confirm-modal #merge-tag-modal-title').textContent = t('mergeTagsTitle');
    document.querySelector('#merge-tag-confirm-modal #confirm-merge-tag-button').textContent = t('merge');
    document.querySelector('#merge-tag-confirm-modal #cancel-merge-tag-button').textContent = t('cancel');
    const tagToMergeInfo = state.tagToMerge;
    if (tagToMergeInfo) {
        const sourceName = tagToMergeInfo.sourceTag.name;
        const targetName = tagToMergeInfo.targetTag.name;
        document.querySelector('#merge-tag-confirm-modal #merge-tag-modal-body').innerHTML = t('mergeTagsConfirm', {
            sourceName: `<strong class="font-semibold text-gray-600 dark:text-gray-300">${sourceName}</strong>`,
            targetName: `<strong class="font-semibold text-gray-600 dark:text-gray-300">${targetName}</strong>`
        });
    }

    // Delete Match Modal
    document.querySelector('#delete-match-confirm-modal #delete-match-modal-title').textContent = t('deleteMatchTitle');
    document.querySelector('#delete-match-confirm-modal p.text-sm').textContent = t('deleteMatchConfirm');
    document.querySelector('#delete-match-confirm-modal #confirm-delete-match-button').textContent = t('delete');
    document.querySelector('#delete-match-confirm-modal #cancel-delete-match-button').textContent = t('cancel');
    
    // Import Modal
    document.querySelector('#import-confirm-modal #import-modal-title').textContent = t('importTitle');
    document.querySelector('#import-confirm-modal p.text-sm').textContent = t('importConfirm');
    document.querySelector('#import-confirm-modal #confirm-merge-button').textContent = t('merge');
    document.querySelector('#import-confirm-modal #confirm-overwrite-button').textContent = t('overwrite');
    document.querySelector('#import-confirm-modal #cancel-import-button').textContent = t('cancel');

    // Reset Modal
    document.querySelector('#reset-confirm-modal #reset-modal-title').textContent = t('resetTitle');
    document.querySelector('#reset-confirm-modal p.text-sm').textContent = t('resetConfirm');
    document.querySelector('#reset-confirm-modal #confirm-reset-button').textContent = t('reset');
    document.querySelector('#reset-confirm-modal #cancel-reset-button').textContent = t('cancel');

    // Deck Notes Modal
    const { deckId, isEditing } = state.deckNotesState;
    if (deckId) {
        const deck = state.decks.find(d => d.id === deckId);
        if (deck) {
            const titleEl = deckNotesModal.querySelector('#deck-notes-modal-title');
            const contentEl = deckNotesModal.querySelector('#deck-notes-content');
            const footerEl = deckNotesModal.querySelector('#deck-notes-footer');

            const deckNameHTML = `<span class="${classStyles[deck.class].text} font-bold truncate shrink" title="${deck.name}">${deck.name}</span>`;
            titleEl.innerHTML = t('notesFor', { name: deckNameHTML });
            
            if (isEditing) {
                contentEl.innerHTML = `
                    <textarea
                        id="deck-notes-editor"
                        class="w-full h-64 p-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >${deck.notes || ''}</textarea>
                `;
                setTimeout(() => document.getElementById('deck-notes-editor')?.focus(), 0);

                footerEl.innerHTML = `
                    <button type="button" data-action="save-deck-notes" class="inline-flex justify-center w-full sm:w-auto rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        ${t('saveNotes')}
                    </button>
                    <button type="button" data-action="cancel-deck-notes-edit" class="inline-flex justify-center w-full sm:w-auto rounded-md border border-gray-300 dark:border-gray-500 shadow-sm px-4 py-2 bg-white dark:bg-gray-600 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        ${t('cancel')}
                    </button>
                `;
            } else {
                contentEl.innerHTML = `<div class="whitespace-pre-wrap break-words">${linkify(deck.notes || '') || `<span class="text-gray-500 dark:text-gray-400">${t('noNotesYet')}</span>`}</div>`;
                footerEl.innerHTML = `
                    <button type="button" data-action="edit-deck-notes" class="inline-flex justify-center w-full sm:w-auto rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        ${t('edit')}
                    </button>
                    <button type="button" data-action="close-notes-modal" class="inline-flex justify-center w-full sm:w-auto rounded-md border border-gray-300 dark:border-gray-500 shadow-sm px-4 py-2 bg-white dark:bg-gray-600 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        ${t('close')}
                    </button>
                `;
            }
        }
    }

    // Match Info Modal
    const matchInfoToShow = state.matchInfoToShow;
    if (matchInfoToShow) {
        const deck = state.decks.find(d => d.id === matchInfoToShow.deckId);
        const game = deck?.games.find(g => g.id === matchInfoToShow.gameId);
        const contentEl = matchInfoModal.querySelector('#match-info-content');
        
        if (game) {
            const tagsById = Object.fromEntries(state.tags.map(t => [t.id, t]));
            const myPills = renderTagPills(game.myTagIds, tagsById);
            const myTagsHTML = myPills ? myPills.map(p => p.outerHTML).join('') : '';

            const oppPills = renderTagPills(game.opponentTagIds, tagsById);
            const oppTagsHTML = oppPills ? oppPills.map(p => p.outerHTML).join('') : '';
            
            const locale = state.language === 'ja' ? 'ja-JP' : undefined;
            const dateString = new Date(game.timestamp).toLocaleString(locale, { dateStyle: 'long', timeStyle: 'short'});

            let tagsHTML = '';
            if (myTagsHTML || oppTagsHTML) {
                tagsHTML = `
                    ${myTagsHTML ? `<div><h4 class="font-semibold text-gray-800 dark:text-gray-100 mb-1">${t('myTags')}</h4><div class="flex flex-wrap gap-2">${myTagsHTML}</div></div>` : ''}
                    ${oppTagsHTML ? `<div><h4 class="font-semibold text-gray-800 dark:text-gray-100 mb-1">${t('opponentTags')}</h4><div class="flex flex-wrap gap-2">${oppTagsHTML}</div></div>` : ''}
                `;
            } else {
                tagsHTML = `<p class="text-gray-500 dark:text-gray-400">${t('noTagsForMatch')}</p>`;
            }

            contentEl.innerHTML = `
                <div>
                    <h4 class="font-semibold text-gray-800 dark:text-gray-100">${t('recordedAt')}</h4>
                    <p>${dateString}</p>
                </div>
                ${tagsHTML}
            `;
        } else {
            contentEl.innerHTML = `<p>Match data not found.</p>`;
        }
        matchInfoModal.querySelector('#match-info-modal-title').textContent = t('matchDetails');
        matchInfoModal.querySelector('[data-action="close-match-info-modal"]').textContent = t('close');
    }
    
    // Tag Filter Modal
    if (tagFilterModal && !tagFilterModal.classList.contains('hidden') && state.view.type === 'stats') {
        renderTagFilterModalContent();
    }
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
        case 'manage_tags':
            renderManageTagsView();
            break;
        case 'list':
        default:
            renderDeckList();
            break;
    }
    renderModals();
};