import { ReactNode } from "react";
import { useI18n } from "@/contexts/I18nContext";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconBgColor: string;
  iconColor: string;
  change?: {
    value: string | number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  subtitle?: string;
}

export function StatCard({ title, value, icon, iconBgColor, iconColor, change, subtitle }: StatCardProps) {
  const { t } = useI18n();
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-neutral-500 text-sm font-medium">{title}</h3>
        <div className={`${iconBgColor} p-2 rounded-full`}>
          <div className={`${iconColor}`}>
            {icon}
          </div>
        </div>
      </div>
      <div className="mt-4">
        <h2 className="text-3xl font-bold text-neutral-800">{value}</h2>
        {change && (
          <p className={`text-sm flex items-center mt-1 ${
            change.type === 'increase' ? 'text-green-600' : 
            change.type === 'decrease' ? 'text-red-600' : 'text-neutral-500'
          }`}>
            {change.type === 'increase' && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            )}
            {change.type === 'decrease' && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
            <span>{change.value} {change.type === 'increase' ? t('dashboard.increasedBy') : ''}</span>
          </p>
        )}
        {subtitle && (
          <p className="text-sm text-neutral-500 mt-1">
            <span>{subtitle}</span>
          </p>
        )}
      </div>
    </div>
  );
}
