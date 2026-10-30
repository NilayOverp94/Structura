export interface UserPreferences {
  displayName: string;
  defaultBranch: string;
  aiDetailLevel: 'concise' | 'balanced' | 'comprehensive';
  astIndexDepth: 'standard' | 'deep' | 'minimal';
  codeFontSize: '12px' | '13px' | '14px' | '16px';
  codeTabSize: 2 | 4;
  showLineNumbers: boolean;
  wordWrap: boolean;
  autoGenerateArchitecture: boolean;
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  displayName: 'Developer',
  defaultBranch: 'main',
  aiDetailLevel: 'balanced',
  astIndexDepth: 'standard',
  codeFontSize: '13px',
  codeTabSize: 2,
  showLineNumbers: true,
  wordWrap: false,
  autoGenerateArchitecture: true,
};

const STORAGE_KEY = 'structura_user_preferences';

export function getUserPreferences(): UserPreferences {
  if (typeof window === 'undefined') return DEFAULT_USER_PREFERENCES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_USER_PREFERENCES;
    return { ...DEFAULT_USER_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_USER_PREFERENCES;
  }
}

export function saveUserPreferences(prefs: Partial<UserPreferences>): UserPreferences {
  if (typeof window === 'undefined') return { ...DEFAULT_USER_PREFERENCES, ...prefs };
  try {
    const current = getUserPreferences();
    const updated = { ...current, ...prefs };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return { ...DEFAULT_USER_PREFERENCES, ...prefs };
  }
}
