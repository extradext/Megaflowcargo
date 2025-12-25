import React, { useState } from 'react';
import { Button } from './ui/button';

const ModifierBundle = ({ node, onComplete }) => {
  const [modifierAnswers, setModifierAnswers] = useState({});
  const [currentModifierIndex, setCurrentModifierIndex] = useState(0);

  const currentModifier = node.modifiers[currentModifierIndex];
  const isLastModifier = currentModifierIndex === node.modifiers.length - 1;

  const handleOptionClick = (option) => {
    const newAnswers = {
      ...modifierAnswers,
      [currentModifier.id]: { optionId: option.id, assignData: option.assign || {} }
    };
    setModifierAnswers(newAnswers);

    if (isLastModifier) {
      // Complete the modifier bundle
      onComplete(node.id, newAnswers, node.next);
    } else {
      // Move to next modifier
      setCurrentModifierIndex(currentModifierIndex + 1);
    }
  };

  const handleSkipAll = () => {
    onComplete(node.id, modifierAnswers, node.next);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Optional check {currentModifierIndex + 1} of {node.modifiers.length}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkipAll}
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            Skip remaining
          </Button>
        </div>
        <h2 className="text-2xl font-semibold text-slate-900">{currentModifier.prompt}</h2>
      </div>

      <div className="space-y-3">
        {currentModifier.options.map((option) => (
          <Button
            key={option.id}
            onClick={() => handleOptionClick(option)}
            variant="outline"
            size="lg"
            className="w-full h-auto min-h-[56px] p-4 text-left justify-start border-2 border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-base font-medium text-slate-900 whitespace-normal"
          >
            {option.label}
          </Button>
        ))}
      </div>

      <div className="mt-4">
        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-slate-600 transition-all duration-300"
            style={{ width: `${((currentModifierIndex + 1) / node.modifiers.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ModifierBundle;
