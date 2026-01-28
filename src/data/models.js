/**
 * GHOST NETWORK - Data Models
 * Geographic and infrastructure data for AI externality mapping
 */

// ============================================
// CITIES - Where AI services are consumed
// ============================================

export const CITIES = {
  barcelona: {
    id: 'barcelona',
    name: 'Barcelona',
    country: 'Spain',
    flag: '🇪🇸',
    coords: { lat: 41.3851, lng: 2.1734 },
    population: 1620000,
    context: 'European tech hub with growing smart city initiatives',
    defaultDatacenter: 'ireland'
  },
  lagos: {
    id: 'lagos',
    name: 'Lagos',
    country: 'Nigeria',
    flag: '🇳🇬',
    coords: { lat: 6.5244, lng: 3.3792 },
    population: 15400000,
    context: 'Africa\'s largest city, emerging digital economy with infrastructure gaps',
    defaultDatacenter: 'singapore'
  },
  phoenix: {
    id: 'phoenix',
    name: 'Phoenix',
    country: 'USA',
    flag: '🇺🇸',
    coords: { lat: 33.4484, lng: -112.0740 },
    population: 1680000,
    context: 'Desert metropolis with extreme heat and water scarcity',
    defaultDatacenter: 'arizona'
  },
  dublin: {
    id: 'dublin',
    name: 'Dublin',
    country: 'Ireland',
    flag: '🇮🇪',
    coords: { lat: 53.3498, lng: -6.2603 },
    population: 544000,
    context: 'Major European data center hub due to tax incentives and climate',
    defaultDatacenter: 'ireland'
  }
};

// ============================================
// DATA CENTERS - Where computation happens
// ============================================

export const DATACENTERS = {
  arizona: {
    id: 'arizona',
    name: 'Arizona Hyperscale',
    location: 'Phoenix, Arizona',
    coords: { lat: 33.3942, lng: -111.9261 },
    operator: 'Generic Cloud Provider',
    
    // Energy profile
    energy: {
      gridMix: {
        natural_gas: 0.35,
        coal: 0.10,
        nuclear: 0.28,
        solar: 0.15,
        wind: 0.07,
        hydro: 0.05
      },
      pue: 1.25, // Power Usage Effectiveness
      carbonIntensity: 385, // gCO2/kWh
      sources: [
        { name: 'Palo Verde Nuclear', coords: { lat: 33.3886, lng: -112.8615 }, type: 'nuclear' },
        { name: 'Gila River Gas Plant', coords: { lat: 33.0589, lng: -112.6854 }, type: 'gas' },
        { name: 'Solana Solar', coords: { lat: 32.9297, lng: -112.9798 }, type: 'solar' }
      ]
    },
    
    // Water profile
    water: {
      source: 'Colorado River Basin / Central Arizona Project',
      sourceCoords: { lat: 36.0161, lng: -114.7377 }, // Lake Mead
      stressLevel: 'extreme', // Based on WRI Aqueduct
      wue: 1.8, // Water Usage Effectiveness (L/kWh)
      aquiferDepletion: 0.42, // 42% depleted
      annualWithdrawal: 2500000000 // liters
    },
    
    // Climate context
    climate: {
      avgTemp: 35, // Celsius in summer
      coolingDays: 280,
      heatPenalty: 1.4 // Extra energy for cooling
    }
  },
  
  finland: {
    id: 'finland',
    name: 'Nordic Green DC',
    location: 'Hamina, Finland',
    coords: { lat: 60.5693, lng: 27.1878 },
    operator: 'Generic Cloud Provider',
    
    energy: {
      gridMix: {
        nuclear: 0.33,
        hydro: 0.22,
        wind: 0.15,
        biomass: 0.12,
        natural_gas: 0.10,
        coal: 0.05,
        peat: 0.03
      },
      pue: 1.10,
      carbonIntensity: 120,
      sources: [
        { name: 'Olkiluoto Nuclear', coords: { lat: 61.2354, lng: 21.4424 }, type: 'nuclear' },
        { name: 'Baltic Wind Farm', coords: { lat: 60.1699, lng: 24.9384 }, type: 'wind' }
      ]
    },
    
    water: {
      source: 'Baltic Sea (seawater cooling)',
      sourceCoords: { lat: 60.4, lng: 27.0 },
      stressLevel: 'low',
      wue: 0.0, // Seawater cooling, no freshwater
      aquiferDepletion: 0.0,
      annualWithdrawal: 0
    },
    
    climate: {
      avgTemp: 5,
      coolingDays: 45,
      heatPenalty: 0.85 // Free cooling most of year
    }
  },
  
  singapore: {
    id: 'singapore',
    name: 'Equinix SG Hub',
    location: 'Singapore',
    coords: { lat: 1.3521, lng: 103.8198 },
    operator: 'Equinix',
    
    energy: {
      gridMix: {
        natural_gas: 0.95,
        solar: 0.03,
        other: 0.02
      },
      pue: 1.55,
      carbonIntensity: 420,
      sources: [
        { name: 'Jurong Island Gas Plants', coords: { lat: 1.2653, lng: 103.6990 }, type: 'gas' },
        { name: 'Sembcorp LNG', coords: { lat: 1.2456, lng: 103.7105 }, type: 'lng' }
      ]
    },
    
    water: {
      source: 'NEWater (recycled) + Imported from Malaysia',
      sourceCoords: { lat: 1.4472, lng: 103.7867 }, // Johor
      stressLevel: 'high',
      wue: 2.2,
      aquiferDepletion: 0.0, // No aquifer
      annualWithdrawal: 1800000000
    },
    
    climate: {
      avgTemp: 31,
      coolingDays: 365,
      heatPenalty: 1.55
    }
  },
  
  ireland: {
    id: 'ireland',
    name: 'Dublin Cloud Campus',
    location: 'Dublin, Ireland',
    coords: { lat: 53.4055, lng: -6.3725 },
    operator: 'Generic Cloud Provider',
    
    energy: {
      gridMix: {
        wind: 0.35,
        natural_gas: 0.48,
        coal: 0.06,
        hydro: 0.03,
        peat: 0.05,
        solar: 0.03
      },
      pue: 1.15,
      carbonIntensity: 295,
      sources: [
        { name: 'Arklow Wind Farm', coords: { lat: 52.7945, lng: -6.0051 }, type: 'wind' },
        { name: 'Dublin Bay Gas', coords: { lat: 53.3331, lng: -6.1245 }, type: 'gas' }
      ]
    },
    
    water: {
      source: 'River Liffey / Bohernabreena Reservoir',
      sourceCoords: { lat: 53.2452, lng: -6.3658 },
      stressLevel: 'moderate',
      wue: 0.8,
      aquiferDepletion: 0.15,
      annualWithdrawal: 450000000
    },
    
    climate: {
      avgTemp: 10,
      coolingDays: 90,
      heatPenalty: 1.0
    }
  }
};

