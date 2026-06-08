import React from 'react';
import { Search } from 'lucide-react';

const EmptyState = ({ 
  icon = <Search size={48} />, 
  title = 'No hay datos', 
  message = 'No se encontraron registros para mostrar en esta sección.', 
  actionLabel, 
  onAction 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100">
      <div className="text-gray-300 mb-4 animate-bounce duration-[3000ms]">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-500 max-w-sm mb-6">{message}</p>
      
      {actionLabel && onAction && (
        <button 
          onClick={onAction}
          className="btn-primary"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
