import React from 'react';

const ArticleIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Z" />
    <path d="M16 2v20" />
    <path d="M8 10h4" />
    <path d="M8 14h4" />
    <path d="M8 6h4" />
  </svg>
);

export default ArticleIcon;
