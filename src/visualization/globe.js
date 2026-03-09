/**
 * GHOST NETWORK - Globe Visualization
 * Mapbox GL JS 3D globe with animated flow arcs and particles
 */

import mapboxgl from 'mapbox-gl';
import { gsap } from 'gsap';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

// Color palette matching the app theme
const COLORS = {
  electricity: '#f0b429',
  water: '#58a6ff',
  emissions: '#f85149',
  materials: '#a371f7',
  data: '#58a6ff',
  city: '#00ff88',
  datacenter: '#ff6b6b'
};

export class GlobeVisualization {
  constructor(container) {
    this.container = container;
    this.map = null;
    this.flowSourceIds = [];
    this.flowLayerIds = [];
    this.animationFrameId = null;
    this.particleSources = [];
    this.particleLayers = [];

    // Layer visibility
    this.layerVisibility = {
      electricity: true,
      water: true,
      emissions: true,
      materials: true
    };

    // Selected state
    this.selectedCity = null;
    this.selectedDatacenter = null;

    // Popup callback
    this.onLocationClick = null;

    // City/DC marker references
    this.cityMarkers = {};
    this.datacenterMarkers = {};
    
    // Flow endpoint markers (power plants, water sources, etc.)
    this.flowEndpointMarkers = [];

    this.init();
  }

