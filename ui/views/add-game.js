/**
 * @fileoverview This file is responsible for rendering the "Add Game" screen.
 * It includes logic for selecting opponent class, turn, result, and adding tags.
 * It maintains its own local state for the form inputs, which is reset when the view changes.
 */


import { state, classStyles, getTranslated, getTranslatedClassName, TURN_NAMES, RESULT_NAMES, addTag, updateTagUsage } from '../../store.js';
import { t, renderTagPills, createClassSelector } from '../helpers.js';

const appContainer = document.getElementById('app');

// --- ADD GAME VIEW STATE ---
// This local state is specific to the Add Game view to hold form data temporarily
// before it's saved. It's separate from the main app state.
let addGameLocalState = null;

/**
 * Resets the local state of the Add Game view. Called when navigating away.
 */
export const resetAddGameState = () => {
    addGameLocalState = null;
};

/**
 * Clears user selections within the Add Game form, allowing for another entry
 * without leaving the view.
 */
export const clearAddGameSelections = () => {
    if (addGameLocalState) {
        addGameLocalState.opponentClass = null;
        addGameLocalState.turn = null;
        addGameLocalState.result = null;
        addGameLocalState.mySelectedTagIds = [];
        addGameLocalState.opponentSelectedTagIds = [];
    }
};

/**
 * Renders the entire "Add Game" view.
 * @param {string} deckId The ID of the deck for which a game is being added.
 * @param {function():void} render The main render function, passed in to allow for re-renders from within this view (e.g., when updating tags).
 */
export const renderAddGameView = (deckId, render) => {
    const deckList = state.mode === 'takeTwo' ? state.takeTwoDecks : state.decks;
    const deck = deckList.find(d => d.id === deckId);
    if (!deck) {
        appContainer.innerHTML = `<p>Deck not found</p>`;
        return;
    }
    
    // Initialize local state if it's the first time rendering this view
    // or if the deck has changed.
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

    const availableDecks = state.mode === 'takeTwo' ? state.takeTwoDecks : state.decks;

    // --- Main view template ---
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
                            ${availableDecks.map(d => `<li><button data-action="switch-add-game-deck" data-deck-id="${d.id}" class="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors ${d.id === deck.id ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-700 dark:text-gray-300'}">${d.name} <span class="text-xs ${classStyles[d.class].text}">(${getTranslatedClassName(d.class)})</span></button></li>`).join('')}
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
    
    /** Stores the current selections from local state into the form's dataset attributes. */
    const updateFormDataset = () => {
        form.dataset.opponentClass = addGameLocalState.opponentClass;
        form.dataset.turn = addGameLocalState.turn;
        form.dataset.result = addGameLocalState.result;
        form.dataset.myTagIds = JSON.stringify(addGameLocalState.mySelectedTagIds);
        form.dataset.opponentTagIds = JSON.stringify(addGameLocalState.opponentSelectedTagIds);
    };
    
    /** Checks if all required fields are filled and enables/disables the save button. */
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
    
    /**
     * Renders a tag input component with search, suggestions, and creation capabilities.
     * @param {string} containerId The ID of the element to render the component into.
     * @param {string} label The label text for the input.
     * @param {string[]} selectedTagIds An array of IDs for the currently selected tags.
     * @param {function(string[]):void} onUpdate A callback function to execute when the selection changes.
     */
    const renderTagInput = (containerId, label, selectedTagIds, onUpdate) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <label for="${containerId}-input" class="block text-sm font-medium text-gray-700 dark:text-gray-300">${label}</label>
            <div class="mt-1 relative">
                <div class="w-full flex items-center gap-2 pr-1 pl-2 min-h-[42px] border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700">
                    <input type="text" id="${containerId}-input" placeholder="${t('addTagPlaceholder')}" class="flex-grow min-w-0 p-0 border-none focus:ring-0 bg-transparent dark:placeholder-gray-400 dark:text-white text-gray-900" autocomplete="off">
                    <button type="button" id="${containerId}-action-btn" class="flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors duration-150 disabled:bg-gray-200 dark:disabled:bg-gray-600 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed" disabled>
                        ${t('createTagButton')}
                    </button>
                </div>
                <div id="${containerId}-suggestions" class="hidden absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border dark:border-gray-700 max-h-60 overflow-y-auto"></div>
            </div>
            <div id="${containerId}-pills" class="mt-2 flex flex-wrap gap-1.5 items-center min-h-[1rem]"></div>
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
    
    // Set initial state for Turn selector
    document.querySelectorAll('#turn-selector button').forEach(btn => {
        const isSelected = btn.dataset.value === addGameLocalState.turn;
        btn.setAttribute('aria-pressed', String(isSelected));
        btn.className = `w-full text-center px-4 py-3 font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 transform hover:-translate-y-px ${
            isSelected ? 'bg-blue-600 text-white shadow-md ring-blue-500' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 ring-blue-500'
        }`;
    });
    
    // Add event listener for Turn selector
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
    
    // Set initial state for Result selector
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

    // Add event listener for Result selector
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
