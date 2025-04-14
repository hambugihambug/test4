import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { translations, Language } from '@/lib/translations';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<Language>('ko');
  
  // Initialize language from user preferences
  useEffect(() => {
    if (user?.preferredLanguage) {
      setLanguageState(user.preferredLanguage as Language);
    }
  }, [user]);
  
  // Update user language preference in the backend
  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    
    if (user) {
      try {
        await apiRequest('PATCH', '/api/user/language', { language: lang });
      } catch (error) {
        console.error('Failed to update language preference:', error);
      }
    }
  };
  
  // Translation function
  const t = (key: string): string => {
    const keys = key.split('.');
    let result = translations[language];
    
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        return key; // Fallback to the key if translation not found
      }
    }
    
    return typeof result === 'string' ? result : key;
  };
  
  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
