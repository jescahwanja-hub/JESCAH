
import React from 'react';

const SparklesIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 3L9.27 9.27L3 12l6.27 2.73L12 21l2.73-6.27L21 12l-6.27-2.73L12 3z" />
    <path d="M4 4l2 2" />
    <path d="M20 4l-2 2" />
    <path d="M4 20l2-2" />
    <path d="M20 20l-2-2" />
    <path d="M18 12h2" />
    <path d="M4 12h2" />
    <path d="M12 18v2" />
    <path d="M12 4v2" />
  </svg>
);

export default SparklesIcon;
