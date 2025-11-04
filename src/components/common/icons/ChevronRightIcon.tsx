import React from 'react';

interface ChevronRightIconProps {
  className?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

export default function ChevronRightIcon({ 
  className = "w-6 h-6", 
  strokeColor = "#B0B0B0",
  strokeWidth = 2 
}: ChevronRightIconProps) {
  return (
    <svg 
      className={className}
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M9 19L16 12L9 5" 
        stroke={strokeColor} 
        strokeWidth={strokeWidth} 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}
