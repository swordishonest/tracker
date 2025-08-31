/**
 * @fileoverview This file manages all modal dialogs in the application.
 * It includes functions for rendering modal content, handling their state,
 * and controlling their visibility (opening and closing).
 */


import { state, setDeckNotesState, setNewDeckClass, setTagToDeleteId, setTagToMerge, addTag, setNewTakeTwoResult, setRunToDelete, getTranslated, getTranslatedClassName, classStyles, RESULT_NAMES, TURN_NAMES, setDeckToDeleteId } from '../store.js';
import { t, checkDeckFormValidity, createClassSelector, renderTagPills, linkify } from './helpers.js';

// --- DOM CACHE ---
// Caching modal elements for quick access.
const addDeckModal = document.getElementById('add-deck-modal');
const addResultModal = document.getElementById('add-result-modal');
const deleteDeckConfirmModal = document.getElementById('delete-deck-confirm-modal');
const deleteMatchConfirmModal = document.getElementById('delete-match-confirm-modal');
const deleteResultConfirmModal = document.getElementById('delete-result-confirm-modal');
const deleteTagConfirmModal = document.getElementById('delete-tag-confirm-modal');
const mergeTagConfirmModal = document.getElementById('merge-tag-confirm-modal');
const importConfirmModal = document.getElementById('import-confirm-modal');
const resetConfirmModal = document.getElementById('reset-confirm-modal');
const deckNotesModal = document.getElementById('deck-notes-modal');
const matchInfoModal = document.getElementById('match-info-modal');
const tagFilterModal = document.getElementById('tag-filter-modal');

// --- MODAL HELPERS & RENDERERS ---

/**
 * Checks the validity of the "Add Result" form (for Take Two mode)
 * and enables/disables the save button accordingly.
 */
const checkResultFormValidity = () => {
    const saveResultButton = document.getElementById('save-result-button');
    if (!saveResultButton) return;

    const { class: selectedClass, wins, losses } = state.newTakeTwoResult;
    const isClassValid = selectedClass !== null;
    const isWinsValid = wins !== null;
    const isLossesValid = losses !== null;
    
    if (isClassValid && isWinsValid && isLossesValid) {
        saveResultButton.disabled = false;
        saveResultButton.className = 'px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';
    } else {
        saveResultButton.disabled = true;
        saveResultButton.className = 'px-4 py-2 bg-gray-400 text-white font-semibold rounded-md shadow-sm cursor-not-allowed';
    }
};

/**
 * Renders the class selector component inside the "Add Deck" modal.
 */
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

/**
 * Renders the entire content of the "Add Result" modal for Take Two,
 * including class, wins, and losses selectors.
 */
const renderAddResultModal = () => {
    // Localize static text
    document.getElementById('add-result-modal-title').textContent = t('addTakeTwoResultTitle');
    document.getElementById('result-class-label').textContent = t('class');
    document.getElementById('result-wins-label').textContent = t('wins');
    document.getElementById('result-losses-label').textContent = t('losses');
    addResultModal.querySelector('[data-action="close-add-result-modal"]').textContent = t('cancel');
    document.getElementById('save-result-button').textContent = t('saveResult');

    // Class selector
    const classContainer = document.getElementById('modal-result-class-selector-container');
    classContainer.innerHTML = '';
    const classSelector = createClassSelector(state.newTakeTwoResult.class, (cls) => {
        setNewTakeTwoResult({ ...state.newTakeTwoResult, class: cls });
        renderAddResultModal();
        checkResultFormValidity();
    });
    const neutralButton = Array.from(classSelector.children).find(child => (child.textContent || child.querySelector('label')?.textContent) === getTranslatedClassName('Neutral'));
    if (neutralButton) neutralButton.remove();
    classContainer.appendChild(classSelector);

    // Wins selector
    const winsContainer = document.getElementById('modal-wins-selector-container');
    winsContainer.innerHTML = '';
    for (let i = 0; i <= 7; i++) {
        const isSelected = state.newTakeTwoResult.wins === i;
        const isDisabled = state.newTakeTwoResult.losses === 2 && i === 7;
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = i;
        button.dataset.value = i;
        button.disabled = isDisabled;
        button.className = `w-full text-center px-2 py-2 text-sm font-medium rounded-md focus:outline-none transition-all duration-150 transform hover:-translate-y-px focus:ring-2 focus:ring-offset-2 ring-blue-500 ${
            isSelected
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
        } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`;
        button.addEventListener('click', () => {
            let newLosses = state.newTakeTwoResult.losses;
            if (i === 7 && newLosses === 2) {
                newLosses = null;
            }
            setNewTakeTwoResult({ ...state.newTakeTwoResult, wins: i, losses: newLosses });
            renderAddResultModal();
            checkResultFormValidity();
        });
        winsContainer.appendChild(button);
    }

    // Losses selector
    const lossesContainer = document.getElementById('modal-losses-selector-container');
    lossesContainer.innerHTML = '';
    for (let i = 0; i <= 2; i++) {
        const isSelected = state.newTakeTwoResult.losses === i;
        const isDisabled = state.newTakeTwoResult.wins === 7 && i === 2;
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = i;
        button.dataset.value = i;
        button.disabled = isDisabled;
        button.className = `w-full text-center px-2 py-2 text-sm font-medium rounded-md focus:outline-none transition-all duration-150 transform hover:-translate-y-px focus:ring-2 focus:ring-offset-2 ring-blue-500 ${
            isSelected
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
        } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`;
        button.addEventListener('click', () => {
            let newWins = state.newTakeTwoResult.wins;
            if (i === 2 && newWins === 7) {
                newWins = null;
            }
            setNewTakeTwoResult({ ...state.newTakeTwoResult, losses: i, wins: newWins });
            renderAddResultModal();
            checkResultFormValidity();
        });
        lossesContainer.appendChild(button);
    }
};

