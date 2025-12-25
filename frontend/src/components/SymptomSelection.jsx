import React from 'react';
import { MEGAFLOW } from '../data/megaflow';
import * as Icons from 'lucide-react';

const SymptomSelection = ({ onSelect }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-900">What's the problem?</h2>
        <p className="text-slate-600">Select what best matches the issue right now.</p>
      </div>

      <div className="space-y-3">
        {MEGAFLOW.mainSymptoms.map((symptom) => {
          const IconComponent = Icons[symptom.icon];
          
          return (
            <button
              key={symptom.id}
              onClick={() => onSelect(symptom.id)}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all duration-200 text-left group"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-slate-100 group-hover:bg-slate-600 flex items-center justify-center transition-colors duration-200">
                {IconComponent && <IconComponent className="h-6 w-6 text-slate-600 group-hover:text-white transition-colors duration-200" />}
              </div>
              <span className="text-base font-medium text-slate-900 group-hover:text-slate-900">
                {symptom.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SymptomSelection;
