import React, { useState, useEffect } from 'react';
import { ChevronLeft, X } from 'lucide-react';
import { Button } from './ui/button';
import ContextSelection from './ContextSelection';
import SymptomSelection from './SymptomSelection';
import QuestionNode from './QuestionNode';
import ModifierBundle from './ModifierBundle';
import ResultsView from './ResultsView';
import ObservationsPanel from './ObservationsPanel';
import { MEGAFLOW } from '../data/megaflow';
import { computeDiagnoses } from '../utils/diagnosisEngine';

const DiagnosticFlow = () => {
  // Check if context has been seen before
  const contextSeen = localStorage.getItem('carScanContextSeen') === 'true';
  const [currentStep, setCurrentStep] = useState(contextSeen ? 'symptom' : 'context');
  const [historyStack, setHistoryStack] = useState([]);
  const [contextFlags, setContextFlags] = useState([]);
  const [answerMap, setAnswerMap] = useState({});
  const [observations, setObservations] = useState([]);
  const [showObservationsPanel, setShowObservationsPanel] = useState(false);
  const [observationNudgeShown, setObservationNudgeShown] = useState(false);
  const [diagnoses, setDiagnoses] = useState(null);

  // Show observation nudge once
  useEffect(() => {
    if (!observationNudgeShown && currentStep !== 'context' && currentStep !== 'symptom') {
      const timer = setTimeout(() => {
        setObservationNudgeShown(true);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [currentStep, observationNudgeShown]);

  const handleContextContinue = (selectedFlags) => {
    setContextFlags(selectedFlags);
    pushHistory('context', null);
    localStorage.setItem('carScanContextSeen', 'true');
    setCurrentStep('symptom');
  };

  const handleSymptomSelect = (symptomId) => {
    const symptom = MEGAFLOW.mainSymptoms.find(s => s.id === symptomId);
    pushHistory('symptom', symptomId);
    setCurrentStep(symptom.nextNode);
  };

  const handleQuestionAnswer = (nodeId, optionId, nextNodeId, assignData) => {
    // Store answer
    const newAnswerMap = { ...answerMap, [nodeId]: { optionId, assignData } };
    setAnswerMap(newAnswerMap);
    pushHistory(nodeId, optionId);

    // Navigate to next node
    if (nextNodeId === 'results') {
      // Compute diagnoses
      const result = computeDiagnoses(newAnswerMap, contextFlags, observations);
      setDiagnoses(result);
      setCurrentStep('results');
    } else {
      setCurrentStep(nextNodeId);
    }
  };

  const handleModifierComplete = (nodeId, modifierAnswers, nextNodeId) => {
    // Store modifier answers
    const newAnswerMap = { ...answerMap, [nodeId]: { modifierAnswers } };
    setAnswerMap(newAnswerMap);
    pushHistory(nodeId, null);

    // Compute and show results
    const result = computeDiagnoses(newAnswerMap, contextFlags, observations);
    setDiagnoses(result);
    setCurrentStep('results');
  };

  const pushHistory = (nodeId, selectedOptionId) => {
    setHistoryStack([...historyStack, { nodeId, selectedOptionId }]);
  };

  const handleBack = () => {
    if (historyStack.length === 0) return;

    const newHistory = [...historyStack];
    const lastEntry = newHistory.pop();
    setHistoryStack(newHistory);

    // Remove answer for the node we're going back from
    const newAnswerMap = { ...answerMap };
    delete newAnswerMap[currentStep];
    setAnswerMap(newAnswerMap);

    // Navigate back
    if (lastEntry.nodeId === 'context') {
      setCurrentStep('context');
    } else if (lastEntry.nodeId === 'symptom') {
      setCurrentStep('symptom');
    } else {
      setCurrentStep(lastEntry.nodeId);
    }
  };

  const handleStartOver = () => {
    if (window.confirm('Start over from beginning? This will reset all your answers.')) {
      const contextWasSeen = localStorage.getItem('carScanContextSeen') === 'true';
      setCurrentStep(contextWasSeen ? 'symptom' : 'context');
      setHistoryStack([]);
      setContextFlags([]);
      setAnswerMap({});
      setDiagnoses(null);
    }
  };

  const canGoBack = historyStack.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {canGoBack && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="h-10 w-10 p-0 hover:bg-slate-100"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              )}
              <h1 className="text-xl font-semibold text-slate-900">CarScan</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowObservationsPanel(!showObservationsPanel)}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                Observations {observations.filter(o => o.state === 'active').length > 0 && 
                  `(${observations.filter(o => o.state === 'active').length})`
                }
              </Button>
              {currentStep !== 'context' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleStartOver}
                  className="text-sm text-slate-600 hover:text-slate-900"
                >
                  Start Over
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {currentStep === 'context' && (
          <ContextSelection onContinue={handleContextContinue} />
        )}

        {currentStep === 'symptom' && (
          <SymptomSelection onSelect={handleSymptomSelect} />
        )}

        {currentStep !== 'context' && 
         currentStep !== 'symptom' && 
         currentStep !== 'results' && 
         MEGAFLOW.nodes[currentStep]?.type === 'question' && (
          <QuestionNode
            node={MEGAFLOW.nodes[currentStep]}
            onAnswer={handleQuestionAnswer}
          />
        )}

        {currentStep !== 'context' && 
         currentStep !== 'symptom' && 
         currentStep !== 'results' && 
         MEGAFLOW.nodes[currentStep]?.type === 'modifier_bundle' && (
          <ModifierBundle
            node={MEGAFLOW.nodes[currentStep]}
            onComplete={handleModifierComplete}
          />
        )}

        {currentStep === 'results' && diagnoses && (
          <ResultsView
            diagnoses={diagnoses}
            contextFlags={contextFlags}
            observations={observations}
          />
        )}

        {/* Observation nudge */}
        {!observationNudgeShown && currentStep !== 'context' && currentStep !== 'symptom' && currentStep !== 'results' && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900 animate-fade-in">
            Adding observations can improve diagnosis accuracy.
          </div>
        )}
      </main>

      {/* Observations Panel */}
      {showObservationsPanel && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowObservationsPanel(false)}>
          <div 
            className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">What You've Noticed</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowObservationsPanel(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <ObservationsPanel
              observations={observations}
              setObservations={setObservations}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DiagnosticFlow;
