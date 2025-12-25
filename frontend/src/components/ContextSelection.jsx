import React, { useState } from 'react';
import { Button } from './ui/button';
import { MEGAFLOW } from '../data/megaflow';
import * as Icons from 'lucide-react';

const ContextSelection = ({ onContinue }) => {
  const [selectedFlags, setSelectedFlags] = useState([]);

  const toggleFlag = (flagId) => {
    setSelectedFlags(prev => 
      prev.includes(flagId) 
        ? prev.filter(id => id !== flagId)
        : [...prev, flagId]
    );
  };

  const handleContinue = () => {
    onContinue(selectedFlags);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-900">Welcome to CarScan</h2>
        <p className="text-slate-600">Select any that apply to your situation (optional).</p>
      </div>

      <div className="space-y-3">
        {MEGAFLOW.contextFlags.map((flag) => {
          const IconComponent = Icons[flag.icon];
          const isSelected = selectedFlags.includes(flag.id);
          
          return (
            <button
              key={flag.id}
              onClick={() => toggleFlag(flag.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                isSelected
                  ? 'border-slate-600 bg-slate-50 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                isSelected ? 'bg-slate-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {IconComponent && <IconComponent className="h-5 w-5" />}
              </div>
              <span className={`text-base font-medium ${
                isSelected ? 'text-slate-900' : 'text-slate-700'
              }`}>
                {flag.label}
              </span>
            </button>
          );
        })}
      </div>

      <Button
        onClick={handleContinue}
        size="lg"
        className="w-full bg-slate-600 hover:bg-slate-700 text-white h-12 text-base font-medium"
      >
        Continue
      </Button>
    </div>
  );
};

export default ContextSelection;
