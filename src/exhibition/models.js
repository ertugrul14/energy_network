/**
 * EXHIBITION - City Scale Building Data
 * Defines building types for neighborhood simulation (40,000 people)
 * Buildings match research: stadium, airport, hospital, residential, school, port, factory, office tower
 */

// Neighborhood population for city-scale simulation
export const NEIGHBORHOOD_POPULATION = 40000;

// Building types for the physical maquette — each has average power consumption
// Used to calculate: "how long could this building run on the neighborhood's AI energy?"
export const BUILDING_TYPES = {
  residential: {
    id: 'residential',
    name: 'Residential Buildings',
    icon: '🏠',
    description: '10 apartment buildings with 40 units each',
    pwm: 20,
    avgPowerKw: 500,
    order: 1
  },
  hospital: {
    id: 'hospital',
    name: 'Hospital',
    icon: '🏥',
    description: '24/7 operations, life-critical systems',
    pwm: 60,
    avgPowerKw: 2500,
    order: 2
  },
  school: {
    id: 'school',
    name: 'School',
    icon: '🏫',
    description: 'Classrooms, labs, heating and lighting',
    pwm: 40,
    avgPowerKw: 300,
    order: 3
  },
  stadium: {
    id: 'stadium',
    name: 'Stadium',
    icon: '🏟️',
    description: 'Floodlights, screens, PA systems',
    pwm: 200,
    avgPowerKw: 8000,
    order: 4
  },
  airport: {
    id: 'airport',
    name: 'Airport',
    icon: '✈️',
    description: 'Terminals, runway lights, radar',
    pwm: 255,
    avgPowerKw: 15000,
    order: 5
  },
  port: {
    id: 'port',
    name: 'Port',
    icon: '🚢',
    description: 'Cranes, refrigeration, dock lights',
    pwm: 180,
    avgPowerKw: 6000,
    order: 6
  },
  factory: {
    id: 'factory',
    name: 'Factory',
    icon: '🏭',
    description: 'Manufacturing machinery, ventilation',
    pwm: 220,
    avgPowerKw: 10000,
    order: 7
  },
  officeTower: {
    id: 'officeTower',
    name: 'Office Tower',
    icon: '🏢',
    description: 'HVAC, elevators, computers, lighting',
    pwm: 120,
    avgPowerKw: 4000,
    order: 8
  }
};

// ============================================
// SCENARIO COMPONENTS — Urban interventions
// Each component modifies the simulation when added to the city.
// ============================================

export const SCENARIO_COMPONENTS = {
  localDatacenter: {
    id: 'localDatacenter',
    name: 'Local Data Center',
    icon: '🖥️',
    description: 'Build a data center in your city — shorter data path, but local heat & water use',
    category: 'infrastructure',
    effects: {
      distanceMultiplier: 0.05,
      pueMultiplier: 1.0,
      carbonIntensityOffset: 0,
      waterMultiplier: 1.2,
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
      carbonIntensityOffset: -120,
      waterMultiplier: 0.9,
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
      waterMultiplier: 1.3,
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
      pueMultiplier: 0.98,
      carbonIntensityOffset: -30,
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
      pueMultiplier: 0.90,
      carbonIntensityOffset: 0,
      waterMultiplier: 0.4,
      label: 'Natural cooling reduces water withdrawal'
    }
  }
};
