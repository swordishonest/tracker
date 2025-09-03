/**
 * @fileoverview This file acts as a central hub or "barrel file" for all view-related modules.
 * It imports all the individual view rendering functions and then re-exports them.
 * This allows other parts of the application (like the main `view.js` orchestrator) to
 * import all necessary view functions from a single location, simplifying dependency management.
 */

import { renderDeckList } from './deck-list.js';
import { renderAddGameView, resetAddGameState, clearAddGameSelections } from './add-game.js';
import { renderEditGameView, resetEditGameState } from './edit-game.js';
import { renderStatsView } from './stats.js';
import { renderManageTagsView } from './manage-tags.js';

// Re-export all the view rendering functions and helpers needed by the main UI orchestrator.
export {
    renderDeckList,
    renderAddGameView,
    resetAddGameState,
    clearAddGameSelections,
    renderEditGameView,
    resetEditGameState,
    renderStatsView,
    renderManageTagsView
};