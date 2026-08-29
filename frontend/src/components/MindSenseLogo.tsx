import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const MindSenseLogo: React.FC<LogoProps> = ({ className = "h-7 w-7", size = 28 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} shrink-0 transition-transform duration-200`}
      aria-label="MindSense Research Logo"
    >
      <defs>
        {/* Academic Deep Blue Gradient */}
        <linearGradient id="ms-academic-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1E40AF" />
        </linearGradient>

        {/* Pulse Synapse Gradient */}
        <linearGradient id="ms-pulse-grad" x1="4" y1="24" x2="44" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#0EA5E9" />
        </linearGradient>
      </defs>

      {/* Hexagonal Shield Container */}
      <rect 
        x="3" 
        y="3" 
        width="42" 
        height="42" 
        rx="10" 
        fill="url(#ms-academic-grad)" 
        fillOpacity="0.12" 
        stroke="url(#ms-academic-grad)" 
        strokeWidth="1.75"
      />

      {/* Cross-Attention Waves (Top Arc) */}
      <path 
        d="M13 22C13 15.9249 17.9249 11 24 11C30.0751 11 35 15.9249 35 22" 
        stroke="url(#ms-academic-grad)" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeDasharray="2 3"
      />

      {/* Central Iris Outer Contour */}
      <ellipse 
        cx="24" 
        cy="24" 
        rx="12" 
        ry="7.5" 
        stroke="url(#ms-academic-grad)" 
        strokeWidth="1.75" 
        strokeLinecap="round" 
      />

      {/* Central Synapse Core */}
      <circle 
        cx="24" 
        cy="24" 
        r="4" 
        fill="url(#ms-academic-grad)" 
      />

      {/* Acoustic Wave Vector */}
      <path 
        d="M6 24H13L17 18L21 30L25 19L29 28L33 24H42" 
        stroke="url(#ms-pulse-grad)" 
        strokeWidth="1.75" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />

      {/* 3 Multimodal Feature Nodes */}
      <circle cx="24" cy="8.5" r="1.75" fill="#3B82F6" />
      <circle cx="9.5" cy="34" r="1.75" fill="#10B981" />
      <circle cx="38.5" cy="34" r="1.75" fill="#6366F1" />
    </svg>
  );
};