  init() {
    // Check WebGL support
    if (!mapboxgl.supported()) {
      const msg = 'WebGL is not supported or disabled in your browser. Please enable hardware acceleration in browser settings.';
      console.error(msg);
      this.container.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:100%;background:#0d1117;color:#f0f6fc;text-align:center;padding:40px;font-family:system-ui,sans-serif;">
          <div>
            <h2 style="color:#ff6b6b;margin-bottom:16px;">⚠️ WebGL Not Available</h2>
            <p style="max-width:400px;line-height:1.6;color:#8b949e;">
              This visualization requires WebGL. Please:
              <br><br>
              1. Enable <strong>hardware acceleration</strong> in your browser settings<br>
              2. Update your graphics drivers<br>
              3. Try a different browser (Chrome/Firefox/Edge)
            </p>
          </div>
        </div>
      `;
      throw new Error(msg);
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    this.map = new mapboxgl.Map({
      container: this.container,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [15, 30],
      zoom: 1.5,
      projection: 'globe',
      antialias: true,
      fadeDuration: 0
    });

    // Globe atmosphere
    this.map.on('style.load', () => {
      this.map.setFog({
        color: 'rgb(13, 17, 23)',
        'high-color': 'rgb(22, 27, 34)',
        'horizon-blend': 0.04,
        'space-color': 'rgb(13, 17, 23)',
        'star-intensity': 0.6
      });
    });

    // Enable rotation
    this.map.dragRotate.enable();
    this.map.touchZoomRotate.enableRotation();
  }

  // =============================================
  // Public API (same interface as old Three.js globe)
  // =============================================

  /** Register callback for clicks on city / datacenter markers */
  setLocationClickCallback(callback) {
    this.onLocationClick = callback;
  }

  /** Create initial markers for all cities and datacenters */
  createAllLocationMarkers() {
    const cities = this._getCityData();
    const dcs = this._getDatacenterData();

    Object.entries(cities).forEach(([id, c]) => this._createCityMarker(id, c));
    Object.entries(dcs).forEach(([id, dc]) => this._createDatacenterMarker(id, dc));
  }

  /** Fly to a location */
  focusOnLocation(coords) {
    this.map.flyTo({
      center: [coords.lng, coords.lat],
      duration: 1500,
      essential: true
    });
  }

  /** Fly to location with zoom (maps old Three.js camera z to Mapbox zoom) */
  focusOnLocationWithZoom(coords, cameraZ = 3, duration = 1.5) {
    const zoom = this._cameraZToZoom(cameraZ);
    this.map.flyTo({
      center: [coords.lng, coords.lat],
      zoom,
      duration: duration * 1000,
      essential: true
    });
  }

  /** Highlight city marker */
  highlightCity(cityId) {
    if (this.selectedCity && this.selectedCity !== cityId) {
      this._setCityState(this.selectedCity, false);
    }
    this.selectedCity = cityId;
    this._setCityState(cityId, true);
  }

  /** Highlight datacenter marker */
  highlightDatacenter(dcId) {
    if (this.selectedDatacenter && this.selectedDatacenter !== dcId) {
      this._setDCState(this.selectedDatacenter, false);
    }
    this.selectedDatacenter = dcId;
    this._setDCState(dcId, true);
  }

  /** Focus on datacenter and highlight it */
  focusOnDatacenter(dcId) {
    const dc = this._getDatacenterData()[dcId];
    if (dc) {
      this.focusOnLocation(dc.center);
      this.highlightDatacenter(dcId);
    }
  }

  /** Toggle single layer visibility */
  setLayerVisibility(layer, visible) {
    this.layerVisibility[layer] = visible;
    this._syncLayerVisibility();
  }

  /** Set all layers visible/hidden */
  setAllLayersVisibility(visible) {
    ['electricity', 'water', 'emissions', 'materials'].forEach(l => {
      this.layerVisibility[l] = visible;
    });
    this._syncLayerVisibility();
  }

  // =============================================
  // Energy Consumption – scale-aware 3D buildings
  // =============================================

  /**
   * Show 3D building extrusions for a specific consumption scale.
   *
   * Strategy:
   *   1. flyTo the reference building at scale-specific zoom/pitch.
   *   2. Once idle add a dark fill-extrusion base layer (all buildings dark).
   *   3. Poll queryRenderedFeatures (ALL layers, filtered to sourceLayer
   *      'building') until buildings appear. This avoids timing issues with
   *      our custom layer's tiles and also avoids Mapbox filter expressions
   *      (distance / within) that don't work reliably on fill-extrusion.
   *   4. Pick the closest building(s) by screen distance, create a GeoJSON
   *      source containing only those features, and render the lit layer
   *      from that source. This sidesteps feature-ID availability issues.
   *
   * Interior → one flat (top 3 m of closest building)
   * Building → one full building (fully coloured)
   * City     → neighbourhood (ratio-based colouring)
   * Planetary → globe view, no extrusions
   */
  showBuildingEnergy(scale, refCoords, energyRatio) {
    this.hideBuildingEnergy();

    const lng = refCoords.lng;
    const lat = refCoords.lat;
    const ref = [lng, lat];
    const clamp = Math.max(0, Math.min(1, energyRatio));
    const powered   = COLORS.electricity; // #f0b429
    const unpowered = '#1a1e26';

    this._energyRef = ref;
    this._energyScale = scale;

    // Camera per scale
    const cameras = {
      interior:  { zoom: 18.8, pitch: 62, bearing: 25,  duration: 2000 },
      building:  { zoom: 17.2, pitch: 60, bearing: -12, duration: 1800 },
      city:      { zoom: 15.0, pitch: 50, bearing: -17, duration: 2000 },
      planetary: { zoom: 1.8,  pitch: 0,  bearing: 0,   duration: 2400 }
    };
    const cam = cameras[scale] || cameras.city;

    this.map.flyTo({
      center: ref,
      zoom: cam.zoom,
      pitch: cam.pitch,
      bearing: cam.bearing,
      duration: cam.duration,
      essential: true
    });

    if (scale === 'planetary') return;

    // Shared height expressions (reads properties from GeoJSON source)
    const heightExpr = ['coalesce', ['to-number', ['get', 'height']], 5];
    const minHeightExpr = ['coalesce', ['to-number', ['get', 'min_height']], 0];

    // After flyTo + tile load, add the dark layer and start polling
    this.map.once('idle', () => {
      if (this._energyScale !== scale) return;

      // Dark base layer — all buildings rendered dark
      if (!this.map.getLayer('energy-buildings-dark')) {
        this.map.addLayer({
          id: 'energy-buildings-dark',
          source: 'composite',
          'source-layer': 'building',
          type: 'fill-extrusion',
          minzoom: 13,
          paint: {
            'fill-extrusion-color': unpowered,
            'fill-extrusion-height': heightExpr,
            'fill-extrusion-base': minHeightExpr,
            'fill-extrusion-opacity': 0.75
          }
        });
      }

      // Begin polling for rendered buildings
      this._pollForBuildings(scale, ref, clamp, powered, heightExpr, minHeightExpr, 0);
    });
  }

  /**
   * Poll queryRenderedFeatures until building features appear, then create
   * a GeoJSON lit layer with the target buildings.
   */
  _pollForBuildings(scale, ref, clamp, powered, heightExpr, minHeightExpr, attempt) {
    if (this._energyScale !== scale) return;          // stale
    if (this.map.getLayer('energy-buildings-lit')) return; // already done

    const MAX_ATTEMPTS = 25;
    const RETRY_MS = 250;

    const center = this.map.project(ref);
    // Generous pixel radii to account for varying building sizes
    const pxRadius = scale === 'interior' ? 200
                   : scale === 'building' ? 200
                   : 400;

    const bbox = [
      [center.x - pxRadius, center.y - pxRadius],
      [center.x + pxRadius, center.y + pxRadius]
    ];

    // Query ALL rendered layers — includes the base style's 'building' fill
    // layer which is available even before our custom fill-extrusion renders
    const allFeatures = this.map.queryRenderedFeatures(bbox);
    const features = allFeatures.filter(f => f.sourceLayer === 'building');

    if (features.length === 0) {
      if (attempt < MAX_ATTEMPTS) {
        setTimeout(() => this._pollForBuildings(
          scale, ref, clamp, powered, heightExpr, minHeightExpr, attempt + 1
        ), RETRY_MS);
      } else {
        console.warn('[GlobeViz] No buildings found after', MAX_ATTEMPTS, 'attempts near', ref);
      }
      return;
    }

    console.log(`[GlobeViz] Found ${features.length} building features (attempt ${attempt})`);

    // Deduplicate by geometry hash (feature IDs may be undefined)
    const seen = new Map();
    for (const f of features) {
      const key = f.id != null
        ? `id:${f.id}`
        : JSON.stringify(f.geometry.coordinates[0]?.slice(0, 3));
      if (seen.has(key)) continue;

      const centroid = this._featureCentroid(f.geometry);
      const fp = this.map.project(centroid);
      const dist = Math.hypot(fp.x - center.x, fp.y - center.y);
      seen.set(key, { feature: f, dist });
    }

    const buildings = Array.from(seen.values()).sort((a, b) => a.dist - b.dist);

    if (buildings.length === 0) {
      if (attempt < MAX_ATTEMPTS) {
        setTimeout(() => this._pollForBuildings(
          scale, ref, clamp, powered, heightExpr, minHeightExpr, attempt + 1
        ), RETRY_MS);
      }
      return;
    }

    // Pick target buildings
    let targets;
    if (scale === 'interior' || scale === 'building') {
      targets = [buildings[0]];
    } else {
      const numLit = Math.max(1, Math.round(buildings.length * clamp));
      targets = buildings.slice(0, numLit);
    }

    // Build clean GeoJSON features (only geometry + properties)
    const litFeatures = targets.map(b => ({
      type: 'Feature',
      geometry: b.feature.geometry,
      properties: b.feature.properties || {}
    }));

    // Create a GeoJSON source containing only the target buildings
    if (this.map.getSource('energy-lit-source')) {
      this.map.getSource('energy-lit-source').setData({
        type: 'FeatureCollection', features: litFeatures
      });
    } else {
      this.map.addSource('energy-lit-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: litFeatures }
      });
    }

    // Lit layer paint
    const opacity = scale === 'interior' ? 0.95 : scale === 'building' ? 0.92 : 0.88;

    if (scale === 'interior') {
      // One flat — only the top 3 m of the closest building
      this.map.addLayer({
        id: 'energy-buildings-lit',
        source: 'energy-lit-source',
        type: 'fill-extrusion',
        paint: {
          'fill-extrusion-color': powered,
          'fill-extrusion-height': heightExpr,
          'fill-extrusion-base': ['-', heightExpr, 3],
          'fill-extrusion-opacity': opacity
        }
      });
    } else {
      // Building or City — full-height colouring
      this.map.addLayer({
        id: 'energy-buildings-lit',
        source: 'energy-lit-source',
        type: 'fill-extrusion',
        paint: {
          'fill-extrusion-color': powered,
          'fill-extrusion-height': heightExpr,
          'fill-extrusion-base': minHeightExpr,
          'fill-extrusion-opacity': opacity
        }
      });
    }
  }

  /** Approximate centroid of a GeoJSON geometry */
  _featureCentroid(geometry) {
    if (!geometry) return [0, 0];
    const ring = geometry.type === 'Polygon'
      ? geometry.coordinates[0]
      : geometry.type === 'MultiPolygon'
        ? geometry.coordinates[0][0]
        : null;
    if (!ring || ring.length === 0) return [0, 0];
    let lngSum = 0, latSum = 0;
    for (const [x, y] of ring) { lngSum += x; latSum += y; }
    return [lngSum / ring.length, latSum / ring.length];
  }

  /** Remove all energy building layers and GeoJSON source */
  hideBuildingEnergy() {
    this._energyScale = null;
    ['energy-buildings-lit', 'energy-buildings-dark', 'energy-buildings'].forEach(id => {
      if (this.map && this.map.getLayer(id)) this.map.removeLayer(id);
    });
    if (this.map && this.map.getSource('energy-lit-source')) {
      this.map.removeSource('energy-lit-source');
    }
  }

  /** Render simulation flow arcs on the globe */
  visualizeFlows(flows) {
    this.clearFlows();

    // Validate flows (log only errors)
    flows.forEach((flow, i) => {
      const fromValid = flow.from && typeof flow.from.lat === 'number' && typeof flow.from.lng === 'number';
      const toValid = flow.to && typeof flow.to.lat === 'number' && typeof flow.to.lng === 'number';
      if (!fromValid || !toValid) {
        console.error(`Flow ${i} [${flow.type}] invalid coords:`, flow);
      }
    });

    // Create small endpoint markers for flow sources/destinations
    this._createFlowEndpointMarkers(flows);

    // Wait for map to be loaded before adding sources/layers
    if (!this.map.isStyleLoaded()) {
      this.map.once('styledata', () => {
        this._renderFlows(flows);
        this._startParticles(flows);
      });
    } else {
      this._renderFlows(flows);
      this._startParticles(flows);
    }
  }

  /** Create small markers at flow endpoints (power plants, mines, etc.) */
  _createFlowEndpointMarkers(flows) {
    // Collect unique coordinates that aren't city/datacenter locations
    const cityCoords = Object.values(this._getCityData()).map(c => `${c.center.lat},${c.center.lng}`);
    const dcCoords = Object.values(this._getDatacenterData()).map(dc => `${dc.center.lat},${dc.center.lng}`);
    const knownLocations = new Set([...cityCoords, ...dcCoords]);

    const endpoints = new Map(); // key -> { coords, type, label }

    flows.forEach(flow => {
      if (!flow.from || !flow.to) return;

      // Check 'from' coordinate
      const fromKey = `${flow.from.lat},${flow.from.lng}`;
      if (!knownLocations.has(fromKey) && !endpoints.has(fromKey)) {
        endpoints.set(fromKey, {
          coords: flow.from,
          type: flow.type,
          label: flow.label || flow.type
        });
      }

      // Check 'to' coordinate
      const toKey = `${flow.to.lat},${flow.to.lng}`;
      if (!knownLocations.has(toKey) && !endpoints.has(toKey)) {
        endpoints.set(toKey, {
          coords: flow.to,
          type: flow.type,
          label: flow.label || flow.type
        });
      }
    });

    // Create small markers for each endpoint
    endpoints.forEach(({ coords, type, label }) => {
      const el = document.createElement('div');
      el.className = `flow-endpoint-marker flow-endpoint-${type}`;
      el.innerHTML = `<div class="flow-endpoint-dot"></div>`;
      el.title = label;

      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([coords.lng, coords.lat])
        .addTo(this.map);

      this.flowEndpointMarkers.push(marker);
    });
  }

  /** Remove all flows */
  clearFlows() {
    this._stopParticles();

    // Remove particle layers and sources
    this.particleLayers.forEach(id => {
      if (this.map.getLayer(id)) this.map.removeLayer(id);
    });
    this.particleSources.forEach(({ srcId }) => {
      if (this.map.getSource(srcId)) this.map.removeSource(srcId);
    });
    this.particleLayers = [];
    this.particleSources = [];

    // Remove flow layers and sources
    this.flowLayerIds.forEach(id => {
      if (this.map.getLayer(id)) this.map.removeLayer(id);
    });
    // Deduplicate source ids before removing
    const uniqueSources = [...new Set(this.flowSourceIds)];
    uniqueSources.forEach(id => {
      if (this.map.getSource(id)) this.map.removeSource(id);
    });
    this.flowLayerIds = [];
    this.flowSourceIds = [];

    // Remove flow endpoint markers
    this.flowEndpointMarkers.forEach(m => m.remove());
    this.flowEndpointMarkers = [];
  }

  /** Cleanup */
  dispose() {
    this.clearFlows();
    this.hideBuildingEnergy();
    Object.values(this.cityMarkers).forEach(({ marker }) => marker.remove());
    Object.values(this.datacenterMarkers).forEach(({ marker }) => marker.remove());
    if (this.map) { this.map.remove(); this.map = null; }
  }

  // =============================================
  // Internals
  // =============================================

  // --- Data ---

  _getCityData() {
    return {
      barcelona: { center: { lat: 41.3851, lng: 2.1734 }, name: 'Barcelona' },
      lagos:     { center: { lat: 6.5244,  lng: 3.3792 }, name: 'Lagos' },
      phoenix:   { center: { lat: 33.4484, lng: -112.074 }, name: 'Phoenix' },
      dublin:    { center: { lat: 53.3498, lng: -6.2603 }, name: 'Dublin' }
    };
  }

  _getDatacenterData() {
    return {
      arizona:   { center: { lat: 33.3942, lng: -111.9261 }, name: 'Arizona Hyperscale', color: '#ff4444' },
      finland:   { center: { lat: 60.5693, lng: 27.1878 },   name: 'Nordic Green DC',   color: '#44ff88' },
      singapore: { center: { lat: 1.3521,  lng: 103.8198 },  name: 'Equinix SG Hub',    color: '#ff8844' },
      ireland:   { center: { lat: 53.4055, lng: -6.3725 },   name: 'Dublin Cloud Campus', color: '#4488ff' }
    };
  }

  // --- Zoom mapping ---

  _cameraZToZoom(z) {
    // Three.js z 1.5–5 → Mapbox zoom ~6 down to ~1
    const zoom = 9.5 - z * 2.1;
    return Math.max(0.5, Math.min(8, zoom));
  }

  // --- City markers ---

  _createCityMarker(id, city) {
    const el = document.createElement('div');
    el.className = 'mapbox-city-marker';
    el.innerHTML = `
      <div class="marker-inner">
        <div class="marker-pulse city-pulse"></div>
        <div class="marker-dot city-dot"></div>
        <span class="marker-label">${city.name}</span>
      </div>
    `;

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.onLocationClick) this.onLocationClick('city', id, e.clientX, e.clientY);
    });

    const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
      .setLngLat([city.center.lng, city.center.lat])
      .addTo(this.map);

    this.cityMarkers[id] = { marker, el };
  }

  _createDatacenterMarker(id, dc) {
    const el = document.createElement('div');
    el.className = 'mapbox-dc-marker';
    el.innerHTML = `
      <div class="marker-inner">
        <div class="marker-pulse dc-pulse" style="border-color:${dc.color}; box-shadow: 0 0 12px ${dc.color}40"></div>
        <div class="marker-diamond" style="background:${dc.color}"></div>
        <span class="marker-label">${dc.name}</span>
      </div>
    `;

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.onLocationClick) this.onLocationClick('datacenter', id, e.clientX, e.clientY);
    });

    const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
      .setLngLat([dc.center.lng, dc.center.lat])
      .addTo(this.map);

    this.datacenterMarkers[id] = { marker, el };
  }

  _setCityState(id, active) {
    const entry = this.cityMarkers[id];
    if (!entry) return;
    entry.el.classList.toggle('active', active);
  }

  _setDCState(id, active) {
    const entry = this.datacenterMarkers[id];
    if (!entry) return;
    entry.el.classList.toggle('active', active);
  }

  // --- Great-circle arc ---

  /**
   * Generate a great-circle arc between two {lat, lng} points.
   * Uses proper spherical interpolation (slerp) so the line follows
   * the Earth's curvature and endpoints sit exactly on the surface.
   */
  _greatCircleArc(from, to, steps = 80) {
    const toRad = d => d * Math.PI / 180;
    const toDeg = r => r * 180 / Math.PI;

    const lat1 = toRad(from.lat), lng1 = toRad(from.lng);
    const lat2 = toRad(to.lat),   lng2 = toRad(to.lng);

    // Central angle (haversine)
    const dLat = lat2 - lat1;
    const dLng = lng2 - lng1;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    const centralAngle = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // Peak altitude — proportional to distance, but reasonable for short and long arcs
    const distKm = centralAngle * 6371;
    // For very short distances (<500km), use lower altitude to avoid weird looking arcs
    const peakAlt = distKm < 500 
      ? Math.max(distKm * 20, 5000)  // 5-10km for short arcs
      : Math.min(Math.max(distKm * 40, 20000), 300000);  // 20-300km for long arcs

    const coords = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;

      // Spherical interpolation (ensures endpoints land exactly on surface)
      if (centralAngle < 0.0001) {
        // Near-zero distance — linear fallback
        coords.push([
          from.lng + (to.lng - from.lng) * t,
          from.lat + (to.lat - from.lat) * t,
          0
        ]);
        continue;
      }
      const A = Math.sin((1 - t) * centralAngle) / Math.sin(centralAngle);
      const B = Math.sin(t * centralAngle)       / Math.sin(centralAngle);

      const x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2);
      const y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2);
      const z = A * Math.sin(lat1)                   + B * Math.sin(lat2);

      const lat = toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)));
      const lng = toDeg(Math.atan2(y, x));

      // Parabolic altitude — 0 at endpoints, peak at midpoint
      const alt = peakAlt * 4 * t * (1 - t);
      coords.push([lng, lat, alt]);
    }
    return coords;
  }

  // --- Flow arcs ---

  _renderFlows(flows) {
    const byType = {};

    flows.forEach(flow => {
      // Validate coordinates
      const fromValid = flow.from && typeof flow.from.lat === 'number' && typeof flow.from.lng === 'number';
      const toValid = flow.to && typeof flow.to.lat === 'number' && typeof flow.to.lng === 'number';
      if (!fromValid || !toValid) {
        console.error('Skipping flow with invalid coords:', flow);
        return;
      }

      const type = flow.type === 'data' ? 'data' : flow.type;
      if (!byType[type]) byType[type] = [];
      const arc = this._greatCircleArc(flow.from, flow.to);
      byType[type].push({
        type: 'Feature',
        properties: { type, intensity: flow.intensity || 0.5, label: flow.label || '' },
        geometry: { type: 'LineString', coordinates: arc }
      });
    });

    Object.entries(byType).forEach(([type, features]) => {
      const srcId = `flow-src-${type}`;
      const lineId = `flow-line-${type}`;
      const glowId = `flow-glow-${type}`;
      const color = COLORS[type] || COLORS.data;
      const vis = (type === 'data' || this.layerVisibility[type]) ? 'visible' : 'none';

      // Source
      if (this.map.getSource(srcId)) {
        this.map.getSource(srcId).setData({ type: 'FeatureCollection', features });
      } else {
        this.map.addSource(srcId, {
          type: 'geojson',
          data: { type: 'FeatureCollection', features }
        });
        this.flowSourceIds.push(srcId);
      }

      // Glow layer
      if (!this.map.getLayer(glowId)) {
        this.map.addLayer({
          id: glowId, type: 'line', source: srcId,
          layout: { visibility: vis },
          paint: { 'line-color': color, 'line-width': 6, 'line-opacity': 0.15, 'line-blur': 6 }
        });
        this.flowLayerIds.push(glowId);
      }

      // Core line
      if (!this.map.getLayer(lineId)) {
        this.map.addLayer({
          id: lineId, type: 'line', source: srcId,
          layout: { visibility: vis },
          paint: { 'line-color': color, 'line-width': 2, 'line-opacity': 0.8, 'line-dasharray': [2, 1.5] }
        });
        this.flowLayerIds.push(lineId);
      }
    });
  }

  // --- Particles ---

  _startParticles(flows) {
    this._stopParticles();

    const byType = {};
    flows.forEach(flow => {
      // Validate coordinates
      const fromValid = flow.from && typeof flow.from.lat === 'number' && typeof flow.from.lng === 'number';
      const toValid = flow.to && typeof flow.to.lat === 'number' && typeof flow.to.lng === 'number';
      if (!fromValid || !toValid) return;

      const type = flow.type === 'data' ? 'data' : flow.type;
      if (!byType[type]) byType[type] = [];
      const arc = this._greatCircleArc(flow.from, flow.to);
      const count = Math.max(3, Math.min(8, Math.round((flow.intensity || 0.5) * 8)));
      for (let i = 0; i < count; i++) {
        byType[type].push({ arc, offset: i / count, speed: 0.003 + Math.random() * 0.003 });
      }
    });

    Object.entries(byType).forEach(([type, particles]) => {
      const srcId = `ptcl-src-${type}`;
      const layerId = `ptcl-layer-${type}`;
      const color = COLORS[type] || COLORS.data;
      const vis = (type === 'data' || this.layerVisibility[type]) ? 'visible' : 'none';

      const features = particles.map(p => {
        const idx = Math.floor(p.offset * (p.arc.length - 1));
        return { type: 'Feature', geometry: { type: 'Point', coordinates: p.arc[idx] }, properties: {} };
      });

      if (this.map.getSource(srcId)) {
        this.map.getSource(srcId).setData({ type: 'FeatureCollection', features });
      } else {
        this.map.addSource(srcId, { type: 'geojson', data: { type: 'FeatureCollection', features } });
      }

      if (!this.map.getLayer(layerId)) {
        this.map.addLayer({
          id: layerId, type: 'circle', source: srcId,
          layout: { visibility: vis },
          paint: { 'circle-radius': 4, 'circle-color': color, 'circle-opacity': 0.9, 'circle-blur': 0.4 }
        });
      }

      this.particleSources.push({ srcId, particles, type });
      this.particleLayers.push(layerId);
    });

    // Animation loop
    const tick = () => {
      this.particleSources.forEach(({ srcId, particles }) => {
        const features = particles.map(p => {
          p.offset = (p.offset + p.speed) % 1;
          const idx = Math.min(Math.floor(p.offset * (p.arc.length - 1)), p.arc.length - 1);
          return { type: 'Feature', geometry: { type: 'Point', coordinates: p.arc[idx] }, properties: {} };
        });
        const src = this.map.getSource(srcId);
        if (src) src.setData({ type: 'FeatureCollection', features });
      });
      this.animationFrameId = requestAnimationFrame(tick);
    };
    this.animationFrameId = requestAnimationFrame(tick);
  }

  _stopParticles() {
    if (this.animationFrameId) { cancelAnimationFrame(this.animationFrameId); this.animationFrameId = null; }
  }

  // --- Visibility sync ---

  _syncLayerVisibility() {
    [...this.flowLayerIds, ...this.particleLayers].forEach(id => {
      // Extract type from layer id (e.g. "flow-line-electricity" → "electricity")
      const parts = id.split('-');
      const type = parts[parts.length - 1];
      if (type === 'data') return;
      const vis = this.layerVisibility[type] ? 'visible' : 'none';
      if (this.map.getLayer(id)) this.map.setLayoutProperty(id, 'visibility', vis);
    });
  }
}
