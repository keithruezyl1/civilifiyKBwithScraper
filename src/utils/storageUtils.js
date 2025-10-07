/**
 * Utility functions for managing localStorage and sessionStorage
 */

/**
 * Clear all user-related data from localStorage and sessionStorage
 * This should be called when user logs out or authentication expires
 */
export const clearAllUserData = () => {
  try {
    // Clear localStorage items
    const localStorageKeys = [
      'auth_token',
      'user_info',
      'app_theme',
      'kb_entry_draft',
      'kb_draft', 
      'kb_drafts',
      'law_entries',
      'villy_chat_history',
      'team_progress',
      'daily_quotas'
    ];

    // Clear known localStorage keys
    localStorageKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove localStorage key: ${key}`, error);
      }
    });

    // Clear any localStorage keys that start with common prefixes
    const prefixesToClear = [
      'kb_',
      'law_',
      'team_',
      'daily_',
      'progress_',
      'quota_',
      'draft_',
      'entry_'
    ];

    // Iterate through all localStorage keys and remove those with matching prefixes
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && prefixesToClear.some(prefix => key.startsWith(prefix))) {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn(`Failed to remove localStorage key: ${key}`, error);
        }
      }
    }

    // Clear sessionStorage items
    const sessionStorageKeys = [
      'cameFromDashboard',
      'importedEntryData',
      'entryCreated',
      'entryJustCreated',
      'incompleteEntries',
      'yesterdayMode',
      'yesterdayQuotas'
    ];

    // Clear known sessionStorage keys
    sessionStorageKeys.forEach(key => {
      try {
        sessionStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove sessionStorage key: ${key}`, error);
      }
    });

    // Clear any sessionStorage keys that start with common prefixes
    const sessionPrefixesToClear = [
      'imported_',
      'entry_',
      'incomplete_',
      'yesterday_',
      'cameFrom_'
    ];

    // Iterate through all sessionStorage keys and remove those with matching prefixes
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key && sessionPrefixesToClear.some(prefix => key.startsWith(prefix))) {
        try {
          sessionStorage.removeItem(key);
        } catch (error) {
          console.warn(`Failed to remove sessionStorage key: ${key}`, error);
        }
      }
    }

    console.log('✅ All user data cleared from localStorage and sessionStorage');
  } catch (error) {
    console.error('❌ Error clearing user data:', error);
  }
};

/**
 * Clear only authentication-related data (for token expiration)
 */
export const clearAuthData = () => {
  try {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    console.log('✅ Authentication data cleared');
  } catch (error) {
    console.error('❌ Error clearing auth data:', error);
  }
};

/**
 * Clear only draft data (for form resets)
 */
export const clearDraftData = () => {
  try {
    const draftKeys = [
      'kb_entry_draft',
      'kb_draft',
      'kb_drafts'
    ];
    
    draftKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove draft key: ${key}`, error);
      }
    });
    
    console.log('✅ Draft data cleared');
  } catch (error) {
    console.error('❌ Error clearing draft data:', error);
  }
};