// ============================================
// WORKLOADS - Types of AI computation
// ============================================

export const WORKLOADS = {
  chatbot: {
    id: 'chatbot',
    name: 'AI Chatbot',
    icon: '💬',
    description: 'Large language model inference for conversational AI',
    intensity: 'low',
    
    // Per-session metrics (based on Patterson 2022, Luccioni 2023)
    perSession: {
      queries: 25, // Queries per typical session
      tokensPerQuery: 500,
      kwhPerQuery: 0.0029, // ~2.9 Wh per query
      durationMinutes: 15
    },
    
    // Scaling factors
    scaling: {
      modelSize: 'large', // GPT-4 class
      gpuType: 'A100',
      gpusPerQuery: 8
    }
  },
  
  image: {
    id: 'image',
    name: 'Image Generator',
    icon: '🎨',
    description: 'Diffusion model for AI image synthesis',
    intensity: 'high',
    
    perSession: {
      images: 10,
      stepsPerImage: 50,
      resolution: '1024x1024',
      kwhPerImage: 0.029, // ~29 Wh per image (Luccioni 2023)
      durationMinutes: 20
    },
    
    scaling: {
      modelSize: 'xl',
      gpuType: 'A100',
      gpusPerImage: 1
    }
  },
  
  traffic: {
    id: 'traffic',
    name: 'Traffic AI',
    icon: '🚦',
    description: 'Real-time urban traffic optimization system',
    intensity: 'medium',
    
    perSession: {
      sensors: 500, // Sensors in network
      predictionsPerHour: 12000,
      kwhPerHour: 2.5,
      durationMinutes: 60 // 1 hour of operation
    },
    
    scaling: {
      modelSize: 'medium',
      gpuType: 'T4',
      gpusPerHour: 4
    }
  },
  
  biometric: {
    id: 'biometric',
    name: 'Biometric Security',
    icon: '👁️',
    description: 'Facial recognition and surveillance processing',
    intensity: 'continuous',
    
    perSession: {
      cameras: 100,
      facesPerMinute: 1000,
      kwhPerHour: 8.5,
      durationMinutes: 60 // Represents 1 hour of continuous operation
    },
    
    scaling: {
      modelSize: 'edge-optimized',
      gpuType: 'T4',
      gpusPerHour: 12
    }
  }
};

