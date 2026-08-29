import React from 'react';
import { PageHeader, type BreadcrumbItem } from './PageHeader';

export interface SubNavTab {
  id: string;
  label: string;
  badge?: string;
}

interface SubNavProps {
  tabs: SubNavTab[];
  activeTab: string;
  onSelectTab: (id: string) => void;
  title?: string;
  description?: string;
  onBack?: () => void;
  backLabel?: string;
  breadcrumbs?: BreadcrumbItem[];
}

export const SubNav: React.FC<SubNavProps> = ({
  tabs,
  activeTab,
  onSelectTab,
  title,
  description,
  onBack,
  backLabel,
  breadcrumbs
}) => {
  return (
    <div className="mb-6">
      <PageHeader
        title={title || ''}
        description={description}
        onBack={onBack}
        backLabel={backLabel}
        breadcrumbs={breadcrumbs}
      >
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-brand-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isActive ? 'bg-brand-700 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </PageHeader>
    </div>
  );
};
