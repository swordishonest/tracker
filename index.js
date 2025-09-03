/**
 * @fileoverview This is the main entry point for the application.
 * It initializes the application state by loading data from localStorage,
 * sets up the initial view, and attaches all necessary event listeners.
 */

import { state, saveDecks, saveSettings, loadDecks, loadSettings, CLASSES, loadTags, loadTagUsage, saveTags, loadTakeTwoDecks, initializeTakeTwoDecks } from './store.js';
import { render } from './view.js';
import { setupEventListeners } from './controller.js';

// --- INITIALIZATION ---
// This function runs when the DOM is fully loaded and ready.
document.addEventListener('DOMContentLoaded', () => {
    // Load all data from localStorage into the application's state.
    state.decks = loadDecks();
    state.takeTwoDecks = loadTakeTwoDecks();
    state.tags = loadTags();
    state.tagUsage = loadTagUsage();
    
    // Load user settings, applying sensible defaults if they don't exist.
    const settings = loadSettings();
    if (settings.language && (settings.language === 'en' || settings.language === 'ja')) {
        state.language = settings.language;
    }
    if (settings.mode && ['normal', 'takeTwo'].includes(settings.mode)) {
        state.mode = settings.mode;
    }
    if (settings.chartType && ['pie', 'bar', 'histogram'].includes(settings.chartType)) {
        state.chartType = settings.chartType;
    }
    if (settings.addGameTagsExpanded) {
        state.addGameTagsExpanded = settings.addGameTagsExpanded;
    }
    if (typeof settings.matchHistoryCollapsed === 'boolean') {
        state.matchHistoryCollapsed = settings.matchHistoryCollapsed;
    }
    if (typeof settings.resultHistoryCollapsed === 'boolean') {
        state.resultHistoryCollapsed = settings.resultHistoryCollapsed;
    }
    if (settings.globalDateFilter) {
        state.globalDateFilter = settings.globalDateFilter;
    }
    if (settings.globalTagFilter) {
        state.globalTagFilter = settings.globalTagFilter;
    }

    // Set the initial theme based on system preference or saved settings.
    if (document.documentElement.classList.contains('dark')) {
        state.theme = 'dark';
    } else {
        state.theme = 'light';
    }
    if(settings.theme) {
        state.theme = settings.theme;
    }
    
    // Ensure Take Two decks are properly initialized or updated.
    initializeTakeTwoDecks();
    
    // One-time data migration: Remove deprecated 'class' property from tags if it exists.
    let tagsUpdated = false;
    state.tags.forEach(tag => {
        if (tag.hasOwnProperty('class')) {
            delete tag.class;
            tagsUpdated = true;
        }
    });
    if (tagsUpdated) {
        saveTags();
    }

    // Perform the initial render of the application UI.
    render();
    // Set up all global event listeners to handle user interactions.
    setupEventListeners();
});