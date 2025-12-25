# DIAGNOSTIC CONFIDENCE SCORING - EXACT IMPLEMENTATION

## 1. INITIALIZATION OF CONFIDENCE/LIKELIHOOD VALUES

### Source: `/app/frontend/src/data/megaflow.js` lines 580-629

**Base likelihood values are hardcoded as decimal values (0.0 to 1.0):**

```javascript
diagnoses: {
  dead_battery: { label: "Likely dead or weak battery", baseLikelihood: 0.82, severity: "normal" },
  brake_noise: { label: "Brake system noise", baseLikelihood: 0.70, severity: "caution" },
  brake_wear: { label: "Worn brakes", baseLikelihood: 0.65, severity: "caution" },
  stuck_caliper_possible: { label: "Possible stuck brake caliper", baseLikelihood: 0.55, severity: "caution" },
  // ... etc for all 38 diagnoses
}
```

**These values NEVER change. They are static constants.**

## 2. CANDIDATE ASSIGNMENT FROM USER SELECTIONS

### Source: `/app/frontend/src/data/megaflow.js` 

**Initial symptom selection (e.g., "Brake problem") DOES NOT assign any candidate.**

Example from lines 23-24:
```javascript
{ id: "brake_issue", label: "Brake problem", icon: "OctagonX", nextNode: "brakes.q1" }
// NO assign property - only routes to next question
```

**First question that assigns a candidate** (lines 368-372):
```javascript
"brakes.q1": {
  type: "question",
  prompt: "What describes your brake issue best?",
  options: [
    { id: "b_soft", label: "Pedal feels soft / sinks", next: "brakes.distance", 
      assign: { candidate: "brake_hydraulic", severity: "critical" } },
    { id: "b_long", label: "Takes longer to stop than it should", next: "brakes.pulling", 
      assign: { candidate: "brake_wear" } },
    { id: "b_noise", label: "Grinding or squealing noise", next: "brakes.noise_timing", 
      assign: { candidate: "brake_noise" } }
  ]
}
```

**Follow-up question can assign additional candidates** (lines 374-383):
```javascript
"brakes.noise_timing": {
  type: "question",
  prompt: "When does the noise occur?",
  options: [
    { id: "bn_pedal_only", label: "Only when pressing the brake pedal", next: "brakes.pulling", 
      assign: { candidate: "brake_wear" } },
    { id: "bn_off_pedal", label: "Also when pedal is released / when not braking", next: "brakes.pulling", 
      assign: { candidate: "stuck_caliper_possible", severity: "caution" } },
    { id: "bn_not_sure", label: "Not sure", next: "brakes.pulling" }
    // Note: "Not sure" has NO assign property - does not affect weighting
  ]
}
```

## 3. CONFIDENCE MODIFICATION LOGIC

### Source: `/app/frontend/src/utils/diagnosisEngine.js` lines 3-127

**ENTIRE FUNCTION - NO SUMMARIZATION:**

```javascript
export const computeDiagnoses = (answerMap, contextFlags, observations) => {
  // Step 1: Initialize candidates collection
  const candidates = new Map();
  let detectedSeverity = 'normal';

  // Step 2: Process all answers to collect candidates
  Object.values(answerMap).forEach(answer => {
    if (answer.assignData?.candidate) {
      const candidateId = answer.assignData.candidate;
      if (!candidates.has(candidateId)) {
        // First mention: count = 1
        candidates.set(candidateId, {
          id: candidateId,
          count: 1,
          assignedSeverity: answer.assignData.severity || null
        });
      } else {
        // Subsequent mention: increment count
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

    // Process modifier answers (optional questions)
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

  // Step 3: Check active observations for severity escalations
  const activeObservations = observations.filter(o => o.state === 'active');
  activeObservations.forEach(obs => {
    // ONLY ONE RULE IMPLEMENTED: Exhaust smell in cabin/vents is critical
    if (obs.tags.includes('exhaust_fumes') && 
        (obs.smellSource === 'cabin' || obs.smellSource === 'vents')) {
      detectedSeverity = 'critical';
    }
  });

  // Step 4: Default candidate if none found
  if (candidates.size === 0) {
    candidates.set('generic_check_engine', { id: 'generic_check_engine', count: 1, assignedSeverity: null });
  }

  // Step 5: Calculate adjusted likelihood for each candidate
  const rankedCandidates = Array.from(candidates.entries())
    .map(([id, data]) => {
      const diagnosis = MEGAFLOW.diagnoses[id];
      if (!diagnosis) return null;

      // CONFIDENCE CALCULATION - THIS IS THE CORE LOGIC:
      let likelihood = diagnosis.baseLikelihood; // Start with base value
      
      // ONLY MODIFICATION: +5% per additional mention, capped at 95%
      if (data.count > 1) {
        likelihood = Math.min(0.95, likelihood + (data.count - 1) * 0.05);
      }
      // Ensure likelihood is between 0 and 1
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

  // Step 6: Select primary and secondary
  const primary = rankedCandidates[0];
  const secondary = rankedCandidates[1] && 
    (rankedCandidates[1].likelihood > primary.likelihood - 0.15)
    ? rankedCandidates[1]
    : null;

  // Step 7: Get commonly mistaken for
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
```

