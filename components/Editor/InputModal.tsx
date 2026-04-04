import React, { useState } from 'react';
import { Info, X } from 'lucide-react';

interface InputModalProps {
  isOpen: boolean;
  onConfirm: (input: string) => void;
  onSkip: () => void;
}

const InputModal: React.FC<InputModalProps> = ({ isOpen, onConfirm, onSkip }) => {
  const [inputText, setInputText] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
        
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-0">
          <div className="flex items-center gap-3">
             <Info className="w-6 h-6 text-black" />
             <h2 className="text-2xl font-bold text-black">Input Required</h2>
          </div>
          <button onClick={onSkip} className="text-gray-400 hover:text-black">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-500 mb-6">
            Your code contains input() calls. Please provide the input values below.
          </p>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Enter input values here (one per line for multiple input() calls)...`}
            className="w-full h-40 p-4 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black resize-none"
          />
          
          <p className="text-xs text-gray-400 mt-3">
            Enter each input value on a new line for multiple input() calls.
          </p>

          <div className="flex gap-3 mt-8">
            <button 
              onClick={onSkip}
              className="flex-1 px-6 py-3 rounded-lg font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Skip
            </button>
            <button 
              onClick={() => onConfirm(inputText)}
              className="flex-1 px-6 py-3 rounded-lg font-medium bg-[#1a1a1a] text-white hover:bg-black transition-colors shadow-lg"
            >
              Continue
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default InputModal;