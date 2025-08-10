import { PageSize } from '@/components/entries/data-table/column-config';

// Keys for localStorage
const STORAGE_KEYS = {
  LAST_EMAIL: 'alcn_last_email',
  VISIBLE_COLUMNS: 'alcn_visible_columns',
  PAGE_SIZE: 'alcn_page_size',
  SORT_BY: 'alcn_sort_by',
  SORT_DIRECTION: 'alcn_sort_direction',
} as const;

export interface UserPreferences {
  lastEmail?: string;
  visibleColumns?: string[];
  pageSize?: PageSize;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

// Email preferences
export const saveLastEmail = (email: string): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_EMAIL, email);
  } catch (error) {
    console.warn('Failed to save email to localStorage:', error);
  }
};

export const getLastEmail = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEYS.LAST_EMAIL);
  } catch (error) {
    console.warn('Failed to get email from localStorage:', error);
    return null;
  }
};

export const clearLastEmail = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.LAST_EMAIL);
  } catch (error) {
    console.warn('Failed to clear email from localStorage:', error);
  }
};

// Column visibility preferences
export const saveVisibleColumns = (columns: Set<string>): void => {
  try {
    const columnsArray = Array.from(columns);
    localStorage.setItem(STORAGE_KEYS.VISIBLE_COLUMNS, JSON.stringify(columnsArray));
  } catch (error) {
    console.warn('Failed to save visible columns to localStorage:', error);
  }
};

export const getVisibleColumns = (): Set<string> | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.VISIBLE_COLUMNS);
    if (stored) {
      const columnsArray = JSON.parse(stored);
      return new Set(columnsArray);
    }
    return null;
  } catch (error) {
    console.warn('Failed to get visible columns from localStorage:', error);
    return null;
  }
};

// Page size preferences
export const savePageSize = (pageSize: PageSize): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.PAGE_SIZE, pageSize.toString());
  } catch (error) {
    console.warn('Failed to save page size to localStorage:', error);
  }
};

export const getPageSize = (): PageSize | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PAGE_SIZE);
    if (stored) {
      const pageSize = parseInt(stored, 10);
      // Validate that it's a valid page size
      const validPageSizes = [20, 50, 100];
      if (validPageSizes.includes(pageSize)) {
        return pageSize as PageSize;
      }
    }
    return null;
  } catch (error) {
    console.warn('Failed to get page size from localStorage:', error);
    return null;
  }
};

// Sorting preferences
export const saveSortingPreferences = (sortBy: string, sortDirection: 'asc' | 'desc'): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SORT_BY, sortBy);
    localStorage.setItem(STORAGE_KEYS.SORT_DIRECTION, sortDirection);
  } catch (error) {
    console.warn('Failed to save sorting preferences to localStorage:', error);
  }
};

export const getSortingPreferences = (): { sortBy: string; sortDirection: 'asc' | 'desc' } | null => {
  try {
    const sortBy = localStorage.getItem(STORAGE_KEYS.SORT_BY);
    const sortDirection = localStorage.getItem(STORAGE_KEYS.SORT_DIRECTION);
    
    if (sortBy && sortDirection && (sortDirection === 'asc' || sortDirection === 'desc')) {
      return { sortBy, sortDirection };
    }
    return null;
  } catch (error) {
    console.warn('Failed to get sorting preferences from localStorage:', error);
    return null;
  }
};

// Clear all preferences
export const clearAllPreferences = (): void => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.warn('Failed to clear preferences from localStorage:', error);
  }
};

// Get all preferences at once
export const getAllPreferences = (): UserPreferences => {
  return {
    lastEmail: getLastEmail() || undefined,
    visibleColumns: getVisibleColumns() ? Array.from(getVisibleColumns()!) : undefined,
    pageSize: getPageSize() || undefined,
    ...(getSortingPreferences() || {}),
  };
};