## 4. ANSWERS TO SPECIFIC QUESTIONS

### Q: Does initial symptom selection apply confidence changes?
**A: NO. Symptom selection only routes to questions. No candidates are assigned.**

Example:
```javascript
// User clicks "Brake problem" - NO candidate assigned
{ id: "brake_issue", label: "Brake problem", nextNode: "brakes.q1" }

// First candidate assignment happens in brakes.q1
{ id: "b_noise", assign: { candidate: "brake_noise" } }
```

### Q: Which entities accumulate confidence?
**A: Only diagnosis IDs defined in MEGAFLOW.diagnoses.**

Valid diagnosis IDs (38 total):
- `dead_battery`, `brake_noise`, `brake_wear`, `stuck_caliper_possible`, etc.

**Umbrella categories and observations DO NOT accumulate confidence.**
- "Brake problem" (symptom) → NOT a diagnosis entity
- Observations → Only affect severity, NOT likelihood

### Q: Are confidence changes additive?
**A: YES. Purely additive with a hard cap.**

Formula:
```
finalLikelihood = baseLikelihood + (count - 1) * 0.05
capped at: min(0.95, finalLikelihood)
```

Examples:
- Count = 1: `0.70 + (1-1)*0.05 = 0.70` (70%)
- Count = 2: `0.70 + (2-1)*0.05 = 0.75` (75%)  
- Count = 3: `0.70 + (3-1)*0.05 = 0.80` (80%)
- Count = 10: `0.70 + (10-1)*0.05 = 1.15 → capped at 0.95` (95%)

### Q: Is there diminishing return or decay?
**A: NO. Linear additive increase only.**

### Q: Is negative evidence applied?
**A: NO. There is ZERO logic for reducing confidence based on contradictory answers.**

If user answers suggest multiple diagnoses, ALL candidates accumulate independently.
No diagnosis is penalized or reduced due to conflicting evidence.

## 5. EXAMPLE WALKTHROUGH: BRAKE NOISE FLOW

**User flow:**
1. Selects "Brake problem" → NO candidate assigned
2. Answers "Grinding or squealing noise" → Assigns `brake_noise` (count=1)
3. Answers "Also when pedal is released" → Assigns `stuck_caliper_possible` (count=1, severity="caution")
4. Answers "No" to pulling → NO assignment
5. Answers "No" to smell → NO assignment

**Final calculation:**

Candidate: `brake_noise`
- Base: 0.70
- Count: 1
- Final: `0.70 + (1-1)*0.05 = 0.70` (70%)
- Severity: "caution" (from base diagnosis)

Candidate: `stuck_caliper_possible`  
- Base: 0.55
- Count: 1
- Final: `0.55 + (1-1)*0.05 = 0.55` (55%)
- Severity: "caution" (from assign directive)

**Result:**
- Primary: brake_noise at 70% (higher base likelihood)
- Secondary: stuck_caliper_possible at 55% (within 15% threshold)

## 6. OBSERVATIONS IMPACT

**Source: lines 55-63**

Observations affect ONLY severity, NOT likelihood:

```javascript
const activeObservations = observations.filter(o => o.state === 'active');
activeObservations.forEach(obs => {
  if (obs.tags.includes('exhaust_fumes') && 
      (obs.smellSource === 'cabin' || obs.smellSource === 'vents')) {
    detectedSeverity = 'critical';
  }
});
```

**ONLY ONE RULE IMPLEMENTED.**

Observations in "draft" or "resolved" state have ZERO effect.

## 7. CRITICAL LIMITATIONS

1. **No negative evidence**: Contradictory answers never reduce confidence
2. **Linear scaling**: No diminishing returns on multiple mentions
3. **No observation weighting**: Observations don't modify likelihood
4. **Hard cap at 95%**: Cannot reach 100% certainty
5. **No cross-diagnosis logic**: Diagnoses scored independently
6. **Static base values**: No dynamic adjustment based on context flags
7. **Simple sorting**: Ties broken by count, not severity or other factors
8. **Secondary threshold fixed**: 15% gap is hardcoded, not adaptive
