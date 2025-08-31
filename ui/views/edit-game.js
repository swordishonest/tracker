/**
 * @fileoverview This file is responsible for rendering the "Edit Game" screen.
 * It is a variant of the "Add Game" screen, pre-populated with data from an existing match,
 * allowing the user to modify and save changes.
 */

import { state, classStyles, getTranslated, getTranslatedClassName, TURN_NAMES, RESULT_NAMES, addTag, updateTagUsage } from '../../store.js';
import { t, renderTagPills, createClassSelector } from '../helpers.js';

const appContainer = document.getElementById('app');

// --- EDIT GAME VIEW STATE ---
let editGameLocalState = null;

/**
 * Resets the local state of the Edit Game view. Called when navigating away.
 */
export const resetEditGameState = () => {
    editGameLocalState = null;
};

/**
 * Renders the entire "Edit Game" view.
 * @param {string} deckId The ID of the deck to which the game belongs.
 * @param {string} gameId The ID of the game being edited.
 * @param {function():void} render The main render function for re-renders.
 */
export const renderEditGameView = (deckId, gameId, render) => {
    const deckList = state.mode === 'takeTwo' ? state.takeTwoDecks : state.decks;
    const deck = deckList.find(d => d.id === deckId);
    const game = deck ? deck.games.find(g => g.id === gameId) : null;
    
    if (!deck || !game) {
        appContainer.innerHTML = `<p>Match not found</p>`;
        return;
    }
    
    // Initialize local state if it's the first time rendering this view
    if (!editGameLocalState || editGameLocalState.gameId !== gameId) {
        editGameLocalState = {
            deckId: deckId,
            gameId: gameId,
            opponentClass: game.opponentClass,
            turn: game.turn,
            result: game.result,
            mySelectedTagIds: [...(game.myTagIds || [])],
            opponentSelectedTagIds: [...(game.opponentTagIds || [])],
        };
    }

    // --- Main view template ---
    appContainer.innerHTML = `
        <main class="w-full max-w-2xl mx-auto">
            <div class="flex items-center gap-4 mb-4">
                <button data-action="cancel-edit-game" class="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    <svg class="w-4 h-4 pointer-events-none" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
                    ${t('cancel')}
                </button>
                <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 truncate">
                    ${t('editMatchTitle')}
                </h2>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
                <form id="edit-game-form" class="space-y-6" novalidate>
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
                         <button id="save-game-button" type="button" data-action="save-edited-game" disabled class="w-full px-4 py-3 font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 bg-gray-400 text-gray-100 cursor-not-allowed ring-gray-400">
                            ${t('saveChanges')}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    `;

    // --- Post-render logic for this specific view ---
    const form = document.getElementById('edit-game-form');
    
    const updateFormDataset = () => {
        form.dataset.opponentClass = editGameLocalState.opponentClass;
        form.dataset.turn = editGameLocalState.turn;
        form.dataset.result = editGameLocalState.result;
        form.dataset.myTagIds = JSON.stringify(editGameLocalState.mySelectedTagIds);
        form.dataset.opponentTagIds = JSON.stringify(editGameLocalState.opponentSelectedTagIds);
    };
    
    const checkFormComplete = () => {
        const saveButton = document.getElementById('save-game-button');
        if (editGameLocalState.opponentClass && editGameLocalState.turn && editGameLocalState.result) {
            saveButton.disabled = false;
            saveButton.className = 'w-full px-4 py-3 font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 bg-blue-600 text-white hover:bg-blue-700 ring-blue-500';
        } else {
            saveButton.disabled = true;
            saveButton.className = 'w-full px-4 py-3 font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 bg-gray-400 text-gray-100 cursor-not-allowed ring-gray-400';
        }
        updateFormDataset();
    };
    
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
                if (suggestions.length > 0) { e.preventDefault(); highlightedIndex = (highlightedIndex + 1) % suggestions.length; updateHighlight(); }
            } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
                if (suggestions.length > 0) { e.preventDefault(); highlightedIndex = (highlightedIndex - 1 + suggestions.length) % suggestions.length; updateHighlight(); }
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
                e.preventDefault(); e.stopPropagation(); suggestionsContainer.classList.add('hidden');
            }
        });

        updatePills();
        updateActionButtonState('');
    };
    
    const renderAllTagInputs = () => {
        if (!state.addGameTagsExpanded) {
            document.getElementById('my-tags-container').innerHTML = '';
            document.getElementById('opponent-tags-container').innerHTML = '';
            return;
        }

        const myTagUpdateCallback = (updatedSelectedIds) => {
            editGameLocalState.mySelectedTagIds = updatedSelectedIds;
            setTimeout(render, 0);
        };

        const opponentTagUpdateCallback = (updatedSelectedIds) => {
            editGameLocalState.opponentSelectedTagIds = updatedSelectedIds;
            setTimeout(render, 0);
        };

        renderTagInput('my-tags-container', t('myTags'), editGameLocalState.mySelectedTagIds, myTagUpdateCallback);
        renderTagInput('opponent-tags-container', t('opponentTags'), editGameLocalState.opponentSelectedTagIds, opponentTagUpdateCallback);
    };
    
    const renderGameClassSelector = () => {
        const container = document.getElementById('game-class-selector-container');
        container.innerHTML = '';
        const selector = createClassSelector(editGameLocalState.opponentClass, (cls) => {
            editGameLocalState.opponentClass = cls;
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
        const isSelected = btn.dataset.value === editGameLocalState.turn;
        btn.setAttribute('aria-pressed', String(isSelected));
        btn.className = `w-full text-center px-4 py-3 font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 transform hover:-translate-y-px ${
            isSelected ? 'bg-blue-600 text-white shadow-md ring-blue-500' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 ring-blue-500'
        }`;
    });
    
    document.getElementById('turn-selector').addEventListener('click', e => {
        if (e.target.tagName === 'BUTTON') {
            editGameLocalState.turn = e.target.dataset.value;
            checkFormComplete();
            document.querySelectorAll('#turn-selector button').forEach(btn => {
                const isSelected = btn.dataset.value === editGameLocalState.turn;
                btn.setAttribute('aria-pressed', String(isSelected));
                btn.className = `w-full text-center px-4 py-3 font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 transform hover:-translate-y-px ${
                    isSelected ? 'bg-blue-600 text-white shadow-md ring-blue-500' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 ring-blue-500'
                }`;
            });
        }
    });
    
    document.querySelectorAll('#result-selector button').forEach(btn => {
        const isSelected = btn.dataset.value === editGameLocalState.result;
        btn.setAttribute('aria-pressed', String(isSelected));
        if (isSelected) {
            const styleClass = editGameLocalState.result === 'Win' ? 'bg-green-600 text-white shadow-md ring-green-500' : 'bg-red-600 text-white shadow-md ring-red-500';
            btn.className = `w-full text-center px-4 py-3 font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 transform hover:-translate-y-px ${styleClass}`;
        } else {
            const originalStyle = btn.dataset.value === 'Win' ? 'bg-green-100 text-green-800 hover:bg-green-200 ring-green-500' : 'bg-red-100 text-red-800 hover:bg-red-200 ring-red-500';
            btn.className = `w-full text-center px-4 py-3 font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 transform hover:-translate-y-px ${originalStyle}`;
        }
    });

    document.getElementById('result-selector').addEventListener('click', e => {
        if (e.target.tagName === 'BUTTON') {
            editGameLocalState.result = e.target.dataset.value;
            checkFormComplete();
            document.querySelectorAll('#result-selector button').forEach(btn => {
                const isSelected = btn.dataset.value === editGameLocalState.result;
                btn.setAttribute('aria-pressed', String(isSelected));
                if (isSelected) {
                    const styleClass = editGameLocalState.result === 'Win' ? 'bg-green-600 text-white shadow-md ring-green-500' : 'bg-red-600 text-white shadow-md ring-red-500';
                    btn.className = `w-full text-center px-4 py-3 font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 transform hover:-translate-y-px ${styleClass}`;
                } else {
                    const originalStyle = btn.dataset.value === 'Win' ? 'bg-green-100 text-green-800 hover:bg-green-200 ring-green-500' : 'bg-red-100 text-red-800 hover:bg-red-200 ring-red-500';
                    btn.className = `w-full text-center px-4 py-3 font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 transform hover:-translate-y-px ${originalStyle}`;
                }
            });
        }
    });
    
    checkFormComplete();
};