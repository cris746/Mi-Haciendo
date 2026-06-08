import React, { useState, useEffect } from 'react';
import { MessageSquare, X } from 'lucide-react';

const PromptModal = ({ 
  isOpen, 
  title, 
  message, 
  label = 'Motivo',
  placeholder = 'Escriba aquí...',
  confirmText = 'Confirmar', 
  cancelText = 'Cancelar', 
  variant = 'danger',
  required = true,
  minLength = 3,
  onConfirm, 
  onCancel, 
  isLoading = false 
}) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setValue('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const trimmed = value.trim();
    if (required && !trimmed) {
      setError('Este campo es obligatorio.');
      return;
    }
    if (trimmed.length < minLength) {
      setError(`Mínimo ${minLength} caracteres.`);
      return;
    }
    onConfirm(trimmed);
  };

  const btnClass = variant === 'danger' 
    ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-100' 
    : 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-100';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <MessageSquare className="text-gray-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            </div>
            <button onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <p className="text-gray-600 mb-6">{message}</p>
          
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
            <textarea
              autoFocus
              className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all min-h-[120px] resize-none ${
                error ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-primary-100 focus:border-primary-500'
              }`}
              placeholder={placeholder}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (error) setError('');
              }}
              disabled={isLoading}
            />
            {error && <p className="mt-2 text-xs font-bold text-red-500 flex items-center gap-1">⚠ {error}</p>}
          </div>

          <div className="flex gap-3 justify-end">
            <button 
              onClick={onCancel} 
              disabled={isLoading}
              className="px-6 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button 
              onClick={handleConfirm} 
              disabled={isLoading}
              className={`px-8 py-2.5 font-semibold rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 ${btnClass}`}
            >
              {isLoading ? 'Procesando...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptModal;
