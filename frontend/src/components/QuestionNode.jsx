import React from 'react';
import { Button } from './ui/button';

const QuestionNode = ({ node, onAnswer }) => {
  const handleOptionClick = (option) => {
    onAnswer(node.id, option.id, option.next, option.assign || {});
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-900">{node.prompt}</h2>
      </div>

      <div className="space-y-3">
        {node.options.map((option) => (
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
    </div>
  );
};

export default QuestionNode;
