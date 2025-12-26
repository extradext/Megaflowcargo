import { MEGAFLOW } from '../data/megaflow';

// Confidence bounds as per specification
const CONFIDENCE_FLOOR = 0.30;
const CONFIDENCE_BASELINE_CEILING = 0.85;
const CONFIDENCE_TOOL_CEILING = 0.95;

// Path-based diagnosis determination
const determineDiagnosisFromPath = (answerMap) => {
  const answers = {};
  Object.entries(answerMap).forEach(([nodeId, answer]) => {
    answers[nodeId] = answer.optionId;
    if (answer.modifierAnswers) {
      Object.entries(answer.modifierAnswers).forEach(([modId, modAnswer]) => {
        answers[`${nodeId}.${modId}`] = modAnswer.optionId;
      });
    }
  });
  
  // Brake flow analysis
  if (answers['brakes.q1']) {
    if (answers['brakes.q1'] === 'b_soft') {
      return { primary: 'brake_hydraulic', secondary: null, severity: 'critical' };
    }
    if (answers['brakes.q1'] === 'b_long') {
      if (answers['brakes.pulling'] === 'bp_yes') {
        return { primary: 'stuck_caliper_possible', secondary: 'brake_wear', severity: 'caution' };
      }
      return { primary: 'brake_wear', secondary: null, severity: 'caution' };
    }
    if (answers['brakes.q1'] === 'b_noise') {
      if (answers['brakes.smell'] === 'bs_yes') {
        return { primary: 'stuck_caliper_possible', secondary: 'brake_noise', severity: 'caution' };
      }
      if (answers['brakes.noise_timing'] === 'bn_off_pedal') {
        return { primary: 'stuck_caliper_possible', secondary: 'brake_noise', severity: 'caution' };
      }
      if (answers['brakes.pulling'] === 'bp_yes') {
        return { primary: 'stuck_caliper_possible', secondary: 'brake_noise', severity: 'caution' };
      }
      return { primary: 'brake_noise', secondary: 'brake_wear', severity: 'caution' };
    }
  }
  
  // No start flow analysis
  if (answers['no_start.q1']) {
    if (answers['no_start.lights_dim'] === 'ns_dim_yes') {
      return { primary: 'dead_battery', secondary: 'battery_or_connection', severity: 'normal' };
    }
    if (answers['no_start.lights_dim'] === 'ns_dim_no') {
      return { primary: 'starter_issue', secondary: 'dead_battery', severity: 'normal' };
    }
    if (answers['no_start.power'] === 'ns_none') {
      return { primary: 'no_power_system', secondary: 'battery_or_connection', severity: 'normal' };
    }
    if (answers['no_start.power'] === 'ns_some') {
      return { primary: 'battery_or_connection', secondary: 'starter_issue', severity: 'normal' };
    }
    if (answers['no_start.crank_speed'] === 'ns_crank_slow') {
      return { primary: 'battery_or_connection', secondary: 'starter_issue', severity: 'normal' };
    }
    if (answers['no_start.sudden_gradual'] === 'ns_sudden') {
      return { primary: 'fuel_or_ignition', secondary: 'engine_tune', severity: 'normal' };
    }
    if (answers['no_start.sudden_gradual'] === 'ns_gradual') {
      return { primary: 'engine_tune', secondary: 'fuel_or_ignition', severity: 'normal' };
    }
    // Check modifiers for immobilizer
    if (answers['no_start.modifiers.ns_security'] === 'sec_yes') {
      return { primary: 'immobilizer_issue', secondary: 'dead_battery', severity: 'normal' };
    }
  }
  
  // Stalls flow analysis
  if (answers['stalls.q1']) {
    if (answers['stalls.q1'] === 'st_idle' || answers['stalls.only_stopping'] === 'st_stop_yes') {
      return { primary: 'idle_control', secondary: 'fuel_delivery', severity: 'caution' };
    }
    if (answers['stalls.q1'] === 'st_accel') {
      return { primary: 'fuel_delivery', secondary: 'idle_control', severity: 'caution' };
    }
    if (answers['stalls.bump_turn'] === 'st_bt_yes') {
      return { primary: 'electrical_cut', secondary: 'fuel_delivery', severity: 'caution' };
    }
    if (answers['stalls.q1'] === 'st_random') {
      return { primary: 'unknown_stall', secondary: 'fuel_delivery', severity: 'caution' };
    }
  }
  
  // Won't move flow analysis  
  if (answers['wont_move.q1']) {
    if (answers['wont_move.q1'] === 'wm_cant_shift') {
      return { primary: 'shift_interlock_issue', secondary: null, severity: 'normal' };
    }
    if (answers['wont_move.q1'] === 'wm_neutral') {
      return { primary: 'no_gear_engage', secondary: 'transmission_slip', severity: 'critical' };
    }
    if (answers['wont_move.q1'] === 'wm_revs_barely_moves') {
      return { primary: 'transmission_slip', secondary: 'no_gear_engage', severity: 'critical' };
    }
    if (answers['wont_move.q1'] === 'wm_limp') {
      return { primary: 'limp_mode', secondary: 'transmission_fault', severity: 'caution' };
    }
    if (answers['wont_move.neutral_roll'] === 'wm_roll_no') {
      return { primary: 'parking_brake_or_obstruction', secondary: null, severity: 'normal' };
    }
    if (answers['wont_move.warnings'] === 'wm_warn_trans') {
      return { primary: 'transmission_fault', secondary: 'limp_mode', severity: 'critical' };
    }
    if (answers['wont_move.warnings'] === 'wm_warn_traction') {
      return { primary: 'traction_inhibit', secondary: null, severity: 'caution' };
    }
    if (answers['wont_move.warnings'] === 'wm_warn_parking') {
      return { primary: 'parking_brake_or_obstruction', secondary: null, severity: 'normal' };
    }
  }
  
  // Noise flow analysis
  if (answers['noise.q1']) {
    if (answers['noise.q1'] === 'n_braking') {
      return { primary: 'brake_noise', secondary: 'front_wheel_or_brake', severity: 'caution' };
    }
    if (answers['noise.q1'] === 'n_turning') {
      return { primary: 'suspension_or_cv', secondary: null, severity: 'caution' };
    }
    if (answers['noise.rhythm'] === 'n_rhythm') {
      return { primary: 'tire_or_wheel', secondary: 'wheel_or_tire', severity: 'caution' };
    }
    if (answers['noise.rpm_vs_speed'] === 'n_speed2') {
      return { primary: 'wheel_or_tire', secondary: 'tire_or_wheel', severity: 'caution' };
    }
    if (answers['noise.neutral_test'] === 'n_neutral_change') {
      return { primary: 'engine_related_noise', secondary: null, severity: 'normal' };
    }
    return { primary: 'wheel_or_tire', secondary: null, severity: 'caution' };
  }
  
  // Warning light flow
  if (answers['warning.q1']) {
    if (answers['warning.q1'] === 'w_check') {
      return { primary: 'generic_check_engine', secondary: null, severity: 'normal' };
    }
    if (answers['warning.q1'] === 'w_batt') {
      return { primary: 'charging_system', secondary: 'dead_battery', severity: 'caution' };
    }
    if (answers['warning.q1'] === 'w_oil') {
      const severity = answers['warning.flash'] === 'w_flash' ? 'critical' : 'critical';
      return { primary: 'low_oil_pressure', secondary: null, severity };
    }
  }
  
  // Vibration flow
  if (answers['vibration.q1']) {
    if (answers['vibration.where'] === 'v_steer' || answers['vibration.brake_influence'] === 'v_yes') {
      return { primary: 'front_wheel_or_brake', secondary: 'tires_or_alignment', severity: 'caution' };
    }
    if (answers['vibration.bounce'] === 'v_bounce_yes') {
      return { primary: 'tire_or_wheel', secondary: 'tires_or_alignment', severity: 'caution' };
    }
    return { primary: 'tires_or_alignment', secondary: 'wheel_or_tire', severity: 'normal' };
  }
  
  // Tire flow
  if (answers['tires.q1']) {
    if (answers['tires.q1'] === 't_flat' || answers['tires.loss'] === 'tl_fast') {
      return { primary: 'flat_tire', secondary: null, severity: 'caution' };
    }
    if (answers['tires.q1'] === 't_tpms' || answers['tires.loss'] === 'tl_days') {
      return { primary: 'slow_leak', secondary: 'flat_tire', severity: 'normal' };
    }
    if (answers['tires.q1'] === 't_thump') {
      return { primary: 'tire_or_wheel', secondary: 'flat_tire', severity: 'caution' };
    }
  }
  
  // HVAC flow
  if (answers['hvac.q1']) {
    if (answers['hvac.q1'] === 'h_smell') {
      if (answers['hvac.smell_type'] === 'hs_exhaust') {
        return { primary: 'exhaust_intrusion', secondary: null, severity: 'critical' };
      }
      if (answers['hvac.smell_type'] === 'hs_fuel') {
        return { primary: 'fuel_smell_issue', secondary: null, severity: 'caution' };
      }
      if (answers['hvac.smell_type'] === 'hs_sweet') {
        return { primary: 'coolant_leak_or_heater_core', secondary: 'low_coolant', severity: 'caution' };
      }
      if (answers['hvac.smell_type'] === 'hs_oil') {
        return { primary: 'oil_burn_or_leak', secondary: null, severity: 'caution' };
      }
      if (answers['hvac.smell_type'] === 'hs_elec') {
        return { primary: 'electrical_smell_issue', secondary: null, severity: 'caution' };
      }
    }
    if (answers['hvac.q1'] === 'h_no_heat' || answers['hvac.q1'] === 'h_weak_heat') {
      if (answers['hvac.engine_temp'] === 'he_no') {
        return { primary: 'thermostat_stuck_open', secondary: 'heater_core_flow_or_blend', severity: 'normal' };
      }
      if (answers['hvac.airflow'] === 'ha_none') {
        return { primary: 'blower_or_control_issue', secondary: 'hvac_airflow_issue', severity: 'normal' };
      }
      if (answers['hvac.airflow'] === 'ha_weak') {
        return { primary: 'hvac_airflow_issue', secondary: 'blower_or_control_issue', severity: 'normal' };
      }
      if (answers['hvac.coolant_low'] === 'hc_yes') {
        return { primary: 'low_coolant', secondary: 'coolant_leak_or_heater_core', severity: 'caution' };
      }
      return { primary: 'heater_core_flow_or_blend', secondary: 'hvac_airflow_issue', severity: 'normal' };
    }
    if (answers['hvac.q1'] === 'h_ac') {
      return { primary: 'ac_performance_issue', secondary: 'hvac_control_issue', severity: 'normal' };
    }
    if (answers['hvac.q1'] === 'h_int') {
      if (answers['hvac.intermit.click'] === 'hc_yes') {
        return { primary: 'blend_door_actuator_issue', secondary: 'hvac_control_issue', severity: 'normal' };
      }
      return { primary: 'hvac_control_issue', secondary: 'blend_door_actuator_issue', severity: 'normal' };
    }
  }
  
  // Default fallback
  return { primary: 'generic_check_engine', secondary: null, severity: 'normal' };
};

