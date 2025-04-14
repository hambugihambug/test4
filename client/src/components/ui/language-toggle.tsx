import { useI18n } from "@/contexts/I18nContext";

export function LanguageToggle() {
  const { language, setLanguage } = useI18n();
  
  return (
    <div className="bg-white rounded-md shadow-sm border border-neutral-200 flex">
      <button 
        className={`py-1 px-3 ${language === 'ko' ? 'bg-primary text-white' : 'text-neutral-600'} rounded-l-md text-sm font-medium`}
        onClick={() => setLanguage('ko')}
      >
        KO
      </button>
      <button 
        className={`py-1 px-3 ${language === 'en' ? 'bg-primary text-white' : 'text-neutral-600'} rounded-r-md text-sm font-medium`}
        onClick={() => setLanguage('en')}
      >
        EN
      </button>
    </div>
  );
}
