/**
 * GHOST NETWORK - Simulation Engine
 * Calculates environmental externalities for AI workloads
 */

import { CITIES, DATACENTERS, WORKLOADS, MATERIALS, EWASTE, EMISSIONS_DRIFT, TIME_MODIFIERS, NARRATIVES, INTERIOR_SCALE, BUILDING_SCALE } from '../data/models.js';

export class SimulationEngine {
  constructor() {
    this.currentCity = null;
    this.currentWorkload = null;
    this.currentDatacenter = null;
    this.currentHour = 14;
  }

  /**
   * Set simulation parameters
   */
  configure({ city, workload, datacenter, hour }) {
    if (city) this.currentCity = CITIES[city];
    if (workload) this.currentWorkload = WORKLOADS[workload];
    if (datacenter) this.currentDatacenter = DATACENTERS[datacenter];
    if (hour !== undefined) this.currentHour = hour;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(coord1, coord2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(coord2.lat - coord1.lat);
    const dLng = this.toRad(coord2.lng - coord1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(coord1.lat)) * Math.cos(this.toRad(coord2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(deg) {
    return deg * (Math.PI / 180);
  }

  /**
   * Calculate electricity consumption
   */
  calculateElectricity() {
    if (!this.currentWorkload || !this.currentDatacenter) return null;

    const workload = this.currentWorkload;
    const dc = this.currentDatacenter;
    const hourModifier = TIME_MODIFIERS.demandByHour[this.currentHour];

    let baseKwh = 0;

    switch (workload.id) {
      case 'chatbot':
        baseKwh = workload.perSession.queries * workload.perSession.kwhPerQuery;
        break;
      case 'image':
        baseKwh = workload.perSession.images * workload.perSession.kwhPerImage;
        break;
      case 'traffic':
        baseKwh = workload.perSession.kwhPerHour;
        break;
      case 'biometric':
        baseKwh = workload.perSession.kwhPerHour;
        break;
    }

    // Apply PUE (Power Usage Effectiveness) - includes cooling overhead
    const withPue = baseKwh * dc.energy.pue;
    
    // Apply heat penalty (more energy needed in hot climates)
    const withHeat = withPue * dc.climate.heatPenalty;
    
    // Apply time-of-day modifier
    const final = withHeat * hourModifier;

    return {
      baseKwh,
      withOverhead: final,
      pue: dc.energy.pue,
      heatPenalty: dc.climate.heatPenalty,
      gridMix: dc.energy.gridMix,
      fossilPercent: this.calculateFossilPercent(dc.energy.gridMix),
      sources: dc.energy.sources
    };
  }

  /**
   * Calculate fossil fuel percentage of grid
   */
  calculateFossilPercent(gridMix) {
    const fossilSources = ['natural_gas', 'coal', 'peat', 'oil'];
    let fossilTotal = 0;
    
    for (const source of fossilSources) {
      if (gridMix[source]) {
        fossilTotal += gridMix[source];
      }
    }
    
    return fossilTotal * 100;
  }

  /**
   * Calculate water consumption
   */
  calculateWater() {
    if (!this.currentDatacenter || !this.currentWorkload) return null;

    const dc = this.currentDatacenter;
    const electricity = this.calculateElectricity();
    
    if (!electricity) return null;
    
    const hourModifier = TIME_MODIFIERS.waterUsageByHour[this.currentHour];

    // Water usage = kWh * WUE * time modifier
    const baseLiters = electricity.withOverhead * dc.water.wue;
    const withTimeModifier = baseLiters * hourModifier;

    return {
      liters: withTimeModifier,
      wue: dc.water.wue,
      source: dc.water.source,
      sourceCoords: dc.water.sourceCoords,
      stressLevel: dc.water.stressLevel,
      aquiferDepletion: dc.water.aquiferDepletion,
      hourModifier,
      litersPerSecond: dc.water.annualWithdrawal / (365 * 24 * 3600)
    };
  }

  /**
   * Calculate CO2 emissions
   */
  calculateEmissions() {
    if (!this.currentDatacenter) return null;

    const dc = this.currentDatacenter;
    const electricity = this.calculateElectricity();
    const hourModifier = TIME_MODIFIERS.carbonIntensityByHour[this.currentHour];

    // Base carbon intensity adjusted for time of day
    const adjustedIntensity = dc.energy.carbonIntensity * hourModifier;
    
    // gCO2 = kWh * gCO2/kWh
    const grams = electricity.withOverhead * adjustedIntensity;
    
    // Annual estimate (extrapolate from session)
    const sessionsPerYear = 365 * 24 * 4; // Rough estimate
    const annualTons = (grams * sessionsPerYear) / 1000000;

    return {
      grams,
      carbonIntensity: adjustedIntensity,
      baseCarbonIntensity: dc.energy.carbonIntensity,
      drift: EMISSIONS_DRIFT[dc.id],
      annualTonsCO2: annualTons
    };
  }

  /**
   * Get materials supply chain data
   */
  getMaterials() {
    // Return subset of materials relevant to the workload
    const gpuMaterials = ['cobalt', 'lithium', 'rareEarth', 'silicon'];
    const relevantMaterials = {};
    
    for (const key of gpuMaterials) {
      relevantMaterials[key] = MATERIALS[key];
    }

    return {
      materials: relevantMaterials,
      ewasteDestinations: Object.values(EWASTE)
    };
  }

  /**
   * Run full simulation and return all results
   */
  runSimulation() {
    if (!this.currentCity || !this.currentWorkload || !this.currentDatacenter) {
      throw new Error('Simulation not fully configured');
    }

    const distance = this.calculateDistance(
      this.currentCity.coords,
      this.currentDatacenter.coords
    );

    const electricity = this.calculateElectricity();
    const water = this.calculateWater();
    const emissions = this.calculateEmissions();
    const materials = this.getMaterials();

    // Generate narrative
    const narrativeData = {
      distanceKm: Math.round(distance),
      datacenterName: this.currentDatacenter.name,
      datacenterLocation: this.currentDatacenter.location,
      fossilPercent: electricity.fossilPercent,
      waterLiters: water.liters,
      waterSource: water.source,
      aquiferDepletion: water.aquiferDepletion,
      waterLitersPerSecond: water.litersPerSecond,
      co2Grams: emissions.grams,
      emissionsDrift: emissions.drift,
      annualTonsCO2: emissions.annualTonsCO2,
      ewasteDestination: materials.ewasteDestinations[0].name
    };

    const narrative = NARRATIVES.standard(narrativeData);

    // Calculate multi-scale breakdown
    const scaleBreakdown = this.calculateScaleBreakdown(electricity, water, emissions, materials, distance);

    return {
      city: this.currentCity,
      workload: this.currentWorkload,
      datacenter: this.currentDatacenter,
      hour: this.currentHour,
      distance,
      electricity,
      water,
      emissions,
      materials,
      narrative,
      narrativeData,
      scaleBreakdown,

      // Flow paths for visualization
      flows: this.generateFlows(electricity, water, emissions, materials)
    };
  }

  /**
   * Generate flow data for ghost line visualization
   */
  generateFlows(electricity, water, emissions, materials) {
    const flows = [];
    const dc = this.currentDatacenter;
    const city = this.currentCity;

    // City to datacenter (data flow)
    flows.push({
      type: 'data',
      from: city.coords,
      to: dc.coords,
      label: 'Request',
      intensity: 1
    });

    // Electricity sources to datacenter
    for (const source of electricity.sources) {
      flows.push({
        type: 'electricity',
        from: source.coords,
        to: dc.coords,
        label: source.name,
        sourceType: source.type,
        intensity: dc.energy.gridMix[source.type] || 0.1
      });
    }

    // Water source to datacenter
    if (water.liters > 0) {
      flows.push({
        type: 'water',
        from: water.sourceCoords,
        to: dc.coords,
        label: water.source,
        intensity: Math.min(water.liters / 10, 1),
        stressLevel: water.stressLevel
      });
    }

    // Emissions drift
    if (emissions.drift) {
      for (const dest of emissions.drift.destinations) {
        flows.push({
          type: 'emissions',
          from: dc.coords,
          to: dest.coords,
          label: `CO₂ drift to ${dest.name}`,
          intensity: Math.min(emissions.grams / 500, 1)
        });
      }
    }

    // Materials supply chains
    for (const [key, material] of Object.entries(materials.materials)) {
      flows.push({
        type: 'materials',
        subtype: 'supply',
        from: material.sourceCoords,
        to: dc.coords,
        label: material.name,
        intensity: 0.5
      });
    }

    // E-waste flows
    for (const dest of materials.ewasteDestinations.slice(0, 2)) {
      flows.push({
        type: 'materials',
        subtype: 'ewaste',
        from: dc.coords,
        to: dest.coords,
        label: `E-waste to ${dest.name}`,
        intensity: 0.3
      });
    }

    return flows;
  }

  /**
   * Calculate a per-scale breakdown of energy impact
   */
  calculateScaleBreakdown(electricity, water, emissions, materials, distance) {
    const dc = this.currentDatacenter;
    const workload = this.currentWorkload;
    const device = INTERIOR_SCALE.laptop;

    // --- Interior Scale ---
    const sessionMinutes = workload.perSession.durationMinutes;
    const deviceKwh = (device.activeWatts * sessionMinutes) / 60 / 1000;
    const networkKwh = (device.networkWatts * sessionMinutes) / 60 / 1000;
    const serverKwh = electricity.baseKwh;

    const gpuType = workload.scaling.gpuType;
    const gpuSpec = BUILDING_SCALE.gpuPower[gpuType] || BUILDING_SCALE.gpuPower['A100'];

    // --- Building Scale ---
    const computeKwh = electricity.baseKwh;
    const pue = electricity.pue;
    const coolingOverheadKwh = electricity.withOverhead - electricity.baseKwh;
    const coolingPercent = pue > 1 ? ((pue - 1) / pue) * 100 : 0;
    const heatPenalty = dc.climate.heatPenalty;
    const coolingWaterLiters = water ? water.liters : 0;

    // --- City Scale ---
    const gridCarbonIntensity = dc.energy.carbonIntensity;
    const fossilPercent = electricity.fossilPercent;
    const waterSource = water ? water.source.split('/')[0].trim() : 'N/A';
    const aquiferDepletion = dc.water.aquiferDepletion;
    const waterStressLevel = dc.water.stressLevel;
    const localAirImpact = fossilPercent > 50 ? 'Significant' : fossilPercent > 25 ? 'Moderate' : 'Low';

    // --- Planetary Scale ---
    const displacementKm = Math.round(distance);
    const emissionsDrift = emissions.drift;
    const driftDirection = emissionsDrift ? emissionsDrift.direction : 'N/A';
    const driftDestinations = emissionsDrift ? emissionsDrift.destinations.map(d => d.name) : [];
    
    const materialSources = Object.values(materials.materials).map(m => m.source.split('(')[0].trim().split('/')[0].trim());
    const uniqueMaterialSources = [...new Set(materialSources)];
    
    const ewasteDestinations = materials.ewasteDestinations.map(d => d.name.split(',')[0]);
    
    // Count jurisdictions: city country + datacenter country + material source countries + ewaste countries
    const jurisdictionSet = new Set();
    jurisdictionSet.add(this.currentCity.country);
    jurisdictionSet.add(dc.location.split(',').pop().trim());
    uniqueMaterialSources.forEach(s => jurisdictionSet.add(s));
    ewasteDestinations.forEach(d => jurisdictionSet.add(d));
    const jurisdictions = jurisdictionSet.size;

    return {
      interior: {
        deviceWh: deviceKwh * 1000,
        serverWh: serverKwh * 1000,
        networkWh: networkKwh * 1000,
        laptopWatts: device.activeWatts,
        networkWatts: device.networkWatts,
        sessionMinutes,
        gpuDemand: `${gpuSpec.name} x${workload.scaling.gpusPerQuery || workload.scaling.gpusPerImage || workload.scaling.gpusPerHour}`
      },
      building: {
        computeWh: computeKwh * 1000,
        coolingWh: coolingOverheadKwh * 1000,
        pue,
        coolingPercent: coolingPercent.toFixed(0),
        heatPenalty: `${((heatPenalty - 1) * 100).toFixed(0)}%`,
        coolingWaterLiters: coolingWaterLiters.toFixed(1)
      },
      city: {
        gridCarbonIntensity,
        fossilPercent: Math.round(fossilPercent),
        waterSource,
        aquiferDepletion: `${Math.round(aquiferDepletion * 100)}%`,
        waterStressLevel,
        localAirImpact
      },
      planetary: {
        displacementKm,
        co2DriftDirection: driftDirection,
        driftDestinations,
        materialSources: uniqueMaterialSources.slice(0, 3).join(', '),
        ewasteDestination: ewasteDestinations[0] || 'N/A',
        emissionsDriftKm: emissionsDrift ? emissionsDrift.driftDistanceKm : 0,
        jurisdictions
      }
    };
  }

  /**
   * Compare two datacenter options
   */
  compareDatacenters(dc1Id, dc2Id) {
    const original = this.currentDatacenter;
    
    this.currentDatacenter = DATACENTERS[dc1Id];
    const results1 = this.runSimulation();
    
    this.currentDatacenter = DATACENTERS[dc2Id];
    const results2 = this.runSimulation();
    
    // Restore original
    this.currentDatacenter = original;

    return {
      dc1: results1,
      dc2: results2,
      comparison: {
        waterDifference: ((results1.water.liters - results2.water.liters) / results2.water.liters) * 100,
        emissionsDifference: ((results1.emissions.grams - results2.emissions.grams) / results2.emissions.grams) * 100,
        electricityDifference: ((results1.electricity.withOverhead - results2.electricity.withOverhead) / results2.electricity.withOverhead) * 100
      }
    };
  }
}

// Singleton instance
export const simulationEngine = new SimulationEngine();
