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
    aiUsers: 568000,
    exhibitKey: 'Barcelona',
  },
  riyadh: {
    id: 'riyadh',
    name: 'Riyadh',
    country: 'Saudi Arabia',
    flag: '🇸🇦',
    coords: { lat: 24.7136, lng: 46.6753 },
    aiUsers: 2837000,
    exhibitKey: 'Riyadh',
  },
  singapore: {
    id: 'singapore',
    name: 'Singapore',
    country: 'Singapore',
    flag: '🇸🇬',
    coords: { lat: 1.3521, lng: 103.8198 },
    aiUsers: 3670000,
    exhibitKey: 'Singapore',
  },
  lagos: {
    id: 'lagos',
    name: 'Lagos',
    country: 'Nigeria',
    flag: '🇳🇬',
    coords: { lat: 6.5244, lng: 3.3792 },
    aiUsers: 1955000,
    exhibitKey: 'Lagos',
  },
  chicago: {
    id: 'chicago',
    name: 'Chicago',
    country: 'United States',
    flag: '🇺🇸',
    coords: { lat: 41.8781, lng: -87.6298 },
    aiUsers: 1246000,
    exhibitKey: 'Chicago',
  },
  saopaulo: {
    id: 'saopaulo',
    name: 'São Paulo',
    country: 'Brazil',
    flag: '🇧🇷',
    coords: { lat: -23.5505, lng: -46.6333 },
    aiUsers: 3794000,
    exhibitKey: 'SaoPaulo',
  }
};

// ============================================
// DATA CENTERS - Where computation happens
// ============================================

