import React from 'react';

const LoadingSpinner = ({ text = 'Cargando...', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-10 h-10 border-4',
    lg: 'w-16 h-16 border-8'
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className={`${currentSize} border-primary-200 border-t-primary-600 rounded-full animate-spin`}></div>
      {text && <p className="text-gray-500 font-medium animate-pulse">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
