import React from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

const ConfirmModal = ({ 
  isOpen, 
  title, 
  message, 
  confirmText = 'Confirmar', 
  cancelText = 'Cancelar', 
  variant = 'danger', 
  onConfirm, 
  onCancel, 
  isLoading = false 
}) => {
  if (!isOpen) return null;

  const variants = {
    danger: {
      icon: <XCircle className="text-red-600" size={32} />,
      btn: 'bg-red-600 hover:bg-red-700 text-white shadow-red-100',
      bg: 'bg-red-50'
    },
    warning: {
      icon: <AlertTriangle className="text-amber-500" size={32} />,
      btn: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-100',
      bg: 'bg-amber-50'
    },
    success: {
      icon: <CheckCircle className="text-green-600" size={32} />,
      btn: 'bg-green-600 hover:bg-green-700 text-white shadow-green-100',
      bg: 'bg-green-50'
    },
    info: {
      icon: <Info className="text-blue-600" size={32} />,
      btn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100',
      bg: 'bg-blue-50'
    }
  };

  const current = variants[variant] || variants.info;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 flex flex-col items-center text-center">
          <div className={`p-4 rounded-full mb-6 ${current.bg}`}>
            {current.icon}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 mb-8">{message}</p>
          
          <div className="flex gap-3 w-full">
            <button 
              onClick={onCancel} 
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button 
              onClick={onConfirm} 
              disabled={isLoading}
              className={`flex-1 px-4 py-3 font-semibold rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 ${current.btn}`}
            >
              {isLoading ? 'Procesando...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
