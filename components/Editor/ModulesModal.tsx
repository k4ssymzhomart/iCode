import React, { useState } from 'react';
import { X } from 'lucide-react';

interface ModulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModules: string[];
  onAddModule: (module: string) => void;
  onRemoveModule: (module: string) => void;
}

const ModulesModal: React.FC<ModulesModalProps> = ({ 
  isOpen, 
  onClose, 
  selectedModules, 
  onAddModule, 
  onRemoveModule 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const availableModules = [
    'math', 'random', 'datetime', 'json', 're', 'collections',
    'itertools', 'functools', 'os', 'sys', 'time', 'string',
    'numpy', 'pandas', 'requests', 'bs4', 'matplotlib'
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-black">Python Modules</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-black transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-500 mb-6">
            Add Python modules you want to use in your code.
          </p>

          {/* Search */}
          <div className="flex gap-2 mb-8">
            <input
              type="text"
              placeholder="Enter module name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
            />
            <button 
              onClick={() => {
                if (searchTerm) {
                    onAddModule(searchTerm);
                    setSearchTerm('');
                }
              }}
              className="bg-[#1a1a1a] text-white px-6 py-3 rounded-lg font-medium hover:bg-black transition-colors"
            >
              Add
            </button>
          </div>

          {/* Selected Modules */}
          <div className="mb-8">
            <h3 className="font-semibold text-black mb-3">Selected Modules:</h3>
            {selectedModules.length === 0 ? (
              <p className="text-gray-400 text-sm">No modules selected</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedModules.map(mod => (
                  <span key={mod} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-black text-white">
                    {mod}
                    <button 
                      onClick={() => onRemoveModule(mod)}
                      className="ml-2 hover:text-gray-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Available Modules */}
          <div>
            <h3 className="font-semibold text-black mb-3">Available Modules:</h3>
            <div className="flex flex-wrap gap-2">
              {availableModules.map(mod => (
                <button
                  key={mod}
                  onClick={() => onAddModule(mod)}
                  disabled={selectedModules.includes(mod)}
                  className={`px-4 py-2 rounded-lg text-sm border transition-all ${
                    selectedModules.includes(mod)
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-black hover:text-black'
                  }`}
                >
                  {mod}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ModulesModal;