import React from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  backLabel?: string;
  onBack?: () => void;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs,
  backLabel = "Back",
  onBack,
  children
}) => {
  return (
    <div className="space-y-4 pb-6 border-b border-slate-800 font-sans">
      
      {/* Top Bar: Back Button & Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Institutional Back Button */}
        {onBack ? (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white font-medium transition py-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-500 rounded"
            aria-label={backLabel}
          >
            <ArrowLeft className="h-4 w-4 text-brand-400 shrink-0" />
            <span className="hidden sm:inline font-sans">{backLabel}</span>
            <span className="sm:hidden font-sans">Back</span>
          </button>
        ) : <div />}

        {/* Subtle Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1 text-[11px] font-mono text-slate-400" aria-label="Breadcrumb">
            {breadcrumbs.map((item, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />}
                  {item.onClick && !isLast ? (
                    <button
                      onClick={item.onClick}
                      className="hover:text-slate-200 transition"
                    >
                      {item.label}
                    </button>
                  ) : (
                    <span className={isLast ? 'text-slate-300 font-semibold' : ''}>
                      {item.label}
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        )}
      </div>

      {/* Main Title & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1 max-w-3xl">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
            {title}
          </h1>
          {description && (
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
              {description}
            </p>
          )}
        </div>

        {/* Action Slot / Sub-Tabs */}
        {children && (
          <div className="shrink-0">
            {children}
          </div>
        )}
      </div>

    </div>
  );
};