/**
 * Renders the content for the "Filter by Tags" modal.
 * This is a complex component with its own local state that manages
 * tag selection for include/exclude filters for both player and opponent.
 * It recursively re-renders itself on user input.
 */
const renderTagFilterModalContent = () => {
    const formContainer = tagFilterModal.querySelector('div');
    const formId = 'tag-filter-form';

    // Keep a mutable copy of the filters that lives for the lifetime of the modal's open state.
    // This is the source of truth for the modal's UI.
    const localFilterState = JSON.parse(JSON.stringify(state.view.tagFilter || { my: { include: [], exclude: [] }, opp: { include: [], exclude: [] } }));

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

        const clearButton = formContainer.querySelector('[data-action="clear-tag-filters"]');
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                localFilterState.my = { include: [], exclude: [] };
                localFilterState.opp = { include: [], exclude: [] };
                rerender();
            });
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


// --- MODAL VISIBILITY ---
// The following functions handle the showing and hiding of modals.
// They manipulate CSS classes to control visibility and animations.

/** Opens the "Add Deck" modal. */
export const openAddDeckModal = () => {
    document.getElementById('deckName').value = '';
    setNewDeckClass(null);
    renderModalClassSelector();
    checkDeckFormValidity();
    addDeckModal.classList.remove('hidden');
    addDeckModal.querySelector('div').classList.add('animate-fade-in-up');
};
/** Closes the "Add Deck" modal. */
export const closeAddDeckModal = () => {
    addDeckModal.classList.add('hidden');
    addDeckModal.querySelector('div').classList.remove('animate-fade-in-up');
};

/** Opens the "Add Result" modal (for Take Two). */
export const openAddResultModal = () => {
    setNewTakeTwoResult({ class: null, wins: null, losses: null });
    renderAddResultModal();
    checkResultFormValidity();
    addResultModal.classList.remove('hidden');
    addResultModal.querySelector('div').classList.add('animate-fade-in-up');
};
/** Closes the "Add Result" modal. */
export const closeAddResultModal = () => {
    addResultModal.classList.add('hidden');
    addResultModal.querySelector('div').classList.remove('animate-fade-in-up');
    setNewTakeTwoResult({ class: null, wins: null, losses: null });
};

/** Opens the "Delete Deck" confirmation modal. */
export const openDeleteDeckModal = (deckId) => {
    setDeckToDeleteId(deckId);
    renderModals();
    deleteDeckConfirmModal.classList.remove('hidden');
    deleteDeckConfirmModal.querySelector('div').classList.add('animate-fade-in-up');
};
/** Closes the "Delete Deck" confirmation modal. */
export const closeDeleteDeckModal = () => {
    setDeckToDeleteId(null);
    deleteDeckConfirmModal.classList.add('hidden');
    deleteDeckConfirmModal.querySelector('div').classList.remove('animate-fade-in-up');
};

