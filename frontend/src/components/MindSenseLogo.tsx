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
      className={`${className} shrink-0 transition-transform duration-300 hover:scale-110`}
    >
      <defs>
        {/* Core Gradient */}
        <linearGradient id="mindsense-grad-primary" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="50%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>

        {/* Pulse Wave Gradient */}
        <linearGradient id="mindsense-grad-pulse" x1="8" y1="24" x2="40" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>

        {/* Iris Core Glow */}
        <radialGradient id="mindsense-iris-glow" cx="24" cy="24" r="14" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366F1" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 1. Background Hexagonal Shield */}
      <rect 
        x="2" 
        y="2" 
        width="44" 
        height="44" 
        rx="14" 
        fill="url(#mindsense-grad-primary)" 
        fillOpacity="0.15" 
        stroke="url(#mindsense-grad-primary)" 
        strokeWidth="1.5"
      />

      {/* 2. Concentric Neural Wave Arc (Audio / Thoughts) */}
      <path 
        d="M12 24C12 17.3726 17.3726 12 24 12C30.6274 12 36 17.3726 36 24" 
        stroke="url(#mindsense-grad-primary)" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeDasharray="1 3"
      />

      {/* 3. Emotional Vision Iris Outer Loop */}
      <ellipse 
        cx="24" 
        cy="24" 
        rx="13" 
        ry="8" 
        stroke="url(#mindsense-grad-primary)" 
        strokeWidth="2" 
        strokeLinecap="round"
      />

      {/* 4. Center Emotional Core Synapse / Heart Pulse Node */}
      <circle 
        cx="24" 
        cy="24" 
        r="5" 
        fill="url(#mindsense-grad-primary)" 
      />

      {/* 5. Heart-rate / Acoustic Harmonic Pulse Wave Line */}
      <path 
        d="M6 24H14L18 17L22 31L26 19L30 28L34 24H42" 
        stroke="url(#mindsense-grad-pulse)" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />

      {/* 6. Sensory Focus Nodes (Text, Audio, Vision) */}
      <circle cx="24" cy="9" r="2" fill="#38BDF8" />
      <circle cx="10" cy="34" r="2" fill="#10B981" />
      <circle cx="38" cy="34" r="2" fill="#EC4899" />
    </svg>
  );
};