// ============================================
// MATERIALS SUPPLY CHAIN - Embedded externalities
// ============================================

export const MATERIALS = {
  cobalt: {
    name: 'Cobalt',
    icon: '⛏️',
    source: 'Democratic Republic of Congo',
    sourceCoords: { lat: -10.4167, lng: 25.9167 }, // Katanga province
    use: 'GPU batteries and power systems',
    laborIssue: 'Child labor, unsafe mining conditions',
    annualDemandTons: 175000
  },
  
  lithium: {
    name: 'Lithium',
    icon: '🔋',
    source: 'Chile / Argentina / Australia',
    sourceCoords: { lat: -23.8634, lng: -67.4511 }, // Atacama
    use: 'Battery storage systems',
    laborIssue: 'Water depletion in indigenous lands',
    annualDemandTons: 130000
  },
  
  rareEarth: {
    name: 'Rare Earth Elements',
    icon: '💎',
    source: 'China (Bayan Obo)',
    sourceCoords: { lat: 41.8000, lng: 109.9667 },
    use: 'Magnets in hard drives and cooling systems',
    laborIssue: 'Toxic waste, radioactive tailings',
    annualDemandTons: 240000
  },
  
  silicon: {
    name: 'Silicon',
    icon: '🔌',
    source: 'China (Xinjiang)',
    sourceCoords: { lat: 41.7685, lng: 86.1471 },
    use: 'Semiconductor fabrication',
    laborIssue: 'Forced labor allegations',
    annualDemandTons: 8000000
  },
  
  copper: {
    name: 'Copper',
    icon: '🔶',
    source: 'Chile / Peru',
    sourceCoords: { lat: -22.4585, lng: -68.9291 }, // Chuquicamata
    use: 'Wiring, heat sinks, infrastructure',
    laborIssue: 'Environmental destruction, water conflicts',
    annualDemandTons: 25000000
  }
};

// ============================================
// E-WASTE DESTINATIONS
// ============================================

export const EWASTE = {
  ghana: {
    name: 'Agbogbloshie, Ghana',
    coords: { lat: 5.5500, lng: -0.2167 },
    description: 'World\'s largest e-waste dump',
    annualTons: 250000,
    healthImpact: 'Lead poisoning, respiratory disease'
  },
  
  india: {
    name: 'Seelampur, Delhi',
    coords: { lat: 28.6842, lng: 77.2656 },
    description: 'Informal recycling hub',
    annualTons: 95000,
    healthImpact: 'Toxic fumes, child labor'
  },
  
  china: {
    name: 'Guiyu, China',
    coords: { lat: 23.2958, lng: 116.3536 },
    description: 'Historic e-waste processing center',
    annualTons: 150000,
    healthImpact: 'Heavy metal contamination'
  },
  
  pakistan: {
    name: 'Karachi',
    coords: { lat: 24.8607, lng: 67.0011 },
    description: 'Growing informal sector',
    annualTons: 45000,
    healthImpact: 'Unregulated burning, water pollution'
  }
};

// ============================================
// EMISSIONS DRIFT PATTERNS
// ============================================

export const EMISSIONS_DRIFT = {
  arizona: {
    direction: 'west-northwest',
    destinations: [
      { name: 'California', coords: { lat: 36.7783, lng: -119.4179 } },
      { name: 'Pacific Ocean', coords: { lat: 32.0, lng: -130.0 } }
    ],
    driftDistanceKm: 2400
  },
  
  finland: {
    direction: 'east',
    destinations: [
      { name: 'Russia', coords: { lat: 61.5240, lng: 105.3188 } },
      { name: 'Arctic', coords: { lat: 70.0, lng: 30.0 } }
    ],
    driftDistanceKm: 3200
  },
  
  singapore: {
    direction: 'north',
    destinations: [
      { name: 'South China Sea', coords: { lat: 15.0, lng: 110.0 } },
      { name: 'Vietnam Coast', coords: { lat: 16.0544, lng: 108.2022 } }
    ],
    driftDistanceKm: 1800
  },
  
  ireland: {
    direction: 'east',
    destinations: [
      { name: 'United Kingdom', coords: { lat: 54.7024, lng: -3.2766 } },
      { name: 'North Sea', coords: { lat: 56.0, lng: 3.0 } }
    ],
    driftDistanceKm: 1200
  }
};

