import React from 'react';

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
}

export const SubNav: React.FC<SubNavProps> = ({
  tabs,
  activeTab,
  onSelectTab,
  title,
  description
}) => {
  return (
    <div className="border-b border-slate-800 pb-4 mb-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        {title && (
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
              {title}
            </h1>
            {description && (
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                {description}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 bg-slate-900/60 p-1 rounded-xl border border-slate-800/80 w-full md:w-auto shrink-0">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm'
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
      </div>
    </div>
  );
};
