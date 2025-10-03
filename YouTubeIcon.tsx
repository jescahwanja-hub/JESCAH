import React from 'react';

const YouTubeIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M21.582 7.147C21.326 6.182 20.59 5.446 19.625 5.19C17.91 4.75 12 4.75 12 4.75s-5.91 0-7.625.44C3.41 5.446 2.674 6.182 2.418 7.147C2 8.862 2 12 2 12s0 3.138.418 4.853c.256.965.992 1.701 1.957 1.957C6.09 19.25 12 19.25 12 19.25s5.91 0 7.625-.44c.965-.256 1.701-.992 1.957-1.957C22 15.138 22 12 22 12s0-3.138-.418-4.853zM10 15.25V8.75l5.25 3.25L10 15.25z" />
  </svg>
);

export default YouTubeIcon;
