import { MEGAFLOW } from '../data/megaflow';

export const computeDiagnoses = (answerMap, contextFlags, observations) => {
  // Collect all candidates from answers
  const candidates = new Map();
  let detectedSeverity = 'normal';

  // Process all answers to collect candidates
  Object.values(answerMap).forEach(answer => {
    if (answer.assignData?.candidate) {
      const candidateId = answer.assignData.candidate;
      if (!candidates.has(candidateId)) {
        candidates.set(candidateId, {
          id: candidateId,
          count: 1,
          assignedSeverity: answer.assignData.severity || null
        });
      } else {
        const existing = candidates.get(candidateId);
        existing.count++;
        if (answer.assignData.severity) {
          existing.assignedSeverity = answer.assignData.severity;
        }
      }
    }

    // Check for severity assignments
    if (answer.assignData?.severity) {
      detectedSeverity = escalateSeverity(detectedSeverity, answer.assignData.severity);
    }

    // Process modifier answers
    if (answer.modifierAnswers) {
      Object.values(answer.modifierAnswers).forEach(modAnswer => {
        if (modAnswer.assignData?.candidate) {
          const candidateId = modAnswer.assignData.candidate;
          if (!candidates.has(candidateId)) {
            candidates.set(candidateId, {
              id: candidateId,
              count: 1,
              assignedSeverity: modAnswer.assignData.severity || null
            });
          } else {
            const existing = candidates.get(candidateId);
            existing.count++;
            if (modAnswer.assignData.severity) {
              existing.assignedSeverity = modAnswer.assignData.severity;
            }
          }
        }
      });
    }
  });

  // Check active observations for severity escalations
  const activeObservations = observations.filter(o => o.state === 'active');
  activeObservations.forEach(obs => {
    // Exhaust smell in cabin/vents is critical
    if (obs.tags.includes('exhaust_fumes') && 
        (obs.smellSource === 'cabin' || obs.smellSource === 'vents')) {
      detectedSeverity = 'critical';
    }
  });

  // If no candidates found, use a default based on context
  if (candidates.size === 0) {
    candidates.set('generic_check_engine', { id: 'generic_check_engine', count: 1, assignedSeverity: null });
  }

  // Rank candidates by count and base likelihood
  const rankedCandidates = Array.from(candidates.entries())
    .map(([id, data]) => {
      const diagnosis = MEGAFLOW.diagnoses[id];
      if (!diagnosis) return null;

      // Calculate adjusted likelihood - ensure it stays as decimal (0-1)
      let likelihood = diagnosis.baseLikelihood;
      // Boost likelihood slightly for multiple mentions, but cap at 0.95
      if (data.count > 1) {
        likelihood = Math.min(0.95, likelihood + (data.count - 1) * 0.05);
      }
      // Ensure likelihood is always between 0 and 1
      likelihood = Math.max(0, Math.min(1, likelihood));

      // Determine final severity
      let finalSeverity = data.assignedSeverity || diagnosis.severity || detectedSeverity;
      finalSeverity = escalateSeverity(finalSeverity, detectedSeverity);

      return {
        diagnosis: { ...diagnosis, id },
        likelihood,
        severity: finalSeverity,
        count: data.count
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      // Sort by likelihood descending
      if (Math.abs(a.likelihood - b.likelihood) > 0.05) {
        return b.likelihood - a.likelihood;
      }
      // Then by count
      return b.count - a.count;
    });

  const primary = rankedCandidates[0];
  const secondary = rankedCandidates[1] && 
    (rankedCandidates[1].likelihood > primary.likelihood - 0.15)
    ? rankedCandidates[1]
    : null;

  // Get commonly mistaken for
  const commonMistakenFor = MEGAFLOW.commonMistakenFor[primary.diagnosis.id] || [];

  return {
    primary,
    secondary,
    commonMistakenFor
  };
};

const escalateSeverity = (current, newSeverity) => {
  const levels = { normal: 0, caution: 1, critical: 2 };
  const currentLevel = levels[current] || 0;
  const newLevel = levels[newSeverity] || 0;
  return newLevel > currentLevel ? newSeverity : current;
};