/** Opens the "Delete Tag" confirmation modal. */
export const openDeleteTagModal = (tagId) => {
    setTagToDeleteId(tagId);
    renderModals();
    deleteTagConfirmModal.classList.remove('hidden');
    deleteTagConfirmModal.querySelector('div').classList.add('animate-fade-in-up');
};
/** Closes the "Delete Tag" confirmation modal. */
export const closeDeleteTagModal = () => {
    setTagToDeleteId(null);
    deleteTagConfirmModal.classList.add('hidden');
    deleteTagConfirmModal.querySelector('div').classList.remove('animate-fade-in-up');
};

/** Opens the "Merge Tag" confirmation modal. */
export const openMergeTagModal = () => {
    renderModals();
    mergeTagConfirmModal.classList.remove('hidden');
    mergeTagConfirmModal.querySelector('div').classList.add('animate-fade-in-up');
};
/** Closes the "Merge Tag" confirmation modal. */
export const closeMergeTagModal = () => {
    setTagToMerge(null);
    mergeTagConfirmModal.classList.add('hidden');
    mergeTagConfirmModal.querySelector('div').classList.remove('animate-fade-in-up');
};

/** Opens the "Delete Match" confirmation modal. */
export const openDeleteMatchModal = (deckId, gameId) => {
    state.matchToDelete = { deckId, gameId };
    deleteMatchConfirmModal.classList.remove('hidden');
    deleteMatchConfirmModal.querySelector('div').classList.add('animate-fade-in-up');
};
/** Closes the "Delete Match" confirmation modal. */
export const closeDeleteMatchModal = () => {
    state.matchToDelete = null;
    deleteMatchConfirmModal.classList.add('hidden');
    deleteMatchConfirmModal.querySelector('div').classList.remove('animate-fade-in-up');
};

/** Opens the "Delete Result" (Take Two run) confirmation modal. */
export const openDeleteResultModal = (deckId, runId) => {
    setRunToDelete({ deckId, runId });
    renderModals();
    deleteResultConfirmModal.classList.remove('hidden');
    deleteResultConfirmModal.querySelector('div').classList.add('animate-fade-in-up');
};
/** Closes the "Delete Result" confirmation modal. */
export const closeDeleteResultModal = () => {
    setRunToDelete(null);
    deleteResultConfirmModal.classList.add('hidden');
    deleteResultConfirmModal.querySelector('div').classList.remove('animate-fade-in-up');
};

/** Opens the "Match Info" modal to show details of a single match. */
export const openMatchInfoModal = (deckId, gameId) => {
    state.matchInfoToShow = { deckId, gameId };
    renderModals();
    matchInfoModal.classList.remove('hidden');
    matchInfoModal.querySelector('div').classList.add('animate-fade-in-up');
};
/** Closes the "Match Info" modal. */
export const closeMatchInfoModal = () => {
    state.matchInfoToShow = null;
    matchInfoModal.classList.add('hidden');
    matchInfoModal.querySelector('div').classList.remove('animate-fade-in-up');
};

/** Opens the "Deck Notes" modal. */
export const openNotesModal = (deckId) => {
    setDeckNotesState({ deckId, isEditing: false });
    renderModals();
    deckNotesModal.classList.remove('hidden');
    deckNotesModal.querySelector('div').classList.add('animate-fade-in-up');
};
/** Closes the "Deck Notes" modal. */
export const closeNotesModal = () => {
    setDeckNotesState({ deckId: null, isEditing: false });
    deckNotesModal.classList.add('hidden');
    deckNotesModal.querySelector('div').classList.remove('animate-fade-in-up');
};

/** Opens the "Filter by Tags" modal. */
export const openTagFilterModal = () => {
    renderTagFilterModalContent();
    tagFilterModal.classList.remove('hidden');
    tagFilterModal.querySelector('div').classList.add('animate-fade-in-up');
};
/** Closes the "Filter by Tags" modal. */
export const closeTagFilterModal = () => {
    tagFilterModal.classList.add('hidden');
    tagFilterModal.querySelector('div').classList.remove('animate-fade-in-up');
};

