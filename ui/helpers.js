/**
 * @fileoverview This file contains various helper functions used across the UI,
 * including translation, text formatting, and reusable UI component generators.
 */

import { state, CLASSES, classStyles, CLASS_NAMES, translations, getTranslatedClassName, setNewDeckClass } from '../store.js';

/**
 * Translates a given key into the currently selected language.
 * It supports placeholder replacements.
 * @param {string} key The translation key from the `translations` object.
 * @param {Object.<string, string>} [replacements={}] An object where keys are placeholders in the string (e.g., 'name')
 * and values are the replacements (e.g., 'Aggro Forest').
 * @returns {string} The translated and formatted string.
 */
export const t = (key, replacements = {}) => {
    let text = (translations[state.language] && translations[state.language][key]) || translations.en[key] || `[${key}]`;
    for (const placeholder in replacements) {
        text = text.replace(`{${placeholder}}`, replacements[placeholder]);
    }
    return text;
};

/**
 * Gets a short, abbreviated name for a class, useful for compact UI elements.
 * @param {string} cls The class name (e.g., 'Forest').
 * @returns {string} The abbreviated class name.
 */
export const getShortClassName = (cls) => {
    const translatedName = getTranslatedClassName(cls);
    if (state.language === 'ja') {
        if (translatedName === 'ビショップ') return 'ビショ';
        return translatedName.substring(0, 2);
    }
    return translatedName.substring(0, 2);
};

/**
 * Finds URLs in a string and converts them to clickable anchor tags.
 * Sanitizes the text to prevent XSS.
 * @param {string} text The input text to linkify.
 * @returns {string} An HTML string with anchor tags for any found URLs.
 */
export const linkify = (text) => {
    if (!text) return '';
    const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    // Sanitize text first to prevent XSS by setting textContent, then read innerHTML
    const tempDiv = document.createElement('div');
    tempDiv.textContent = text;
    return tempDiv.innerHTML.replace(urlRegex, url => 
        `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-500 dark:text-blue-400 hover:underline break-all">${url}</a>`
    );
};

/**
 * Checks the validity of the "Add Deck" form fields (name and class)
 * and enables/disables the save button accordingly.
 */
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

/**
 * Creates a grid of buttons for selecting a Shadowverse class.
 * @param {string|null} selectedClass The currently selected class.
 * @param {function(string):void} onSelectCallback The function to call when a class is selected.
 * @param {string} [namePrefix=''] An optional prefix for radio button names to ensure unique groups.
 * @returns {HTMLDivElement} A container element with the class selector buttons.
 */
export const createClassSelector = (selectedClass, onSelectCallback, namePrefix = '') => {
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

/**
 * Renders an array of tag IDs into styled "pill" elements.
 * @param {Array<string|object>} tagIds An array of tag IDs or tag objects.
 * @param {Object.<string, object>} tagsById A map of tag IDs to tag objects.
 * @param {boolean} [deletable=false] If true, adds a delete button to each pill.
 * @param {function(Event):void|null} [onPillClick=null] The callback for the delete button.
 * @param {string} [pillType='existing'] The type of pill, used for data attributes.
 * @returns {Array<HTMLSpanElement>} An array of span elements representing the tags. Returns an empty string if no tags.
 */
export const renderTagPills = (tagIds, tagsById, deletable = false, onPillClick = null, pillType = 'existing') => {
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
