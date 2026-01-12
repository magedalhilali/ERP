import React from 'react';

interface ProgressBarProps {
  percentage: number;
  className?: string;
  colorClass?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percentage, className = '', colorClass = 'bg-emerald-500' }) => {
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2.5 ${className}`}>
      <div 
        className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${colorClass}`} 
        style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
      ></div>
    </div>
  );
};

export default ProgressBar;