/** Opens the "Import Data" confirmation modal. */
export const openImportModal = () => {
    importConfirmModal.classList.remove('hidden');
    importConfirmModal.querySelector('div').classList.add('animate-fade-in-up');
};
/** Closes the "Import Data" confirmation modal. */
export const closeImportModal = () => {
    state.fileToImport = null;
    document.getElementById('import-file-input').value = null;
    importConfirmModal.classList.add('hidden');
    importConfirmModal.querySelector('div').classList.remove('animate-fade-in-up');
};

/** Opens the "Reset All Data" confirmation modal. */
export const openResetModal = () => {
    resetConfirmModal.classList.remove('hidden');
    resetConfirmModal.querySelector('div').classList.add('animate-fade-in-up');
};
/** Closes the "Reset All Data" confirmation modal. */
export const closeResetModal = () => {
    resetConfirmModal.classList.add('hidden');
    resetConfirmModal.querySelector('div').classList.remove('animate-fade-in-up');
};


/**
 * Main function to update the content of all modals based on the current application state.
 * This is called from the main `render` function to ensure modals are always up-to-date
 * with the correct data (e.g., the name of the deck to be deleted).
 */
export const renderModals = () => {
    /**
     * Safely creates an HTML string for a styled name.
     * @param {string} name The text content to display.
     * @returns {string} The HTML string for a `<strong>` element.
     */
    const createNameSpan = (name) => {
        const strong = document.createElement('strong');
        strong.className = 'text-gray-600 dark:text-gray-300';
        strong.textContent = name;
        return strong.outerHTML;
    };

    // --- Delete Deck Confirmation Modal ---
    const deckToDeleteId = state.deckToDeleteId;
    if (deckToDeleteId) {
        const deckList = state.mode === 'takeTwo' ? state.takeTwoDecks : state.decks;
        const deck = deckList.find(d => d.id === deckToDeleteId);
        if (deck) {
            const isTakeTwo = state.mode === 'takeTwo';
            document.getElementById('delete-deck-modal-title').textContent = isTakeTwo ? t('resetClassTitle') : t('deleteDeckTitle');
            const confirmTextPara = deleteDeckConfirmModal.querySelector('p');
            if (confirmTextPara) {
                confirmTextPara.innerHTML = isTakeTwo
                    ? t('resetClassConfirm', { name: createNameSpan(deck.name) })
                    : t('deleteDeckConfirm', { name: createNameSpan(deck.name) });
            }
            document.getElementById('confirm-delete-deck-button').textContent = isTakeTwo ? t('reset') : t('delete');
        }
    }
    // --- Delete Tag Confirmation Modal ---
    const tagToDeleteId = state.tagToDeleteId;
    if (tagToDeleteId) {
        const tag = state.tags.find(t => t.id === tagToDeleteId);
        if (tag) {
            const confirmTextPara = deleteTagConfirmModal.querySelector('p');
            if (confirmTextPara) {
                confirmTextPara.innerHTML = t('deleteTagConfirm', { name: createNameSpan(tag.name) });
            }
        }
    }
    // --- Merge Tag Confirmation Modal ---
    const tagToMerge = state.tagToMerge;
    if (tagToMerge) {
        const bodyPara = mergeTagConfirmModal.querySelector('#merge-tag-modal-body');
        if (bodyPara) {
            bodyPara.innerHTML = t('mergeTagsConfirm', {
                sourceName: createNameSpan(tagToMerge.sourceTag.name),
                targetName: createNameSpan(tagToMerge.targetTag.name)
            });
        }
    }
    // --- Delete Result Confirmation Modal ---
    document.getElementById('delete-result-modal-title').textContent = t('deleteResultTitle');
    document.querySelector('#delete-result-confirm-modal p').textContent = t('deleteResultConfirm');
    document.getElementById('confirm-delete-result-button').textContent = t('delete');
    document.getElementById('cancel-delete-result-button').textContent = t('cancel');

    // --- Deck Notes Modal ---
    const deckNotesState = state.deckNotesState;
    if (deckNotesState.deckId) {
        const deckList = state.mode === 'takeTwo' ? state.takeTwoDecks : state.decks;
        const deck = deckList.find(d => d.id === deckNotesState.deckId);
        if(deck) {
            const titleEl = document.getElementById('deck-notes-modal-title');
            const contentEl = document.getElementById('deck-notes-content');
            const footerEl = document.getElementById('deck-notes-footer');
            const style = classStyles[deck.class];

            titleEl.innerHTML = `
                <span class="px-2 py-0.5 text-xs font-semibold rounded-full ${style.bg} ${style.text}">${getTranslatedClassName(deck.class)}</span>
                <span class="font-bold">${deck.name}</span>
            `;

            if (deckNotesState.isEditing) {
                contentEl.innerHTML = `<textarea class="w-full h-48 p-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 dark:text-gray-300" placeholder="${t('addNotes')}">${deck.notes || ''}</textarea>`;
                footerEl.innerHTML = `
                    <button data-action="save-deck-notes" class="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">${t('saveNotes')}</button>
                    <button data-action="cancel-deck-notes-edit" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">${t('cancel')}</button>
                `;
                contentEl.querySelector('textarea').focus();
            } else {
                contentEl.innerHTML = deck.notes ? `<div class="prose prose-sm dark:prose-invert max-w-none">${linkify(deck.notes)}</div>` : `<p class="italic text-gray-500 dark:text-gray-400">${t('noNotesYet')}</p>`;
                footerEl.innerHTML = `
                    <button data-action="edit-deck-notes" class="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">${deck.notes ? t('editNotes') : t('addNotes')}</button>
                    <button data-action="close-notes-modal" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">${t('close')}</button>
                `;
            }
        }
    }
    // --- Match Info Modal ---
    const matchInfoToShow = state.matchInfoToShow;
    if (matchInfoToShow) {
        const { deckId, gameId } = matchInfoToShow;
        const deckList = state.mode === 'takeTwo' ? state.takeTwoDecks : state.decks;
        const deck = deckList.find(d => d.id === deckId);
        if (deck) {
            const game = deck.games.find(g => g.id === gameId);
            if(game) {
                document.getElementById('match-info-modal-title').textContent = t('matchDetails');
                const tagsById = Object.fromEntries(state.tags.map(t => [t.id, t]));
                const myTagPills = (game.myTagIds && game.myTagIds.length > 0) ? renderTagPills(game.myTagIds, tagsById).map(p => p.outerHTML).join('') : `<p class="text-xs italic text-gray-500 dark:text-gray-400">${t('noTagsForMatch')}</p>`;
                const opponentTagPills = (game.opponentTagIds && game.opponentTagIds.length > 0) ? renderTagPills(game.opponentTagIds, tagsById).map(p => p.outerHTML).join('') : `<p class="text-xs italic text-gray-500 dark:text-gray-400">${t('noTagsForMatch')}</p>`;

                document.getElementById('match-info-content').innerHTML = `
                    <div><strong>${t('opponentClass')}:</strong> <span class="${classStyles[game.opponentClass].text}">${getTranslatedClassName(game.opponentClass)}</span></div>
                    <div><strong>${t('turn')}:</strong> ${getTranslated(TURN_NAMES, game.turn)}</div>
                    <div><strong>${t('result')}:</strong> <span class="${game.result === 'Win' ? 'text-green-600' : 'text-red-600'}">${getTranslated(RESULT_NAMES, game.result)}</span></div>
                    <div><strong>${t('recordedAt')}:</strong> ${new Date(game.timestamp).toLocaleString(state.language === 'ja' ? 'ja-JP' : undefined)}</div>
                    <div class="border-t pt-3 mt-3">
                        <strong class="block mb-2">${t('myTags')}:</strong>
                        <div class="flex flex-wrap gap-2">${myTagPills}</div>
                    </div>
                    <div class="border-t pt-3 mt-3">
                        <strong class="block mb-2">${t('opponentTags')}:</strong>
                        <div class="flex flex-wrap gap-2">${opponentTagPills}</div>
                    </div>
                `;

                const footerEl = document.getElementById('match-info-footer');
                if (footerEl) {
                    footerEl.innerHTML = `
                        <button type="button" data-action="close-match-info-modal" class="inline-flex justify-center w-full sm:w-auto rounded-md border border-gray-300 dark:border-gray-500 shadow-sm px-4 py-2 bg-white dark:bg-gray-600 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            ${t('close')}
                        </button>
                        <button type="button" data-action="edit-match" data-deck-id="${deckId}" data-game-id="${gameId}" class="inline-flex justify-center w-full sm:w-auto rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            ${t('edit')}
                        </button>
                    `;
                }
            }
        }
    }
};