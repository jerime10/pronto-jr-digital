
import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = '', showText = true }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="text-medical-primary font-bold text-xl flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-8 h-8 mr-2"
        >
          <path d="M11.25 4.5v1.5m0 12v1.5m-6-6h1.5m12 0h1.5m-5.255-5.255l1.06-1.06m-9.04 9.04l1.06-1.06m9.04 0l-1.06-1.06m-9.04-9.04l-1.06 1.06M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM12 16.5c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Z" />
        </svg>
        {showText && (
          <span className="font-semibold">
            Consultório <span className="text-medical-secondary">JRS</span>
          </span>
        )}
      </div>
    </div>
  );
};

export default Logo;
