/**
 * Auto-save utility for form data
 * Saves form data to localStorage with a debounce mechanism
 */

const STORAGE_PREFIX = 'form_autosave_';
const DEBOUNCE_DELAY = 2000; // 2 seconds

// Store to manage debounce timers
const debounceTimers = {};

/**
 * Save form data to localStorage with debounce
 * @param {string} formId - Unique identifier for the form
 * @param {object} formData - Form data to save
 * @param {function} onSave - Optional callback when data is saved to server
 */
export const autoSaveFormData = (formId, formData, onSave = null) => {
  // Clear existing timer if any
  if (debounceTimers[formId]) {
    clearTimeout(debounceTimers[formId]);
  }

  // Set new timer for debounced save
  debounceTimers[formId] = setTimeout(() => {
    try {
      const storageKey = `${STORAGE_PREFIX}${formId}`;
      const dataToSave = {
        data: formData,
        timestamp: new Date().toISOString(),
        formId: formId,
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      console.log(`Auto-saved form: ${formId}`);

      // Call optional callback
      if (onSave) {
        onSave(formData);
      }
    } catch (error) {
      console.error('Error auto-saving form data:', error);
    }
  }, DEBOUNCE_DELAY);
};

/**
 * Retrieve auto-saved form data from localStorage
 * @param {string} formId - Unique identifier for the form
 * @returns {object|null} - Saved form data or null if not found
 */
export const getAutoSavedFormData = (formId) => {
  try {
    const storageKey = `${STORAGE_PREFIX}${formId}`;
    const savedData = localStorage.getItem(storageKey);

    if (savedData) {
      const parsed = JSON.parse(savedData);
      return parsed.data;
    }
    return null;
  } catch (error) {
    console.error('Error retrieving auto-saved form data:', error);
    return null;
  }
};

/**
 * Clear auto-saved form data
 * @param {string} formId - Unique identifier for the form
 */
export const clearAutoSavedFormData = (formId) => {
  try {
    const storageKey = `${STORAGE_PREFIX}${formId}`;
    localStorage.removeItem(storageKey);
    
    // Clear any pending debounce timers
    if (debounceTimers[formId]) {
      clearTimeout(debounceTimers[formId]);
      delete debounceTimers[formId];
    }
    
    console.log(`Cleared auto-saved form: ${formId}`);
  } catch (error) {
    console.error('Error clearing auto-saved form data:', error);
  }
};

/**
 * Check if auto-saved data exists for a form
 * @param {string} formId - Unique identifier for the form
 * @returns {boolean} - True if auto-saved data exists
 */
export const hasAutoSavedData = (formId) => {
  try {
    const storageKey = `${STORAGE_PREFIX}${formId}`;
    return localStorage.getItem(storageKey) !== null;
  } catch (error) {
    return false;
  }
};

/**
 * Get all auto-saved forms
 * @returns {array} - Array of saved form IDs
 */
export const getAllAutoSavedForms = () => {
  try {
    const allKeys = Object.keys(localStorage);
    return allKeys
      .filter(key => key.startsWith(STORAGE_PREFIX))
      .map(key => key.replace(STORAGE_PREFIX, ''));
  } catch (error) {
    console.error('Error getting all auto-saved forms:', error);
    return [];
  }
};

/**
 * React hook for auto-save functionality
 * Usage: useAutoSave('form-id', formData, formikSetFieldValue)
 */
export const useAutoSave = (formId, formData, onSave = null, delay = DEBOUNCE_DELAY) => {
  React.useEffect(() => {
    const debounceTimer = setTimeout(() => {
      autoSaveFormData(formId, formData, onSave);
    }, delay);

    return () => clearTimeout(debounceTimer);
  }, [formId, formData, onSave, delay]);
};

export default {
  autoSaveFormData,
  getAutoSavedFormData,
  clearAutoSavedFormData,
  hasAutoSavedData,
  getAllAutoSavedForms,
  useAutoSave,
};
