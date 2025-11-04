import React from 'react';

interface ChevronLeftIconProps {
  className?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

export default function ChevronLeftIcon({ 
  className = "w-6 h-6", 
  strokeColor = "#B0B0B0",
  strokeWidth = 2 
}: ChevronLeftIconProps) {
  return (
    <svg 
      className={className}
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M15 19L8 12L15 5" 
        stroke={strokeColor} 
        strokeWidth={strokeWidth} 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}
