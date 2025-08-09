/**
 * @fileoverview This file acts as the main rendering engine for the application.
 * It contains the primary `render` function that switches between different views
 * (e.g., deck list, add game, stats) based on the application's state. It also
 * handles global UI concerns like theme switching.
 */

import { state } from './store.js';
import { renderDeckList, renderAddGameView, renderStatsView, renderManageTagsView } from './ui/views.js';
import { renderModals } from './ui/modals.js';

// --- THEME ---

/**
 * Sets the color theme for the entire application.
 * It updates the `state`, modifies the class on the `<html>` element,
 * and triggers a re-render to apply theme changes to all components.
 * @param {'light' | 'dark'} theme The theme to apply.
 */
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

// --- MAIN RENDER FUNCTION ---

/**
 * The core rendering function of the application.
 * It reads the current view type from the global `state` and calls the
 * appropriate rendering function for that view. It also ensures that
 * modals are re-rendered on every view change to stay in sync.
 */
export const render = () => {
    switch (state.view.type) {
        case 'list':
            renderDeckList();
            break;
        case 'add_game':
            // Pass the render function to handle async re-renders within the view
            renderAddGameView(state.view.deckId, render);
            break;
        case 'stats':
            renderStatsView(state.view.deckId);
            break;
        case 'manage_tags':
            renderManageTagsView();
            break;
        default:
            renderDeckList();
    }
    // Render modals after main content to ensure they are on top.
    renderModals();
};

// Re-export functions needed by the controller (index.js) to avoid breaking changes after refactoring.
// This maintains a clean public API for this module.
export * from './ui/modals.js';
export { checkDeckFormValidity } from './ui/helpers.js';
export { resetAddGameState, clearAddGameSelections } from './ui/views.js';