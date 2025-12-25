export const generateSafetyChecklist = (severity, diagnosisId, contextFlags) => {
  const checklist = [];

  // Baseline steps (always included)
  checklist.push("Turn on your hazard lights.");
  checklist.push("If safe, move the vehicle out of direct traffic (shoulder or safe spot).");

  // Context-based additions
  if (contextFlags.includes('heavy_traffic') || contextFlags.includes('bad_weather')) {
    checklist.push("If safe, move as far from moving traffic as possible (shoulder, parking lot, side street).");
  }

  if (contextFlags.includes('kids')) {
    checklist.push("Ensure all passengers, especially kids, remain safely seated and buckled unless it is safer to exit.");
  }

  if (contextFlags.includes('night')) {
    checklist.push("At night, turn on interior lights briefly so others can see you, but avoid draining a weak battery.");
  }

  if (contextFlags.includes('dead_phone')) {
    checklist.push("If your phone is low, note your location (signs/exits/landmarks) and consider asking a nearby business to call for help.");
  }

  // Severity-based additions
  if (severity === 'critical') {
    checklist.push("Do not continue driving if you suspect critical engine, brake, or cabin-fume problems. Serious harm or loss of control is possible.");
  } else if (severity === 'caution') {
    checklist.push("If the car still moves, drive very gently to the nearest safe stopping place or repair shop. If anything worsens, stop and reassess.");
  } else {
    checklist.push("If the car feels safe, you may drive carefully to a repair shop. If anything feels worse, stop and reassess.");
  }

  // Special hazard for exhaust intrusion
  if (diagnosisId === 'exhaust_intrusion') {
    checklist.unshift(
      "Turn HVAC off if fumes are entering the cabin.",
      "Open windows and move to fresh air.",
      "Avoid driving if possible; fumes can be dangerous even if the car drives normally."
    );
  }

  // Final step
  checklist.push("If you ever feel unsafe where you are stopped, prioritize personal safety over the vehicle and move to a safer location if possible.");

  return checklist;
};