export const computeDiagnoses = (answerMap, contextFlags, observations) => {
  // Determine diagnosis from complete path
  const { primary: primaryDiagnosisId, secondary: secondaryDiagnosisId, severity: pathSeverity } = 
    determineDiagnosisFromPath(answerMap);
  
  // Get diagnosis definitions
  const primaryDiagnosisDef = MEGAFLOW.diagnoses[primaryDiagnosisId];
  const secondaryDiagnosisDef = secondaryDiagnosisId ? MEGAFLOW.diagnoses[secondaryDiagnosisId] : null;
  
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
  if (contextFlags.includes('leak') && (primaryDiagnosisId.includes('leak') || primaryDiagnosisId.includes('coolant'))) {
    contextAdjustment += 0.05;
  }
  
  primaryLikelihood += contextAdjustment;
  
  // Apply hard floor and ceiling
  primaryLikelihood = Math.max(CONFIDENCE_FLOOR, Math.min(CONFIDENCE_BASELINE_CEILING, primaryLikelihood));
  
  // Determine severity (escalation logic)
  let detectedSeverity = pathSeverity || primaryDiagnosisDef?.severity || 'normal';
  
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


const escalateSeverity = (current, newSeverity) => {
  const levels = { normal: 0, caution: 1, critical: 2 };
  const currentLevel = levels[current] || 0;
  const newLevel = levels[newSeverity] || 0;
  return newLevel > currentLevel ? newSeverity : current;
};
