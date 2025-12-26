import { MEGAFLOW } from '../data/megaflow';

// Confidence bounds as per specification
const CONFIDENCE_FLOOR = 0.30;
const CONFIDENCE_BASELINE_CEILING = 0.85;
const CONFIDENCE_TOOL_CEILING = 0.95;

export const computeDiagnoses = (answerMap, contextFlags, observations) => {
  // Extract terminal diagnosis from the last answer that assigned a candidate
  let primaryDiagnosisId = null;
  let terminalSeverity = null;
  let secondaryDiagnosisId = null;
  
  // Find terminal diagnosis assignment (last answer with candidate)
  const answers = Object.entries(answerMap);
  for (let i = answers.length - 1; i >= 0; i--) {
    const [nodeId, answer] = answers[i];
    
    // Check regular answer
    if (answer.assignData?.candidate) {
      if (!primaryDiagnosisId) {
        primaryDiagnosisId = answer.assignData.candidate;
        terminalSeverity = answer.assignData.severity;
      } else if (!secondaryDiagnosisId) {
        secondaryDiagnosisId = answer.assignData.candidate;
      }
    }
    
    // Check modifier answers
    if (answer.modifierAnswers && !primaryDiagnosisId) {
      const modAnswers = Object.values(answer.modifierAnswers);
      for (let j = modAnswers.length - 1; j >= 0; j--) {
        if (modAnswers[j].assignData?.candidate) {
          if (!primaryDiagnosisId) {
            primaryDiagnosisId = modAnswers[j].assignData.candidate;
            terminalSeverity = modAnswers[j].assignData.severity;
          } else if (!secondaryDiagnosisId) {
            secondaryDiagnosisId = modAnswers[j].assignData.candidate;
          }
        }
      }
    }
  }
  
  // Fallback if no diagnosis found
  if (!primaryDiagnosisId) {
    primaryDiagnosisId = 'generic_check_engine';
  }
  
  // Get diagnosis definitions
  const primaryDiagnosisDef = MEGAFLOW.diagnoses[primaryDiagnosisId];
  const secondaryDiagnosisDef = secondaryDiagnosisId ? MEGAFLOW.diagnoses[secondaryDiagnosisId] : null;
  
  if (!primaryDiagnosisDef) {
    // Fallback to generic
    primaryDiagnosisId = 'generic_check_engine';
  }
  
  // Calculate confidence for primary (static baseLikelihood with minimal adjustments)
  let primaryLikelihood = primaryDiagnosisDef?.baseLikelihood || 0.50;
  
  // Apply context flag adjustments (very limited, max ±5%)
  let contextAdjustment = 0;
  if (contextFlags.includes('out_of_fuel') && primaryDiagnosisId.includes('fuel')) {
    contextAdjustment += 0.05;
  }
  if (contextFlags.includes('flat_tire') && primaryDiagnosisId.includes('tire')) {
    contextAdjustment += 0.05;
  }
  if (contextFlags.includes('leak') && primaryDiagnosisId.includes('leak')) {
    contextAdjustment += 0.05;
  }
  
  primaryLikelihood += contextAdjustment;
  
  // Apply hard floor and ceiling
  primaryLikelihood = Math.max(CONFIDENCE_FLOOR, Math.min(CONFIDENCE_BASELINE_CEILING, primaryLikelihood));
  
  // Determine severity (escalation logic)
  let detectedSeverity = terminalSeverity || primaryDiagnosisDef?.severity || 'normal';
  
  // Check observations for severity escalation
  const activeObservations = observations.filter(o => o.state === 'active');
  activeObservations.forEach(obs => {
    if (obs.tags.includes('exhaust_fumes') && 
        (obs.smellSource === 'cabin' || obs.smellSource === 'vents')) {
      detectedSeverity = 'critical';
    }
  });
  
  detectedSeverity = escalateSeverity(detectedSeverity, primaryDiagnosisDef?.severity || 'normal');
  
  // Calculate secondary if exists (scaled down relative to primary)
  let secondaryResult = null;
  if (secondaryDiagnosisDef) {
    let secondaryLikelihood = secondaryDiagnosisDef.baseLikelihood;
    
    // Scale down secondary relative to primary (typically 10-20% less)
    secondaryLikelihood = Math.min(secondaryLikelihood, primaryLikelihood - 0.10);
    
    // Apply floor
    secondaryLikelihood = Math.max(CONFIDENCE_FLOOR, secondaryLikelihood);
    
    // Only show secondary if within reasonable range of primary (gap < 30%)
    if (primaryLikelihood - secondaryLikelihood < 0.30) {
      secondaryResult = {
        diagnosis: { ...secondaryDiagnosisDef, id: secondaryDiagnosisId },
        likelihood: secondaryLikelihood,
        severity: secondaryDiagnosisDef.severity || detectedSeverity
      };
    }
  }
  
  // Optional: Apply negative evidence (reduce incompatible diagnoses)
  // Currently not implemented - could check for contradictory paths in answerMap
  
  const primary = {
    diagnosis: { ...primaryDiagnosisDef, id: primaryDiagnosisId },
    likelihood: primaryLikelihood,
    severity: detectedSeverity
  };
  
  // Get commonly mistaken for
  const commonMistakenFor = MEGAFLOW.commonMistakenFor[primaryDiagnosisId] || [];
  
  return {
    primary,
    secondary: secondaryResult,
    commonMistakenFor
  };
};

const escalateSeverity = (current, newSeverity) => {
  const levels = { normal: 0, caution: 1, critical: 2 };
  const currentLevel = levels[current] || 0;
  const newLevel = levels[newSeverity] || 0;
  return newLevel > currentLevel ? newSeverity : current;
};
