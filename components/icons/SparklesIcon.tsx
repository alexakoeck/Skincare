
import React from 'react';

export const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 3L9.27 9.27L3 12l6.27 2.73L12 21l2.73-6.27L21 12l-6.27-2.73L12 3z" />
    <path d="M4.5 4.5l1.06 2.12" />
    <path d="M18.44 18.44l1.06 2.12" />
    <path d="M21.62 4.5l-2.12 1.06" />
    <path d="M4.5 19.5l2.12-1.06" />
  </svg>
);