// ============================================
// TIME-OF-DAY MODIFIERS
// ============================================

export const TIME_MODIFIERS = {
  // Water usage peaks during hot hours (cooling demand)
  waterUsageByHour: [
    0.6, 0.5, 0.5, 0.5, 0.5, 0.6,  // 00-05
    0.7, 0.8, 0.9, 1.0, 1.1, 1.2,  // 06-11
    1.3, 1.4, 1.5, 1.5, 1.4, 1.3,  // 12-17 (peak)
    1.1, 1.0, 0.9, 0.8, 0.7, 0.6   // 18-23
  ],
  
  // Grid carbon intensity varies (more renewables during day)
  carbonIntensityByHour: [
    1.1, 1.1, 1.1, 1.1, 1.05, 1.0,  // 00-05 (baseload fossil)
    0.95, 0.9, 0.85, 0.8, 0.75, 0.7, // 06-11 (solar ramp)
    0.7, 0.7, 0.75, 0.8, 0.85, 0.9,  // 12-17 (solar peak then drop)
    0.95, 1.0, 1.05, 1.1, 1.1, 1.1   // 18-23 (evening fossil)
  ],
  
  // Electricity demand profile
  demandByHour: [
    0.7, 0.65, 0.6, 0.6, 0.65, 0.7,
    0.8, 0.9, 1.0, 1.1, 1.15, 1.2,
    1.15, 1.1, 1.15, 1.2, 1.25, 1.2,
    1.1, 1.0, 0.9, 0.85, 0.8, 0.75
  ]
};

// ============================================
// NARRATIVE TEMPLATES
// ============================================

export const NARRATIVES = {
  standard: (data) => `
    Your request traveled ${data.distanceKm.toLocaleString()} km to a server in ${data.datacenterLocation}. 
    The electricity came from a grid that is ${Math.round(data.fossilPercent)}% fossil-fueled. 
    ${data.waterLiters > 0 ? `${data.waterLiters.toFixed(1)} liters of water were consumed for cooling.` : 'Seawater cooling was used.'} 
    ${data.co2Grams.toFixed(0)}g of CO₂ was released—it will drift ${data.emissionsDrift.direction} toward ${data.emissionsDrift.destinations[0].name}.
  `,
  
  waterStress: (data) => `
    The ${data.datacenterName} draws water from ${data.waterSource}, an aquifer that is already ${Math.round(data.aquiferDepletion * 100)}% depleted. 
    This single session withdrew ${data.waterLiters.toFixed(1)} liters. 
    By the time you finish reading this, the data center has consumed another ${(data.waterLitersPerSecond * 5).toFixed(0)} liters.
  `,
  
  emissions: (data) => `
    The ${data.co2Grams.toFixed(0)} grams of CO₂ from your session will persist in the atmosphere for 300-1000 years. 
    It joins the ${data.annualTonsCO2.toLocaleString()} tons emitted annually by this facility. 
    The warming it causes will be felt most in regions that consume the least AI.
  `,
  
  materials: (data) => `
    The server processing your request contains cobalt from the DRC, silicon from Xinjiang, and rare earth elements from Inner Mongolia. 
    In 3-5 years, these components will likely end up in ${data.ewasteDestination}, 
    where informal workers will burn them to extract precious metals.
  `,
  
  tradeoff: (data) => `
    You chose to route through ${data.datacenterName}. 
    Compared to ${data.alternativeDatacenter}: 
    ${data.waterDifference > 0 ? `Water use is ${Math.abs(data.waterDifference)}% higher.` : `Water use is ${Math.abs(data.waterDifference)}% lower.`} 
    ${data.emissionsDifference > 0 ? `Emissions are ${Math.abs(data.emissionsDifference)}% higher.` : `Emissions are ${Math.abs(data.emissionsDifference)}% lower.`} 
    There is no clean option—only tradeoffs.
  `
};
