import React, { useState, useRef, useEffect } from 'react';
import { Play, Box, Copy, Download, Trash2, RotateCcw } from 'lucide-react';
import ModulesModal from './ModulesModal';
import InputModal from './InputModal';

const DEFAULT_CODE = `# Python Compiler
# Type your Python code here and click Run to execute it

def greet(name):
    return f"Hello, {name}!"

print(greet("World"))
`;

const PythonEditor: React.FC = () => {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'output' | 'history'>('editor');
  
  // Modals State
  const [isModulesOpen, setIsModulesOpen] = useState(false);
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  
  // Editor Refs for line sync (simplified for MVP)
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const lineNumbers = code.split('\n').map((_, i) => i + 1);

  const checkInputAndRun = () => {
    // Regex to check for input() usage (ignoring comments roughly)
    const hasInput = /(?:^|\s|=)\s*input\s*\(/.test(code);
    
    if (hasInput) {
      setIsInputOpen(true);
    } else {
      runCode('');
    }
  };

  const runCode = async (stdin: string) => {
    setIsLoading(true);
    setOutput('Running...');
    
    try {
      const response = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: 'python',
          version: '3.10.0',
          files: [{ content: code }],
          stdin: stdin,
        }),
      });

      const data = await response.json();
      
      if (data.run) {
        let result = data.run.stdout;
        if (data.run.stderr) {
          result += `\nError:\n${data.run.stderr}`;
        }
        setOutput(result || 'No output');
      } else {
        setOutput('Failed to execute code.');
      }
    } catch (error) {
      setOutput('Error connecting to compiler service.');
    } finally {
      setIsLoading(false);
      // Auto switch to output on mobile/tablet or just ensure visibility
      if (window.innerWidth < 768) {
          setActiveTab('output');
      }
    }
  };

  const handleInputConfirm = (inputValues: string) => {
    setIsInputOpen(false);
    runCode(inputValues);
  };

  return (
    <div className="bg-white min-h-[calc(100vh-80px)] flex flex-col">
      {/* Top Navigation Tabs */}
      <div className="border-b border-gray-100 bg-white px-4 md:px-8">
        <div className="flex space-x-8">
          {['Editor', 'Output', 'History'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase() as any)}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.toLowerCase()
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between p-4 border-b border-gray-100 bg-white gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={checkInputAndRun}
            disabled={isLoading}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg font-medium text-white transition-all shadow-lg hover:shadow-xl ${
              isLoading ? 'bg-gray-800 cursor-not-allowed' : 'bg-black hover:bg-gray-900'
            }`}
          >
            <Play size={16} fill="currentColor" />
            <span>{isLoading ? 'Running...' : 'Run'}</span>
          </button>
          
          <button 
            onClick={() => setIsModulesOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-lg font-medium text-gray-700 hover:bg-gray-50 border border-gray-200 transition-colors"
          >
            <Box size={16} />
            <span>Modules</span>
          </button>

          <button 
             onClick={() => navigator.clipboard.writeText(code)}
             className="flex items-center space-x-2 px-4 py-2.5 rounded-lg font-medium text-gray-700 hover:bg-gray-50 border border-gray-200 transition-colors"
          >
            <Copy size={16} />
            <span>Copy</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 text-gray-500">
           <button className="p-2 hover:bg-gray-50 rounded-lg hover:text-black transition-colors" title="Download Code">
             <Download size={18} />
           </button>
           <button className="p-2 hover:bg-gray-50 rounded-lg hover:text-black transition-colors" title="Delete Code">
             <Trash2 size={18} />
           </button>
           <button 
             onClick={() => setCode(DEFAULT_CODE)}
             className="p-2 hover:bg-gray-50 rounded-lg hover:text-black transition-colors" 
             title="Reset"
           >
             <RotateCcw size={18} />
           </button>
        </div>
      </div>

      {/* Main Split View */}
      <div className="flex-grow flex flex-col md:flex-row overflow-hidden h-full">
        
        {/* Code Editor Area */}
        <div className={`flex-1 relative flex flex-col ${activeTab === 'output' ? 'hidden md:flex' : 'flex'}`}>
           <div className="flex-grow relative flex overflow-hidden">
              {/* Line Numbers */}
              <div 
                ref={lineNumbersRef}
                className="w-12 pt-4 pb-4 bg-white border-r border-gray-100 text-right pr-3 select-none text-gray-400 font-mono text-sm leading-6 overflow-hidden"
              >
                {lineNumbers.map((n) => (
                  <div key={n}>{n}</div>
                ))}
              </div>

              {/* Text Area */}
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onScroll={handleScroll}
                spellCheck="false"
                className="flex-1 w-full h-full p-4 pt-4 font-mono text-sm leading-6 bg-transparent resize-none focus:outline-none text-gray-800"
              />
           </div>
        </div>

        {/* Output Panel (Split view on Desktop, Tab view on Mobile) */}
        <div className={`md:w-1/3 border-l border-gray-100 bg-gray-50 flex flex-col ${
            activeTab === 'output' ? 'flex' : 'hidden md:flex'
          }`}
        >
          <div className="p-4 border-b border-gray-200 bg-gray-100 font-medium text-gray-700 flex justify-between items-center">
             <span>Terminal Output</span>
             {isLoading && <span className="text-xs animate-pulse text-gray-500">Processing...</span>}
          </div>
          <div className="flex-grow p-4 font-mono text-sm whitespace-pre-wrap overflow-auto text-gray-800">
            {output ? (
               output.startsWith('Error:') ? (
                 <div className="p-3 border border-red-200 bg-red-50 text-red-700 rounded-lg">
                   <h4 className="font-bold mb-1">Execution Error</h4>
                   {output.replace('Error:', '').trim()}
                 </div>
               ) : (
                 output
               )
            ) : (
              <span className="text-gray-400 italic">Run code to see output...</span>
            )}
          </div>
        </div>

      </div>

      {/* Modals */}
      <ModulesModal 
        isOpen={isModulesOpen} 
        onClose={() => setIsModulesOpen(false)}
        selectedModules={selectedModules}
        onAddModule={(mod) => setSelectedModules(prev => [...prev, mod])}
        onRemoveModule={(mod) => setSelectedModules(prev => prev.filter(m => m !== mod))}
      />

      <InputModal 
        isOpen={isInputOpen}
        onConfirm={handleInputConfirm}
        onSkip={() => {
          setIsInputOpen(false);
          runCode(''); // Run without input
        }}
      />

    </div>
  );
};

export default PythonEditor;