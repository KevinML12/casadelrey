import React from 'react';

const Card = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-6 sm:p-8 border border-transparent dark:border-gray-700 transition-colors ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;