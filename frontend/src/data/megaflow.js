// CarScan MegaFlow Canonical Definition
export const MEGAFLOW = {
  contextFlags: [
    { id: "flat_tire", label: "Flat tire / low tire", icon: "Gauge" },
    { id: "alone", label: "I am alone", icon: "User" },
    { id: "night", label: "Nighttime / dark", icon: "Moon" },
    { id: "dead_phone", label: "Phone battery is low / dead", icon: "BatteryLow" },
    { id: "out_of_fuel", label: "Might be out of fuel", icon: "Fuel" },
    { id: "leak", label: "Visible fluid leak", icon: "Droplet" },
    { id: "heavy_traffic", label: "Heavy or fast traffic", icon: "Car" },
    { id: "bad_weather", label: "Bad weather", icon: "CloudRain" },
    { id: "unsafe_feel", label: "Car feels unsafe to drive", icon: "AlertTriangle" },
    { id: "kids", label: "Kids / passengers on board", icon: "Users" }
  ],

  mainSymptoms: [
    { id: "no_start", label: "Car will not start", icon: "Key", nextNode: "no_start.q1" },
    { id: "stalls_driving", label: "Car stalls or dies while driving", icon: "AlertCircle", nextNode: "stalls.q1" },
    { id: "won_t_move", label: "Car starts but won't move", icon: "CircleSlash", nextNode: "wont_move.q1" },
    { id: "strange_noise", label: "Strange noise", icon: "Volume2", nextNode: "noise.q1" },
    { id: "warning_light", label: "Warning light on", icon: "AlertTriangle", nextNode: "warning.q1" },
    { id: "vibration", label: "Heavy vibration or shaking", icon: "Vibrate", nextNode: "vibration.q1" },
    { id: "brake_issue", label: "Brake problem", icon: "OctagonX", nextNode: "brakes.q1" },
    { id: "tire_issue", label: "Flat tire / tire issue", icon: "Circle", nextNode: "tires.q1" },
    { id: "hvac_problem", label: "Heating / Air Conditioning problem", icon: "Thermometer", nextNode: "hvac.q1" }
  ],

  nodes: {
    // NO START FLOW
    "no_start.q1": {
      id: "no_start.q1",
      type: "question",
      prompt: "When you try to start the car, what happens?",
      options: [
        { id: "ns_nothing", label: "Almost nothing happens", next: "no_start.power" },
        { id: "ns_clicking", label: "Rapid or single clicking", next: "no_start.lights_dim" },
        { id: "ns_cranks", label: "Engine cranks/turns but does not start", next: "no_start.crank_speed" }
      ]
    },
    "no_start.lights_dim": {
      id: "no_start.lights_dim",
      type: "question",
      prompt: "Do the dashboard/interior lights seem dim or flickering?",
      options: [
        { id: "ns_dim_yes", label: "Yes, dim or flickering", next: "no_start.modifiers", assign: { candidate: "dead_battery" } },
        { id: "ns_dim_no", label: "No, lights seem normal", next: "no_start.modifiers", assign: { candidate: "starter_issue" } }
      ]
    },
    "no_start.crank_speed": {
      id: "no_start.crank_speed",
      type: "question",
      prompt: "How does it crank?",
      options: [
        { id: "ns_crank_slow", label: "Slow / labored", next: "no_start.modifiers", assign: { candidate: "battery_or_connection" } },
        { id: "ns_crank_normal", label: "Normal speed", next: "no_start.sudden_gradual" },
        { id: "ns_crank_fast", label: "Very fast / uneven", next: "no_start.sudden_gradual" }
      ]
    },
    "no_start.power": {
      id: "no_start.power",
      type: "question",
      prompt: "Do ANY lights, chimes, or electronics turn on when you try?",
      options: [
        { id: "ns_none", label: "No, nothing at all", next: "no_start.modifiers", assign: { candidate: "no_power_system" } },
        { id: "ns_some", label: "Some things come on", next: "no_start.modifiers", assign: { candidate: "battery_or_connection" } }
      ]
    },
    "no_start.sudden_gradual": {
      id: "no_start.sudden_gradual",
      type: "question",
      prompt: "Did this start suddenly, or has it been getting worse?",
      options: [
        { id: "ns_sudden", label: "Very sudden", next: "no_start.modifiers", assign: { candidate: "fuel_or_ignition" } },
        { id: "ns_gradual", label: "Got worse over time", next: "no_start.modifiers", assign: { candidate: "engine_tune" } }
      ]
    },
    "no_start.modifiers": {
      id: "no_start.modifiers",
      type: "modifier_bundle",
      prompt: "A few quick checks (optional) to improve accuracy.",
      next: "results",
      modifiers: [
        {
          id: "ns_security",
          prompt: "Do you see a flashing key/security/immobilizer light?",
          options: [
            { id: "sec_yes", label: "Yes", assign: { candidate: "immobilizer_issue" } },
            { id: "sec_no", label: "No" }
          ]
        },
        {
          id: "ns_fuel_gauge",
          prompt: "Does your fuel gauge usually read correctly?",
          options: [
            { id: "fg_yes", label: "Yes" },
            { id: "fg_no", label: "No / unsure", assign: { contextBoost: "out_of_fuel" } }
          ]
        },
        {
          id: "ns_temp",
          prompt: "Does this happen mostly when the engine is cold or hot?",
          options: [
            { id: "t_cold", label: "Mostly cold" },
            { id: "t_hot", label: "Mostly hot" },
            { id: "t_always", label: "No pattern / always" }
          ]
        },
        {
          id: "ns_recent_work",
          prompt: "Did this start right after recent work, fueling, or a jump start?",
          options: [
            { id: "rw_yes", label: "Yes", assign: { globalModifier: "recent_change" } },
            { id: "rw_no", label: "No" }
          ]
        },
        {
          id: "ns_weather",
          prompt: "Did this start after heavy rain, deep water, or extreme cold?",
          options: [
            { id: "wx_yes", label: "Yes", assign: { globalModifier: "weather_event" } },
            { id: "wx_no", label: "No" }
          ]
        }
      ]
    },

    // STALLS FLOW
    "stalls.q1": {
      id: "stalls.q1",
      type: "question",
      prompt: "When the car stalls, what are you doing?",
      options: [
        { id: "st_idle", label: "Idling / at a stop", next: "stalls.restart", assign: { candidate: "idle_control" } },
        { id: "st_accel", label: "Accelerating or going uphill", next: "stalls.restart", assign: { candidate: "fuel_delivery" } },
        { id: "st_random", label: "Seems random", next: "stalls.restart", assign: { candidate: "unknown_stall" } }
      ]
    },
    "stalls.restart": {
      id: "stalls.restart",
      type: "question",
      prompt: "After it stalls, does it restart easily?",
      options: [
        { id: "st_restart_immediate", label: "Yes, restarts easily", next: "stalls.bump_turn", assign: { candidate: "idle_control" } },
        { id: "st_restart_stop", label: "Only after stopping / waiting", next: "stalls.bump_turn", assign: { candidate: "fuel_delivery" } },
        { id: "st_restart_hard", label: "Hard to restart", next: "stalls.bump_turn", assign: { candidate: "fuel_delivery" } }
      ]
    },
    "stalls.bump_turn": {
      id: "stalls.bump_turn",
      type: "question",
      prompt: "Does it stall after bumps or turning?",
      options: [
        { id: "st_bt_yes", label: "Yes", next: "stalls.only_stopping", assign: { candidate: "electrical_cut" } },
        { id: "st_bt_no", label: "No", next: "stalls.only_stopping" }
      ]
    },
    "stalls.only_stopping": {
      id: "stalls.only_stopping",
      type: "question",
      prompt: "Does it stall mostly when coming to a stop?",
      options: [
        { id: "st_stop_yes", label: "Yes", next: "stalls.modifiers", assign: { candidate: "idle_control" } },
        { id: "st_stop_no", label: "No", next: "stalls.modifiers" }
      ]
    },
    "stalls.modifiers": {
      id: "stalls.modifiers",
      type: "modifier_bundle",
      prompt: "Optional context to improve accuracy.",
      next: "results",
      modifiers: [
        {
          id: "st_fuel",
          prompt: "Could you be low on fuel, or is your fuel gauge unreliable?",
          options: [
            { id: "st_fuel_yes", label: "Yes / unsure", assign: { contextBoost: "out_of_fuel" } },
            { id: "st_fuel_no", label: "No" }
          ]
        },
        {
          id: "st_recent",
          prompt: "Did this start right after recent work or fueling?",
          options: [
            { id: "st_rw_yes", label: "Yes", assign: { globalModifier: "recent_change" } },
            { id: "st_rw_no", label: "No" }
          ]
        },
        {
          id: "st_temp",
          prompt: "Does it happen mostly cold or hot?",
          options: [
            { id: "st_cold", label: "Mostly cold" },
            { id: "st_hot", label: "Mostly hot" },
            { id: "st_always", label: "No pattern" }
          ]
        }
      ]
    },

    // WON'T MOVE FLOW
    "wont_move.q1": {
      id: "wont_move.q1",
      type: "question",
      prompt: "What happens when you shift into drive (or first gear) and press the gas?",
      options: [
        { id: "wm_cant_shift", label: "I can't shift out of park", next: "wont_move.warnings", assign: { candidate: "shift_interlock_issue" } },
        { id: "wm_neutral", label: "It feels like it's in neutral", next: "wont_move.rpm", assign: { candidate: "no_gear_engage" } },
        { id: "wm_revs_barely_moves", label: "Engine revs, but the car barely moves", next: "wont_move.rpm", assign: { candidate: "transmission_slip" } },
        { id: "wm_limp", label: "It moves but has very limited power (limp mode)", next: "wont_move.warnings", assign: { candidate: "limp_mode" } }
      ]
    },
    "wont_move.rpm": {
      id: "wont_move.rpm",
      type: "question",
      prompt: "When you press the gas, how does the engine respond?",
      options: [
        { id: "wm_rpm_normal", label: "RPM rises normally", next: "wont_move.neutral_roll" },
        { id: "wm_rpm_barely", label: "RPM barely changes", next: "wont_move.neutral_roll", assign: { candidate: "engine_power_reduction" } },
        { id: "wm_rpm_bogs", label: "It bogs / struggles", next: "wont_move.neutral_roll", assign: { candidate: "engine_power_issue" } }
      ]
    },
    "wont_move.neutral_roll": {
      id: "wont_move.neutral_roll",
      type: "question",
      prompt: "If you put it in neutral on a flat surface, does it roll freely?",
      options: [
        { id: "wm_roll_yes", label: "Yes, rolls freely", next: "wont_move.warnings" },
        { id: "wm_roll_no", label: "No, it drags or resists", next: "wont_move.warnings", assign: { candidate: "parking_brake_or_obstruction" } }
      ]
    },
    "wont_move.warnings": {
      id: "wont_move.warnings",
      type: "question",
      prompt: "Do you see any of these warnings right now?",
      options: [
        { id: "wm_warn_trans", label: "Transmission warning", next: "results", assign: { candidate: "transmission_fault" } },
        { id: "wm_warn_traction", label: "Traction / stability warning", next: "results", assign: { candidate: "traction_inhibit" } },
        { id: "wm_warn_parking", label: "Parking brake light stays on", next: "results", assign: { candidate: "parking_brake_or_obstruction" } },
        { id: "wm_warn_none", label: "No warnings / unsure", next: "results" }
      ]
    },

    // NOISE FLOW
    "noise.q1": {
      id: "noise.q1",
      type: "question",
      prompt: "When do you mostly hear the noise?",
      options: [
        { id: "n_braking", label: "When braking", next: "noise.rpm_vs_speed", assign: { candidate: "brake_noise" } },
        { id: "n_turning", label: "When turning", next: "noise.rpm_vs_speed", assign: { candidate: "suspension_or_cv" } },
        { id: "n_constant", label: "It's fairly constant", next: "noise.rpm_vs_speed" },
        { id: "n_speed", label: "It changes with speed even when not braking", next: "noise.rpm_vs_speed", assign: { candidate: "wheel_or_tire" } }
      ]
    },
    "noise.rpm_vs_speed": {
      id: "noise.rpm_vs_speed",
      type: "question",
      prompt: "Does the noise change more with engine RPM or vehicle speed?",
      options: [
        { id: "n_rpm", label: "Engine RPM", next: "noise.pitch" },
        { id: "n_speed2", label: "Vehicle speed", next: "noise.pitch", assign: { candidate: "wheel_or_tire" } },
        { id: "n_both", label: "Both / unsure", next: "noise.pitch" }
      ]
    },
    "noise.pitch": {
      id: "noise.pitch",
      type: "question",
      prompt: "How would you describe the pitch?",
      options: [
        { id: "n_high", label: "High-pitched (squeal/whine)", next: "noise.rhythm" },
        { id: "n_low", label: "Low (rumble/growl)", next: "noise.rhythm" }
      ]
    },
    "noise.rhythm": {
      id: "noise.rhythm",
      type: "question",
      prompt: "Is it constant or rhythmic (thump/thump)?",
      options: [
        { id: "n_const", label: "Constant", next: "noise.neutral_test" },
        { id: "n_rhythm", label: "Rhythmic / thumping", next: "noise.neutral_test", assign: { candidate: "tire_or_wheel" } }
      ]
    },
    "noise.neutral_test": {
      id: "noise.neutral_test",
      type: "question",
      prompt: "If you shift to neutral while moving (safe to do so), does the noise change?",
      options: [
        { id: "n_neutral_nochange", label: "No change", next: "results" },
        { id: "n_neutral_change", label: "It changes", next: "results", assign: { candidate: "engine_related_noise" } },
        { id: "n_neutral_unsure", label: "Not sure / can't try", next: "results" }
      ]
    },

    // WARNING LIGHT FLOW
    "warning.q1": {
      id: "warning.q1",
      type: "question",
      prompt: "Which warning best matches what you see?",
      options: [
        { id: "w_check", label: "Check engine light", next: "warning.flash", assign: { candidate: "generic_check_engine" } },
        { id: "w_batt", label: "Battery / charging light", next: "warning.flash", assign: { candidate: "charging_system" } },
        { id: "w_oil", label: "Oil pressure light", next: "warning.flash", assign: { candidate: "low_oil_pressure" } }
      ]
    },
    "warning.flash": {
      id: "warning.flash",
      type: "question",
      prompt: "Is the light flashing or steady?",
      options: [
        { id: "w_flash", label: "Flashing", next: "warning.timing", assign: { severity: "critical" } },
        { id: "w_steady", label: "Steady", next: "warning.timing" }
      ]
    },
    "warning.timing": {
      id: "warning.timing",
      type: "question",
      prompt: "Did it appear suddenly, or has it been on for a while?",
      options: [
        { id: "w_sudden", label: "Suddenly", next: "results" },
        { id: "w_long", label: "Has been on for days/weeks", next: "results" }
      ]
    },

    // VIBRATION FLOW
    "vibration.q1": {
      id: "vibration.q1",
      type: "question",
      prompt: "When do you mostly feel the vibration?",
      options: [
        { id: "v_hiway", label: "Mostly at highway speed", next: "vibration.where", assign: { candidate: "tires_or_alignment" } },
        { id: "v_all", label: "At many speeds", next: "vibration.where" },
        { id: "v_brake", label: "Mostly when braking", next: "vibration.where", assign: { candidate: "front_wheel_or_brake" } }
      ]
    },
    "vibration.where": {
      id: "vibration.where",
      type: "question",
      prompt: "Where do you mostly feel it?",
      options: [
        { id: "v_steer", label: "Steering wheel", next: "vibration.brake_influence", assign: { candidate: "front_wheel_or_brake" } },
        { id: "v_seat", label: "Seat / whole car", next: "vibration.brake_influence", assign: { candidate: "tires_or_alignment" } }
      ]
    },
    "vibration.brake_influence": {
      id: "vibration.brake_influence",
      type: "question",
      prompt: "Does it change noticeably with light braking?",
      options: [
        { id: "v_yes", label: "Yes", next: "vibration.bounce", assign: { candidate: "front_wheel_or_brake" } },
        { id: "v_no", label: "No", next: "vibration.bounce" }
      ]
    },
    "vibration.bounce": {
      id: "vibration.bounce",
      type: "question",
      prompt: "Does it feel like the car is bouncing or hopping at speed?",
      options: [
        { id: "v_bounce_yes", label: "Yes", next: "results", assign: { candidate: "tire_or_wheel" } },
        { id: "v_bounce_no", label: "No", next: "results" }
      ]
    },

    // BRAKES FLOW
    "brakes.q1": {
      id: "brakes.q1",
      type: "question",
      prompt: "What describes your brake issue best?",
      options: [
        { id: "b_soft", label: "Pedal feels soft / sinks", next: "brakes.distance" },
        { id: "b_long", label: "Takes longer to stop than it should", next: "brakes.pulling" },
        { id: "b_noise", label: "Grinding or squealing noise", next: "brakes.noise_timing" }
      ]
    },
    "brakes.noise_timing": {
      id: "brakes.noise_timing",
      type: "question",
      prompt: "When does the noise occur?",
      options: [
        { id: "bn_pedal_only", label: "Only when pressing the brake pedal", next: "brakes.pulling" },
        { id: "bn_off_pedal", label: "Also when pedal is released / when not braking", next: "brakes.pulling" },
        { id: "bn_not_sure", label: "Not sure", next: "brakes.pulling" }
      ]
    },
    "brakes.distance": {
      id: "brakes.distance",
      type: "question",
      prompt: "Is stopping distance longer than normal?",
      options: [
        { id: "bd_yes", label: "Yes", next: "brakes.pulling" },
        { id: "bd_no", label: "No / unsure", next: "brakes.pulling" }
      ]
    },
    "brakes.pulling": {
      id: "brakes.pulling",
      type: "question",
      prompt: "Does the car pull to one side when braking?",
      options: [
        { id: "bp_yes", label: "Yes", next: "brakes.smell" },
        { id: "bp_no", label: "No", next: "brakes.smell" }
      ]
    },
    "brakes.smell": {
      id: "brakes.smell",
      type: "question",
      prompt: "Do you notice a hot/burning smell after a short drive?",
      options: [
        { id: "bs_yes", label: "Yes", next: "results", assign: { candidate: "stuck_caliper_possible", severity: "caution" } },
        { id: "bs_no", label: "No", next: "results", assign: { candidate: "brake_wear", severity: "caution" } }
      ]
    },

    // TIRES FLOW
    "tires.q1": {
      id: "tires.q1",
      type: "question",
      prompt: "What best matches your tire problem?",
      options: [
        { id: "t_flat", label: "Obvious flat tire", next: "tires.pulling", assign: { candidate: "flat_tire", severity: "caution" } },
        { id: "t_tpms", label: "TPMS light / tire pressure warning only", next: "tires.pulling", assign: { candidate: "slow_leak" } },
        { id: "t_thump", label: "Thumping/bouncing, unsure which tire", next: "tires.pulling", assign: { candidate: "tire_or_wheel", severity: "caution" } }
      ]
    },
    "tires.pulling": {
      id: "tires.pulling",
      type: "question",
      prompt: "Does the car pull strongly to one side while driving?",
      options: [
        { id: "tp_yes", label: "Yes", next: "tires.loss", assign: { severity: "caution" } },
        { id: "tp_no", label: "No", next: "tires.loss" }
      ]
    },
    "tires.loss": {
      id: "tires.loss",
      type: "question",
      prompt: "How does the tire lose air?",
      options: [
        { id: "tl_fast", label: "Quickly / suddenly", next: "results", assign: { candidate: "flat_tire" } },
        { id: "tl_days", label: "Over days", next: "results", assign: { candidate: "slow_leak" } },
        { id: "tl_unsure", label: "Not sure", next: "results" }
      ]
    },

    // HVAC FLOW
    "hvac.q1": {
      id: "hvac.q1",
      type: "question",
      prompt: "What best describes the HVAC issue?",
      options: [
        { id: "h_no_heat", label: "No heat", next: "hvac.engine_temp" },
        { id: "h_weak_heat", label: "Weak or inconsistent heat", next: "hvac.engine_temp" },
        { id: "h_smell", label: "Bad smell from vents", next: "hvac.smell_type" },
        { id: "h_ac", label: "A/C not cooling", next: "hvac.ac_basic" },
        { id: "h_int", label: "HVAC works sometimes, not others", next: "hvac.intermit.when" }
      ]
    },
    "hvac.engine_temp": {
      id: "hvac.engine_temp",
      type: "question",
      prompt: "Does the engine reach normal temperature?",
      options: [
        { id: "he_yes", label: "Yes", next: "hvac.airflow" },
        { id: "he_no", label: "No / takes a long time", next: "hvac.airflow", assign: { candidate: "thermostat_stuck_open" } },
        { id: "he_unsure", label: "Unsure", next: "hvac.airflow" }
      ]
    },
    "hvac.airflow": {
      id: "hvac.airflow",
      type: "question",
      prompt: "Does air blow strongly from the vents?",
      options: [
        { id: "ha_strong", label: "Yes", next: "hvac.sweet_smell" },
        { id: "ha_weak", label: "Weak", next: "hvac.sweet_smell", assign: { candidate: "hvac_airflow_issue" } },
        { id: "ha_none", label: "No airflow", next: "hvac.sweet_smell", assign: { candidate: "blower_or_control_issue" } }
      ]
    },
    "hvac.sweet_smell": {
      id: "hvac.sweet_smell",
      type: "question",
      prompt: "Do you notice a sweet/coolant-like smell?",
      options: [
        { id: "hs_yes", label: "Yes", next: "hvac.coolant_low", assign: { candidate: "coolant_leak_or_heater_core" } },
        { id: "hs_no", label: "No", next: "hvac.coolant_low" },
        { id: "hs_unsure", label: "Unsure", next: "hvac.coolant_low" }
      ]
    },
    "hvac.coolant_low": {
      id: "hvac.coolant_low",
      type: "question",
      prompt: "Has coolant been low recently (or needed topping off)?",
      options: [
        { id: "hc_yes", label: "Yes", next: "results", assign: { candidate: "low_coolant", severity: "caution" } },
        { id: "hc_no", label: "No", next: "results", assign: { candidate: "heater_core_flow_or_blend" } },
        { id: "hc_unsure", label: "Unsure", next: "results" }
      ]
    },
    "hvac.smell_type": {
      id: "hvac.smell_type",
      type: "question",
      prompt: "What smell do you notice from the vents?",
      options: [
        { id: "hs_exhaust", label: "Exhaust / fumes", next: "hvac.smell_source", assign: { severity: "critical", candidate: "exhaust_intrusion" } },
        { id: "hs_fuel", label: "Fuel", next: "hvac.smell_source", assign: { severity: "caution", candidate: "fuel_smell_issue" } },
        { id: "hs_sweet", label: "Sweet (coolant)", next: "hvac.smell_source", assign: { candidate: "coolant_leak_or_heater_core" } },
        { id: "hs_oil", label: "Burning oil", next: "hvac.smell_source", assign: { candidate: "oil_burn_or_leak" } },
        { id: "hs_elec", label: "Electrical / plastic", next: "hvac.smell_source", assign: { severity: "caution", candidate: "electrical_smell_issue" } }
      ]
    },
    "hvac.smell_source": {
      id: "hvac.smell_source",
      type: "question",
      prompt: "Where do you notice it most?",
      options: [
        { id: "hsrc_out", label: "Mostly outside the car", next: "hvac.recirc_effect" },
        { id: "hsrc_cabin", label: "Inside the cabin", next: "hvac.recirc_effect", assign: { severityAtLeast: "caution" } },
        { id: "hsrc_vents", label: "From vents", next: "hvac.recirc_effect" },
        { id: "hsrc_unsure", label: "Unsure", next: "hvac.recirc_effect" }
      ]
    },
    "hvac.recirc_effect": {
      id: "hvac.recirc_effect",
      type: "question",
      prompt: "Does the smell change when recirculation is ON?",
      options: [
        { id: "hr_better", label: "Yes, improves", next: "hvac.heat_dependency" },
        { id: "hr_nochange", label: "No change", next: "hvac.heat_dependency" },
        { id: "hr_worse", label: "Gets worse", next: "hvac.heat_dependency", assign: { severityAtLeast: "caution" } },
        { id: "hr_unsure", label: "Unsure", next: "hvac.heat_dependency" }
      ]
    },
    "hvac.heat_dependency": {
      id: "hvac.heat_dependency",
      type: "question",
      prompt: "Does it happen only when heat is ON?",
      options: [
        { id: "hh_yes", label: "Yes", next: "results" },
        { id: "hh_no", label: "No", next: "results" },
        { id: "hh_unsure", label: "Unsure", next: "results" }
      ]
    },
    "hvac.ac_basic": {
      id: "hvac.ac_basic",
      type: "question",
      prompt: "When A/C is ON, what best describes it?",
      options: [
        { id: "ac_warm", label: "It blows warm", next: "results", assign: { candidate: "ac_performance_issue" } },
        { id: "ac_weak", label: "Airflow is weak", next: "results", assign: { candidate: "hvac_airflow_issue" } },
        { id: "ac_int", label: "Works sometimes", next: "hvac.intermit.when", assign: { candidate: "hvac_control_issue" } }
      ]
    },
    "hvac.intermit.when": {
      id: "hvac.intermit.when",
      type: "question",
      prompt: "When does HVAC fail most often?",
      options: [
        { id: "hi_cold", label: "Cold start", next: "hvac.intermit.fan" },
        { id: "hi_after", label: "After driving a while", next: "hvac.intermit.fan" },
        { id: "hi_random", label: "Random", next: "hvac.intermit.fan" }
      ]
    },
    "hvac.intermit.fan": {
      id: "hvac.intermit.fan",
      type: "question",
      prompt: "Does fan speed change when adjusted?",
      options: [
        { id: "hf_yes", label: "Yes", next: "hvac.intermit.click" },
        { id: "hf_no", label: "No", next: "hvac.intermit.click", assign: { candidate: "blower_or_control_issue" } }
      ]
    },
    "hvac.intermit.click": {
      id: "hvac.intermit.click",
      type: "question",
      prompt: "Any clicking/actuator noise behind the dash?",
      options: [
        { id: "hc_yes", label: "Yes", next: "results", assign: { candidate: "blend_door_actuator_issue" } },
        { id: "hc_no", label: "No / unsure", next: "results", assign: { candidate: "hvac_control_issue" } }
      ]
    }
  },

  diagnoses: {
    dead_battery: { label: "Likely dead or weak battery", baseLikelihood: 0.82, severity: "normal", safetyTags: ["stranded"] },
    battery_or_connection: { label: "Battery or connection issue", baseLikelihood: 0.74, severity: "normal", safetyTags: ["stranded"] },
    starter_issue: { label: "Possible starter issue", baseLikelihood: 0.68, severity: "normal", safetyTags: ["stranded"] },
    no_power_system: { label: "No electrical power", baseLikelihood: 0.70, severity: "normal", safetyTags: ["stranded"] },
    fuel_or_ignition: { label: "Fuel or ignition problem", baseLikelihood: 0.63, severity: "normal", safetyTags: ["stranded"] },
    engine_tune: { label: "Engine tune / sensor issue", baseLikelihood: 0.55, severity: "normal", safetyTags: ["mechanical"] },
    idle_control: { label: "Idle control / airflow issue", baseLikelihood: 0.58, severity: "caution", safetyTags: ["stalling"] },
    fuel_delivery: { label: "Fuel delivery issue", baseLikelihood: 0.60, severity: "caution", safetyTags: ["stalling"] },
    electrical_cut: { label: "Intermittent electrical cut", baseLikelihood: 0.52, severity: "caution", safetyTags: ["stalling"] },
    unknown_stall: { label: "Unclear stalling cause", baseLikelihood: 0.40, severity: "caution", safetyTags: ["stalling"] },
    transmission_slip: { label: "Possible transmission slipping", baseLikelihood: 0.65, severity: "critical", safetyTags: ["unsafe_drive"] },
    no_gear_engage: { label: "No gear engagement", baseLikelihood: 0.60, severity: "critical", safetyTags: ["unsafe_drive"] },
    parking_brake_or_obstruction: { label: "Parking brake / obstruction", baseLikelihood: 0.70, severity: "normal", safetyTags: ["unsafe_drive"] },
    limp_mode: { label: "Vehicle may be in limp mode", baseLikelihood: 0.55, severity: "caution", safetyTags: ["caution_drive"] },
    brake_noise: { label: "Brake system noise", baseLikelihood: 0.70, severity: "caution", safetyTags: ["brakes"] },
    brake_hydraulic: { label: "Brake hydraulic issue", baseLikelihood: 0.75, severity: "critical", safetyTags: ["critical_brakes"] },
    brake_wear: { label: "Worn brakes", baseLikelihood: 0.65, severity: "caution", safetyTags: ["brakes"] },
    suspension_or_cv: { label: "Suspension or CV joint issue", baseLikelihood: 0.55, severity: "caution", safetyTags: ["unsafe_drive"] },
    wheel_or_tire: { label: "Wheel bearing or tire issue", baseLikelihood: 0.60, severity: "caution", safetyTags: ["unsafe_drive"] },
    tire_or_wheel: { label: "Tire or wheel issue", baseLikelihood: 0.60, severity: "caution", safetyTags: ["unsafe_drive"] },
    tires_or_alignment: { label: "Tire balance or alignment issue", baseLikelihood: 0.60, severity: "normal", safetyTags: ["unsafe_drive"] },
    front_wheel_or_brake: { label: "Front wheel or brake issue", baseLikelihood: 0.60, severity: "caution", safetyTags: ["unsafe_drive", "brakes"] },
    generic_check_engine: { label: "Check engine light on", baseLikelihood: 0.50, severity: "normal", safetyTags: ["check_engine"] },
    charging_system: { label: "Charging system problem", baseLikelihood: 0.70, severity: "caution", safetyTags: ["stranded"] },
    low_oil_pressure: { label: "Low oil pressure (critical)", baseLikelihood: 0.85, severity: "critical", safetyTags: ["critical_engine"] },
    flat_tire: { label: "Flat tire", baseLikelihood: 0.90, severity: "caution", safetyTags: ["tire_flat"] },
    slow_leak: { label: "Slow tire leak", baseLikelihood: 0.70, severity: "normal", safetyTags: ["tire_slow"] },
    immobilizer_issue: { label: "Possible immobilizer/security issue", baseLikelihood: 0.60, severity: "normal", safetyTags: ["stranded"] },
    shift_interlock_issue: { label: "Possible shift interlock issue", baseLikelihood: 0.62, severity: "normal", safetyTags: ["stranded"] },
    stuck_caliper_possible: { label: "Possible stuck brake caliper", baseLikelihood: 0.55, severity: "caution", safetyTags: ["unsafe_drive", "brakes"] },
    thermostat_stuck_open: { label: "Thermostat may be stuck open", baseLikelihood: 0.55, severity: "normal", safetyTags: ["mechanical"] },
    hvac_airflow_issue: { label: "HVAC airflow/blower issue", baseLikelihood: 0.58, severity: "normal", safetyTags: ["comfort"] },
    blower_or_control_issue: { label: "Blower motor or HVAC control issue", baseLikelihood: 0.55, severity: "normal", safetyTags: ["comfort"] },
    coolant_leak_or_heater_core: { label: "Possible coolant leak/heater core issue", baseLikelihood: 0.60, severity: "caution", safetyTags: ["caution_overheat"] },
    low_coolant: { label: "Low coolant possible", baseLikelihood: 0.65, severity: "caution", safetyTags: ["caution_overheat"] },
    heater_core_flow_or_blend: { label: "Heater core flow or blend door issue", baseLikelihood: 0.55, severity: "normal", safetyTags: ["comfort"] },
    exhaust_intrusion: { label: "Possible exhaust fumes entering cabin", baseLikelihood: 0.80, severity: "critical", safetyTags: ["critical_health"] },
    fuel_smell_issue: { label: "Fuel smell concern", baseLikelihood: 0.60, severity: "caution", safetyTags: ["caution_fire"] },
    oil_burn_or_leak: { label: "Possible oil leak/burning smell", baseLikelihood: 0.58, severity: "caution", safetyTags: ["caution_fire"] },
    electrical_smell_issue: { label: "Possible electrical overheating", baseLikelihood: 0.62, severity: "caution", safetyTags: ["caution_fire"] },
    ac_performance_issue: { label: "A/C performance issue", baseLikelihood: 0.55, severity: "normal", safetyTags: ["comfort"] },
    blend_door_actuator_issue: { label: "Blend door actuator issue", baseLikelihood: 0.55, severity: "normal", safetyTags: ["comfort"] },
    hvac_control_issue: { label: "HVAC control/sensor issue", baseLikelihood: 0.50, severity: "normal", safetyTags: ["comfort"] },
    engine_power_reduction: { label: "Engine power reduction", baseLikelihood: 0.55, severity: "caution", safetyTags: ["unsafe_drive"] },
    engine_power_issue: { label: "Engine power issue", baseLikelihood: 0.58, severity: "caution", safetyTags: ["unsafe_drive"] },
    transmission_fault: { label: "Transmission fault", baseLikelihood: 0.70, severity: "critical", safetyTags: ["unsafe_drive"] },
    traction_inhibit: { label: "Traction control inhibiting movement", baseLikelihood: 0.65, severity: "caution", safetyTags: ["unsafe_drive"] },
    engine_related_noise: { label: "Engine-related noise", baseLikelihood: 0.60, severity: "normal", safetyTags: ["mechanical"] }
  },

  commonMistakenFor: {
    dead_battery: ["Bad starter", "Fuel problem", "Security/immobilizer issue"],
    starter_issue: ["Dead battery", "Loose battery terminals"],
    charging_system: ["Dead battery only", "Random electrical glitch"],
    low_oil_pressure: ["Oil change reminder", "Low oil level only"],
    tire_or_wheel: ["Alignment only", "Brake issue"],
    brake_hydraulic: ["Worn brake pads", "Wet roads/traction"],
    exhaust_intrusion: ["Normal engine smell", "Burning oil", "A/C odor", "Outside traffic fumes"],
    fuel_smell_issue: ["Exhaust smell", "A/C odor"]
  }
};
