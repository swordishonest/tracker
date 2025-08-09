/**
 * @fileoverview This file is responsible for rendering the "Manage Tags" view.
 * It allows users to view, search, add, edit, and delete tags.
 */

import { state, classStyles } from '../../store.js';
import { t } from '../helpers.js';

const appContainer = document.getElementById('app');

/**
 * Renders the tag management view.
 * This function handles the initial setup of the view's static structure
 * and then populates the dynamic list of tags based on the current state,
 * including any active search query or editing state.
 */
export const renderManageTagsView = () => {
    // If the main view container for this screen doesn't exist, create its skeleton.
    // This part runs only once when navigating to the screen.
    if (!document.getElementById('manage-tags-view')) {
        appContainer.innerHTML = `
            <main id="manage-tags-view" class="w-full max-w-2xl mx-auto">
                <div class="flex items-center gap-4 mb-4">
                    <button data-action="back-to-stats" class="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                        <svg class="w-4 h-4 pointer-events-none" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
                        ${t('backToStats')}
                    </button>
                    <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100">${t('manageTags')}</h2>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 space-y-6">
                    <div>
                        <form id="add-tag-form" class="flex gap-2">
                            <label for="new-tag-name" class="sr-only">${t('addOrSearchTags')}</label>
                            <input type="text" id="new-tag-name" name="new-tag-name" placeholder="${t('tagSearchPlaceholder')}" class="flex-grow w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white text-gray-900">
                            <button type="submit" class="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">${t('addNewTag')}</button>
                        </form>
                    </div>

                    <div id="tags-list-container" class="space-y-2">
                        <!-- Tag list will be rendered here -->
                    </div>
                </div>
            </main>
        `;
    }
    
    // This part runs on every render to update the dynamic content.
    const container = document.getElementById('tags-list-container');
    const newTagNameInput = document.getElementById('new-tag-name');
    if (!container || !newTagNameInput) return;

    // Set the search input value from the state.
    newTagNameInput.value = state.view.tagSearchQuery || '';

    // Filter tags based on the search query and sort them by most recently used.
    const sortedTags = state.tags
        .filter(tag => !state.view.tagSearchQuery || tag.name.toLowerCase().includes(state.view.tagSearchQuery.toLowerCase()))
        .sort((a, b) => (state.tagUsage[b.id] || 0) - (state.tagUsage[a.id] || 0));

    // Display a message if no tags have been created yet.
    if (sortedTags.length === 0 && !state.view.tagSearchQuery) {
        container.innerHTML = `<p class="text-center text-gray-500 dark:text-gray-400 py-4">${t('noTagsDefined')}</p>`;
        return;
    }

    // Generate HTML for each tag, conditionally showing an edit form or display row.
    container.innerHTML = sortedTags.map(tag => {
        const isEditing = state.view.type === 'manage_tags' && state.view.editingTagId === tag.id;
        
        if (isEditing) {
            // Render the edit form for the tag currently being edited.
            return `
                <form data-action="save-tag" data-tag-id="${tag.id}" class="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <input type="text" name="tag-name" value="${tag.name}" required class="flex-grow w-full px-2 py-1 text-sm border border-blue-400 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <div class="flex gap-2 ml-4">
                        <button type="submit" aria-label="${t('save')}" class="p-2 text-white bg-green-500 rounded-full hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </button>
                        <button type="button" data-action="cancel-edit-tag" aria-label="${t('cancel')}" class="p-2 text-white bg-red-500 rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </form>
            `;
        } else {
            // Render the display row for the tag.
            const style = classStyles.Neutral;
            return `
                <div class="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg">
                    <span class="inline-flex items-center gap-1.5 py-1 px-2.5 text-xs font-medium rounded-full ${style.tag}">${tag.name}</span>
                    <div class="flex gap-2">
                         <button data-action="edit-tag" data-tag-id="${tag.id}" aria-label="${t('edit')}" class="p-2 text-gray-400 dark:text-gray-500 rounded-full hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                        </button>
                        <button data-action="open-delete-tag-modal" data-tag-id="${tag.id}" aria-label="${t('delete')}" class="p-2 text-gray-400 dark:text-gray-500 rounded-full hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" /></svg>
                        </button>
                    </div>
                </div>
            `;
        }
    }).join('');

    // If editing a tag, focus the input field.
    if (state.view.type === 'manage_tags' && state.view.editingTagId) {
        const input = container.querySelector('input[name="tag-name"]');
        if (input) {
            input.focus();
            input.select();
        }
    }
};
