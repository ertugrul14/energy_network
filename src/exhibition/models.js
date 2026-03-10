/**
 * EXHIBITION - City Scale Building Data
 * Defines building types for neighborhood simulation (40,000 people)
 */

// Neighborhood population for city-scale simulation
export const NEIGHBORHOOD_POPULATION = 40000;

// Building types — 4 categories matching the 4 Arduino LED dim levels
export const BUILDING_TYPES = {
  apartment: {
    id: 'apartment',
    name: 'Residential Building',
    icon: '🏠',
    description: 'A typical apartment building with 40 units',
    pwm: 20,
    brightnessLabel: 'Very Dim',
    avgPowerKw: 50,
    order: 1
  },
  hospital: {
    id: 'hospital',
    name: 'Hospital',
    icon: '🏥',
    description: 'A mid-size hospital — 24/7 operations, life-critical systems',
    pwm: 80,
    brightnessLabel: 'Dim',
    avgPowerKw: 2500,
    order: 2
  },
  university: {
    id: 'university',
    name: 'University Campus',
    icon: '🎓',
    description: 'A mid-size university — labs, servers, lecture halls',
    pwm: 160,
    brightnessLabel: 'Medium',
    avgPowerKw: 5000,
    order: 3
  },
  airport: {
    id: 'airport',
    name: 'Airport Terminal',
    icon: '✈️',
    description: 'An international airport terminal — runway lights, terminals',
    pwm: 255,
    brightnessLabel: 'Bright',
    avgPowerKw: 15000,
    order: 4
  }
};

// ============================================
// SCENARIO COMPONENTS — Urban interventions
// Each component modifies the simulation when added to the city.
// Modifiers are multipliers or offsets applied to datacenter/simulation values.
// ============================================

export const SCENARIO_COMPONENTS = {
  localDatacenter: {
    id: 'localDatacenter',
    name: 'Local Data Center',
    icon: '🖥️',
    description: 'Build a data center in your city — shorter data path, but local heat & water use',
    category: 'infrastructure',
    // Simulation modifiers
    effects: {
      distanceMultiplier: 0.05,    // Request stays local (~5% of original distance)
      pueMultiplier: 1.0,          // Same PUE
      carbonIntensityOffset: 0,    // Uses local grid
      waterMultiplier: 1.2,        // More local water consumption
      label: 'Data travels only within the city'
    }
  },
  solarFarm: {
    id: 'solarFarm',
    name: 'Solar Farm',
    icon: '☀️',
    description: 'Add a large solar installation — reduces fossil dependency during daylight',
    category: 'renewable',
    effects: {
      distanceMultiplier: 1.0,
      pueMultiplier: 1.0,
      carbonIntensityOffset: -120,  // Significant reduction in gCO2/kWh
      waterMultiplier: 0.9,         // Slightly less cooling needed
      label: 'Solar panels replace fossil fuel electricity'
    }
  },
  windFarm: {
    id: 'windFarm',
    name: 'Wind Farm',
    icon: '🌬️',
    description: 'Offshore or onshore wind turbines — clean energy day and night',
    category: 'renewable',
    effects: {
      distanceMultiplier: 1.0,
      pueMultiplier: 1.0,
      carbonIntensityOffset: -100,
      waterMultiplier: 0.85,
      label: 'Wind energy reduces grid carbon intensity'
    }
  },
  nuclearPlant: {
    id: 'nuclearPlant',
    name: 'Nuclear Power Station',
    icon: '⚛️',
    description: 'High-capacity baseload clean energy — nearly zero carbon, but long construction',
    category: 'infrastructure',
    effects: {
      distanceMultiplier: 1.0,
      pueMultiplier: 0.95,
      carbonIntensityOffset: -200,
      waterMultiplier: 1.3,        // Nuclear uses lots of cooling water
      label: 'Nuclear baseload drastically cuts carbon'
    }
  },
  urbanPark: {
    id: 'urbanPark',
    name: 'Urban Forest / Park',
    icon: '🌳',
    description: 'Green space acts as carbon sink — absorbs CO₂ but doesn\'t reduce energy use',
    category: 'nature',
    effects: {
      distanceMultiplier: 1.0,
      pueMultiplier: 0.98,         // Slightly cooler microclimate
      carbonIntensityOffset: -30,  // Modest carbon sink
      waterMultiplier: 1.0,
      label: 'Trees absorb CO₂ but energy demand unchanged'
    }
  },
  coolingLake: {
    id: 'coolingLake',
    name: 'Cooling Lake / Reservoir',
    icon: '💧',
    description: 'Natural water body for data center cooling — reduces freshwater depletion',
    category: 'nature',
    effects: {
      distanceMultiplier: 1.0,
      pueMultiplier: 0.90,         // Better cooling efficiency
      carbonIntensityOffset: 0,
      waterMultiplier: 0.4,        // Dramatically less freshwater needed
      label: 'Natural cooling reduces water withdrawal'
    }
  }
};
