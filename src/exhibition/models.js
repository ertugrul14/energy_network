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