export const DATACENTERS = {
  amsterdam: {
    id: 'amsterdam',
    name: 'Amsterdam Cloud Region',
    location: 'Amsterdam, Netherlands',
    coords: { lat: 52.3676, lng: 4.9041 },
    operator: 'Generic Cloud Provider',
    
    // Energy profile
    energy: {
      gridMix: {
        natural_gas: 0.42,
        wind: 0.20,
        solar: 0.08,
        nuclear: 0.03,
        biomass: 0.10,
        coal: 0.12,
        hydro: 0.05
      },
      pue: 1.15, // Power Usage Effectiveness
      carbonIntensity: 328, // gCO2/kWh (Netherlands grid)
      sources: [
        { name: 'Borssele Nuclear', coords: { lat: 51.4308, lng: 3.7178 }, type: 'nuclear' },
        { name: 'Eemshaven Gas Plant', coords: { lat: 53.4386, lng: 6.8344 }, type: 'gas' },
        { name: 'Gemini Offshore Wind', coords: { lat: 54.0372, lng: 5.9619 }, type: 'wind' }
      ]
    },
    
    // Water profile
    water: {
      source: 'North Sea Canal / Municipal supply',
      sourceCoords: { lat: 52.4168, lng: 4.7836 },
      stressLevel: 'moderate',
      wue: 1.0, // L/kWh
      aquiferDepletion: 0.10,
      annualWithdrawal: 600000000
    },
    
    // Climate context
    climate: {
      avgTemp: 11,
      coolingDays: 90,
      heatPenalty: 1.0
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
  
  singapore_dc: {
    id: 'singapore_dc',
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
  
  riyadh_dc: {
    id: 'riyadh_dc',
    name: 'Riyadh Cloud Region',
    location: 'Riyadh, Saudi Arabia',
    coords: { lat: 24.7136, lng: 46.6753 },
    operator: 'Generic Cloud Provider',

    energy: {
      gridMix: {
        natural_gas: 0.57,
        oil: 0.38,
        solar: 0.04,
        wind: 0.01
      },
      pue: 1.45,
      carbonIntensity: 520,
      sources: [
        { name: 'Riyadh PP Gas Plant', coords: { lat: 24.55, lng: 46.85 }, type: 'gas' },
        { name: 'Saudi Aramco Oil', coords: { lat: 25.38, lng: 49.98 }, type: 'oil' },
        { name: 'Sakaka Solar Park', coords: { lat: 29.97, lng: 40.20 }, type: 'solar' }
      ]
    },

    water: {
      source: 'Desalinated seawater (Red Sea / Arabian Gulf)',
      sourceCoords: { lat: 21.54, lng: 39.17 },
      stressLevel: 'extreme',
      wue: 2.8,
      aquiferDepletion: 0.85,
      annualWithdrawal: 2200000000
    },

    climate: {
      avgTemp: 35,
      coolingDays: 365,
      heatPenalty: 1.70
    }
  },

  frankfurt: {
    id: 'frankfurt',
    name: 'Frankfurt Cloud Region',
    location: 'Frankfurt, Germany',
    coords: { lat: 50.1109, lng: 8.6821 },
    operator: 'Generic Cloud Provider',
    
    energy: {
      gridMix: {
        wind: 0.22,
        solar: 0.10,
        natural_gas: 0.15,
        coal: 0.24,
        nuclear: 0.06,
        biomass: 0.08,
        hydro: 0.04,
        lignite: 0.11
      },
      pue: 1.20,
      carbonIntensity: 350,
      sources: [
        { name: 'North Sea Wind Parks', coords: { lat: 54.5, lng: 7.0 }, type: 'wind' },
        { name: 'Irsching Gas Plant', coords: { lat: 48.7962, lng: 11.5567 }, type: 'gas' },
        { name: 'Schwarze Pumpe Coal', coords: { lat: 51.5350, lng: 14.3564 }, type: 'coal' }
      ]
    },
    
    water: {
      source: 'River Main / Hessian reservoirs',
      sourceCoords: { lat: 50.0873, lng: 8.5997 },
      stressLevel: 'moderate',
      wue: 0.9,
      aquiferDepletion: 0.12,
      annualWithdrawal: 500000000
    },
    
    climate: {
      avgTemp: 11,
      coolingDays: 100,
      heatPenalty: 1.05
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
  prompt: {
    id: 'prompt',
    name: 'Chat with AI',
    provider: 'ChatGPT',
    icon: '💬',
  },
  translate: {
    id: 'translate',
    name: 'Real-time Translation',
    provider: 'Google Translate',
    icon: '🌐',
  },
  pdf: {
    id: 'pdf',
    name: 'Summarise PDF',
    provider: 'Claude',
    icon: '📄',
  },
  background: {
    id: 'background',
    name: 'Remove Background',
    provider: 'Adobe Express',
    icon: '✂️',
  },
  image: {
    id: 'image',
    name: 'Generate Image',
    provider: 'Midjourney',
    icon: '🎨',
  },
  video: {
    id: 'video',
    name: 'Generate Video',
    provider: 'Sora',
    icon: '🎬',
  },
  voice: {
    id: 'voice',
    name: 'Clone Voice',
    provider: 'ElevenLabs',
    icon: '🎙️',
  },
  code: {
    id: 'code',
    name: 'Code with AI',
    provider: 'GitHub Copilot',
    icon: '👨‍💻',
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
  amsterdam: {
    direction: 'east',
    destinations: [
      { name: 'Germany', coords: { lat: 51.1657, lng: 10.4515 } },
      { name: 'North Sea', coords: { lat: 56.0, lng: 3.0 } }
    ],
    driftDistanceKm: 1200
  },
  
  finland: {
    direction: 'east',
    destinations: [
      { name: 'Russia', coords: { lat: 61.5240, lng: 105.3188 } },
      { name: 'Arctic', coords: { lat: 70.0, lng: 30.0 } }
    ],
    driftDistanceKm: 3200
  },
  
  singapore_dc: {
    direction: 'north',
    destinations: [
      { name: 'South China Sea', coords: { lat: 15.0, lng: 110.0 } },
      { name: 'Vietnam Coast', coords: { lat: 16.0544, lng: 108.2022 } }
    ],
    driftDistanceKm: 1800
  },
  
  riyadh_dc: {
    direction: 'east',
    destinations: [
      { name: 'Arabian Gulf', coords: { lat: 26.0, lng: 51.0 } },
      { name: 'Indian Ocean', coords: { lat: 18.0, lng: 60.0 } }
    ],
    driftDistanceKm: 2000
  },

  frankfurt: {
    direction: 'east-northeast',
    destinations: [
      { name: 'Poland', coords: { lat: 51.9194, lng: 19.1451 } },
      { name: 'Baltic States', coords: { lat: 56.8796, lng: 24.6032 } }
    ],
    driftDistanceKm: 1600
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

// ============================================
// INTERIOR SCALE DATA - Device-level energy
// ============================================

export const INTERIOR_SCALE = {
  laptop: {
    name: 'Laptop',
    idleWatts: 15,
    activeWatts: 45,
    networkWatts: 3, // Wi-Fi
    embodiedKgCO2: 350 // Lifecycle embodied carbon
  },
  phone: {
    name: 'Smartphone',
    idleWatts: 1,
    activeWatts: 5,
    networkWatts: 1.5, // Cellular
    embodiedKgCO2: 70
  }
};

// ============================================
// BUILDING SCALE DATA - Data center overhead
// ============================================

export const BUILDING_SCALE = {
  // Breakdown of PUE components (typical)
  pueBreakdown: {
    compute: 1.0,     // Base IT load
    cooling: 0.15,    // HVAC, chillers
    lighting: 0.02,   // Facility lighting
    ups: 0.06,        // UPS losses
    distribution: 0.02 // Power distribution
  },
  // GPU specs per workload type
  gpuPower: {
    A100: { tdpWatts: 400, name: 'NVIDIA A100' },
    T4: { tdpWatts: 70, name: 'NVIDIA T4' },
    H100: { tdpWatts: 700, name: 'NVIDIA H100' }
  }
};

// ============================================
// ENERGY REFERENCE DATA - Human-readable comparisons
// ============================================

export const ENERGY_REFERENCE = {
  // Average apartment electricity consumption per hour (kWh)
  // Source: IEA household consumption data (approximate)
  apartment: {
    barcelona: { kWhPerHour: 0.35, label: 'Barcelona apartment' },
    riyadh:    { kWhPerHour: 0.55, label: 'Riyadh apartment' },
    singapore: { kWhPerHour: 0.45, label: 'Singapore apartment' },
    lagos:     { kWhPerHour: 0.12, label: 'Lagos apartment' },
    chicago:   { kWhPerHour: 0.40, label: 'Chicago apartment' },
    saopaulo:  { kWhPerHour: 0.30, label: 'São Paulo apartment' },
    default:   { kWhPerHour: 0.35, label: 'typical apartment' }
  },
  // Reference building in each city centre (real coordinates with 3D buildings in Mapbox)
  referenceBuilding: {
    barcelona: { lat: 41.3870, lng: 2.1700, name: 'Eixample District' },
    riyadh:    { lat: 24.7136, lng: 46.6753, name: 'Al Olaya District' },
    singapore: { lat: 1.2830, lng: 103.8513, name: 'Marina Bay' },
    lagos:     { lat: 6.4541, lng: 3.4218, name: 'Victoria Island' },
    chicago:   { lat: 41.8827, lng: -87.6233, name: 'The Loop' },
    saopaulo:  { lat: -23.5614, lng: -46.6558, name: 'Paulista Avenue' },
  },
  // Average apartments per city block / neighborhood
  neighborhoodSize: {
    barcelona: 120,
    riyadh: 100,
    singapore: 150,
    lagos: 60,
    chicago: 100,
    saopaulo: 110,
    default: 80
  },
  // Everyday equivalences (energy in kWh for comparison)
  equivalences: [
    { label: 'LED bulb for 1 hour',       kWh: 0.010 },
    { label: 'smartphone full charge',     kWh: 0.012 },
    { label: 'laptop for 1 hour',          kWh: 0.050 },
    { label: 'electric kettle boil',       kWh: 0.100 },
    { label: 'washing machine cycle',      kWh: 1.000 },
    { label: 'EV driven 1 km',            kWh: 0.150 },
    { label: 'AC unit for 1 hour',        kWh: 1.500 },
    { label: 'hot shower (5 min)',         kWh: 2.500 }
  ]
};

export const NARRATIVES = {
  standard: (data) => `
    Your request traveled ${data.distanceKm.toLocaleString()} km to a server in ${data.datacenterLocation}. 
    The electricity came from a grid that is ${Math.round(data.fossilPercent)}% fossil-fueled. 
    ${data.waterLiters > 0 ? `${data.waterLiters.toFixed(1)} liters of water were used for cooling.` : 'Seawater cooling was used.'}
    ${data.co2Grams.toFixed(0)}g of CO₂ was released—it will drift ${data.emissionsDrift.direction} toward ${data.emissionsDrift.destinations[0].name}.
  `,
  
  waterStress: (data) => `
    The ${data.datacenterName} draws water from ${data.waterSource}, an aquifer that is already ${Math.round(data.aquiferDepletion * 100)}% depleted. 
    This single session withdrew ${data.waterLiters.toFixed(1)} liters. 
    By the time you finish reading this, the data center has used another ${(data.waterLitersPerSecond * 5).toFixed(0)} liters.
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
