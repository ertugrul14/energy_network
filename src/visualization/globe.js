/**
 * GHOST NETWORK - Globe Visualization
 * Three.js 3D globe with animated ghost line flows
 */

import * as THREE from 'three';
import { gsap } from 'gsap';

export class GlobeVisualization {
  constructor(container) {
    this.container = container;
    this.width = container.clientWidth;
    this.height = container.clientHeight;
    
    // Scene objects
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.globe = null;
    this.globeGroup = null; // Group to hold globe and all overlays
    this.atmosphere = null;
    this.flowLines = [];
    this.markers = [];
    this.labels = [];
    
    // Animation state
    this.isAnimating = true;
    this.rotationSpeed = 0.0005;
    this.targetRotation = { x: 0, y: 0 };
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    
    // Layer visibility
    this.layerVisibility = {
      electricity: true,
      water: true,
      emissions: true,
      materials: true
    };
    
    // City highlights
    this.cityHighlights = {};
    this.selectedCity = null;

    // Datacenter highlights
    this.datacenterHighlights = {};
    this.selectedDatacenter = null;

    // Raycaster for click detection
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.clickableObjects = [];
    
    // Popup callback
    this.onLocationClick = null;

    // Colors - professional dashboard palette
    this.colors = {
      electricity: 0xf0b429,
      water: 0x58a6ff,
      emissions: 0xf85149,
      materials: 0xa371f7,
      data: 0x58a6ff,
      globe: 0x21262d,
      atmosphere: 0x388bfd,
      marker: 0xe6edf3,
      datacenter: 0xf85149
    };

    this.init();
    this.animate();
  }

  init() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0d1117);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      this.width / this.height,
      0.1,
      1000
    );
    this.camera.position.z = 3;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    // Create globe group (holds globe and all overlays so they rotate together)
    this.globeGroup = new THREE.Group();
    this.scene.add(this.globeGroup);

    // Create globe
    this.createGlobe();
    this.createAtmosphere();
    this.createStars();

    // Lighting
    this.setupLighting();

    // Events
    this.setupEvents();
  }

  createGlobe() {
    // Main globe geometry
    const geometry = new THREE.SphereGeometry(1, 128, 128);
    
    // Load dark style Earth texture
    const textureLoader = new THREE.TextureLoader();
    
    // Use dark earth texture for Mapbox-style appearance
    const earthTexture = textureLoader.load(
      'https://unpkg.com/three-globe@2.31.0/example/img/earth-dark.jpg',
      (texture) => { 
        console.log('Earth texture loaded');
        texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
      },
      undefined,
      (err) => { 
        console.log('Earth texture failed, using dark fallback');
        // Use a simple dark material as ultimate fallback
        this.globe.material = new THREE.MeshPhongMaterial({
          color: 0x1a2a3a,
          emissive: 0x0a1520,
          shininess: 5
        });
      }
    );
    
    // Night lights overlay for urban areas
    const nightTexture = textureLoader.load(
      'https://unpkg.com/three-globe@2.31.0/example/img/earth-night.jpg'
    );

    // Create material with dark earth texture
    const material = new THREE.MeshPhongMaterial({
      map: earthTexture,
      bumpScale: 0.01,
      specular: new THREE.Color(0x111111),
      shininess: 3,
      transparent: false
    });

    this.globe = new THREE.Mesh(geometry, material);
    this.globeGroup.add(this.globe);
    
    // Add subtle night lights layer
    this.createNightLightsLayer(nightTexture);
  }
  
  /**
   * Create night lights overlay showing urban areas
   */
  createNightLightsLayer(nightTexture) {
    const geometry = new THREE.SphereGeometry(1.001, 128, 128);
    const material = new THREE.MeshBasicMaterial({
      map: nightTexture,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    });
    
    this.nightLightsMesh = new THREE.Mesh(geometry, material);
    this.globeGroup.add(this.nightLightsMesh);
  }

  createAtmosphere() {
    const geometry = new THREE.SphereGeometry(1.02, 64, 64);
    const material = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity * 0.5;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });

    this.atmosphere = new THREE.Mesh(geometry, material);
    this.globeGroup.add(this.atmosphere);
  }

  createStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 2000;
    const positions = new Float32Array(starsCount * 3);

    for (let i = 0; i < starsCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.05,
      transparent: true,
      opacity: 0.8
    });

    const stars = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(stars);
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 3, 5);
    this.scene.add(directionalLight);
  }

  setupEvents() {
    // Resize
    window.addEventListener('resize', () => this.onResize());

    // Mouse interaction
    this.container.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.container.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.container.addEventListener('mouseup', (e) => this.onMouseUp(e));
    this.container.addEventListener('mouseleave', () => this.onMouseLeave());
    this.container.addEventListener('wheel', (e) => this.onWheel(e));
    this.container.addEventListener('click', (e) => this.onClick(e));
  }

  onResize() {
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(this.width, this.height);
  }

  onMouseDown(event) {
    this.isDragging = true;
    this.previousMousePosition = {
      x: event.clientX,
      y: event.clientY
    };
  }

  onMouseMove(event) {
    if (!this.isDragging) return;

    const deltaX = event.clientX - this.previousMousePosition.x;
    const deltaY = event.clientY - this.previousMousePosition.y;

    // Track that we've moved (for click detection)
    this.hasDragged = true;

    // Rotate the entire globeGroup so all overlays rotate together
    this.globeGroup.rotation.y += deltaX * 0.005;
    this.globeGroup.rotation.x += deltaY * 0.005;

    // Clamp vertical rotation
    this.globeGroup.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.globeGroup.rotation.x));

    this.previousMousePosition = {
      x: event.clientX,
      y: event.clientY
    };
  }

  onMouseUp(event) {
    this.isDragging = false;
  }

  onMouseLeave() {
    this.isDragging = false;
    this.hasDragged = false;
  }

  /**
   * Handle click on globe to detect location markers
   */
  onClick(event) {
    // Ignore if we were dragging
    if (this.hasDragged) {
      this.hasDragged = false;
      return;
    }

    // Calculate mouse position in normalized device coordinates
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Update raycaster
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Check for intersections with clickable objects
    const allClickables = [];
    
    // Add city click targets (larger invisible areas)
    Object.entries(this.cityHighlights).forEach(([cityId, highlight]) => {
      if (highlight.clickTarget) {
        allClickables.push(highlight.clickTarget);
      } else if (highlight.disc) {
        highlight.disc.userData.locationType = 'city';
        highlight.disc.userData.locationId = cityId;
        allClickables.push(highlight.disc);
      }
    });
    
    // Add datacenter click targets (larger invisible areas)
    Object.entries(this.datacenterHighlights).forEach(([dcId, highlight]) => {
      if (highlight.clickTarget) {
        allClickables.push(highlight.clickTarget);
      } else if (highlight.diamond) {
        highlight.diamond.userData.locationType = 'datacenter';
        highlight.diamond.userData.locationId = dcId;
        allClickables.push(highlight.diamond);
      }
    });

    const intersects = this.raycaster.intersectObjects(allClickables, false);

    if (intersects.length > 0) {
      const clicked = intersects[0].object;
      const locationType = clicked.userData.locationType;
      const locationId = clicked.userData.locationId;
      
      // Trigger pulse effect on the clicked marker
      this.pulseLocation(locationType, locationId);
      
      if (this.onLocationClick) {
        // Pass click coordinates for popup positioning
        this.onLocationClick(locationType, locationId, event.clientX, event.clientY);
      }
    }
  }

  /**
   * Pulse animation effect on a location marker
   */
  pulseLocation(type, id) {
    if (type === 'city') {
      const highlight = this.cityHighlights[id];
      if (highlight && highlight.disc) {
        // Pulse the disc
        gsap.to(highlight.disc.scale, {
          x: 2,
          y: 2,
          z: 2,
          duration: 0.2,
          ease: 'power2.out',
          onComplete: () => {
            gsap.to(highlight.disc.scale, {
              x: 1.2,
              y: 1.2,
              z: 1.2,
              duration: 0.3,
              ease: 'elastic.out(1, 0.5)'
            });
          }
        });
        // Flash the outline
        gsap.to(highlight.outline.material, {
          opacity: 1,
          duration: 0.1,
          yoyo: true,
          repeat: 1
        });
      }
    } else if (type === 'datacenter') {
      const highlight = this.datacenterHighlights[id];
      if (highlight && highlight.diamond) {
        // Pulse the diamond
        gsap.to(highlight.diamond.scale, {
          x: 2,
          y: 2,
          z: 2,
          duration: 0.2,
          ease: 'power2.out',
          onComplete: () => {
            gsap.to(highlight.diamond.scale, {
              x: 1.3,
              y: 1.3,
              z: 1.3,
              duration: 0.3,
              ease: 'elastic.out(1, 0.5)'
            });
          }
        });
        // Flash the ring
        gsap.to(highlight.ring.material, {
          opacity: 0.8,
          duration: 0.1,
          yoyo: true,
          repeat: 1
        });
      }
    }
  }

  /**
   * Set callback for location click events
   */
  setLocationClickCallback(callback) {
    this.onLocationClick = callback;
  }

  /**
   * Create initial location markers for all cities and datacenters
   */
  createAllLocationMarkers() {
    // Create city markers
    const cityBoundaries = this.getCityBoundaries();
    Object.keys(cityBoundaries).forEach(cityId => {
      this.createCityHighlight(cityId);
      // Start with lower opacity
      const highlight = this.cityHighlights[cityId];
      if (highlight) {
        highlight.outline.material.opacity = 0.4;
        highlight.glowLine.material.opacity = 0.2;
        highlight.disc.material.opacity = 0.3;
      }
    });

    // Create datacenter markers
    const dcLocations = this.getDatacenterLocations();
    Object.keys(dcLocations).forEach(dcId => {
      this.createDatacenterHighlight(dcId);
      // Start with visible state
      const highlight = this.datacenterHighlights[dcId];
      if (highlight) {
        highlight.diamond.material.opacity = 0.5;
        highlight.ring.material.opacity = 0.2;
        highlight.pulseRing.material.opacity = 0.1;
      }
    });
  }

  /**
   * City boundary data (simplified polygons for major cities)
   */
  getCityBoundaries() {
    return {
      barcelona: {
        center: { lat: 41.3851, lng: 2.1734 },
        // Simplified boundary polygon (lat, lng pairs)
        polygon: [
          [41.45, 2.05], [41.47, 2.10], [41.47, 2.20], [41.45, 2.25],
          [41.42, 2.28], [41.38, 2.28], [41.33, 2.25], [41.32, 2.18],
          [41.32, 2.12], [41.35, 2.05], [41.40, 2.02], [41.45, 2.05]
        ],
        color: 0x00ff88
      },
      lagos: {
        center: { lat: 6.5244, lng: 3.3792 },
        polygon: [
          [6.65, 3.25], [6.70, 3.35], [6.68, 3.50], [6.60, 3.55],
          [6.50, 3.55], [6.42, 3.50], [6.38, 3.40], [6.40, 3.28],
          [6.48, 3.22], [6.58, 3.22], [6.65, 3.25]
        ],
        color: 0x00ff88
      },
      phoenix: {
        center: { lat: 33.4484, lng: -112.0740 },
        polygon: [
          [33.55, -112.20], [33.58, -112.05], [33.55, -111.92],
          [33.48, -111.88], [33.38, -111.90], [33.32, -112.00],
          [33.30, -112.15], [33.35, -112.25], [33.45, -112.28],
          [33.55, -112.20]
        ],
        color: 0x00ff88
      },
      dublin: {
        center: { lat: 53.3498, lng: -6.2603 },
        polygon: [
          [53.42, -6.40], [53.43, -6.25], [53.42, -6.10],
          [53.38, -6.05], [53.32, -6.08], [53.28, -6.18],
          [53.28, -6.32], [53.32, -6.42], [53.38, -6.45],
          [53.42, -6.40]
        ],
        color: 0x00ff88
      }
    };
  }

  /**
   * Create city highlight ring/outline on the globe
   */
  createCityHighlight(cityId) {
    const boundaries = this.getCityBoundaries();
    const cityData = boundaries[cityId];
    
    if (!cityData) return null;

    // Create a ring around the city
    const points = [];
    const radius = 1.005; // Slightly above globe surface
    
    // Convert polygon points to 3D positions
    for (const [lat, lng] of cityData.polygon) {
      points.push(this.latLngToVector3(lat, lng, radius));
    }
    // Close the loop
    if (points.length > 0) {
      points.push(points[0].clone());
    }

    // Create the outline geometry
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    const material = new THREE.LineBasicMaterial({
      color: cityData.color,
      linewidth: 2,
      transparent: true,
      opacity: 0.9
    });

    const outline = new THREE.Line(geometry, material);
    outline.userData = { cityId, type: 'cityHighlight' };

    // Create a pulsing glow effect - larger ring
    const glowPoints = [];
    for (const [lat, lng] of cityData.polygon) {
      glowPoints.push(this.latLngToVector3(lat, lng, radius + 0.002));
    }
    if (glowPoints.length > 0) {
      glowPoints.push(glowPoints[0].clone());
    }
    
    const glowGeometry = new THREE.BufferGeometry().setFromPoints(glowPoints);
    const glowMaterial = new THREE.LineBasicMaterial({
      color: cityData.color,
      transparent: true,
      opacity: 0.4,
      linewidth: 4
    });
    
    const glowLine = new THREE.Line(glowGeometry, glowMaterial);
    glowLine.userData = { cityId, type: 'cityGlow' };

    // Create a filled area indicator (semi-transparent disc at city center)
    const centerPos = this.latLngToVector3(cityData.center.lat, cityData.center.lng, radius);
    const discGeometry = new THREE.CircleGeometry(0.03, 32);
    const discMaterial = new THREE.MeshBasicMaterial({
      color: cityData.color,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    const disc = new THREE.Mesh(discGeometry, discMaterial);
    disc.position.copy(centerPos);
    disc.lookAt(0, 0, 0);
    disc.userData = { cityId, type: 'cityDisc' };

    // Store references
    this.cityHighlights[cityId] = { outline, glowLine, disc };
    
    // Add larger invisible click target
    const clickTargetGeometry = new THREE.CircleGeometry(0.06, 32);
    const clickTargetMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    const clickTarget = new THREE.Mesh(clickTargetGeometry, clickTargetMaterial);
    clickTarget.position.copy(centerPos);
    clickTarget.lookAt(0, 0, 0);
    clickTarget.userData = { cityId, type: 'cityClickTarget', locationType: 'city', locationId: cityId };
    this.cityHighlights[cityId].clickTarget = clickTarget;
    this.globeGroup.add(clickTarget);
    
    // Add to globe group
    this.globeGroup.add(outline);
    this.globeGroup.add(glowLine);
    this.globeGroup.add(disc);

    return { outline, glowLine, disc };
  }

  /**
   * Highlight a city (show its outline)
   */
  highlightCity(cityId) {
    // Remove previous highlight
    if (this.selectedCity && this.selectedCity !== cityId) {
      this.unhighlightCity(this.selectedCity);
    }

    this.selectedCity = cityId;

    // Create highlight if it doesn't exist
    if (!this.cityHighlights[cityId]) {
      this.createCityHighlight(cityId);
    }

    const highlight = this.cityHighlights[cityId];
    if (highlight) {
      // Animate in
      gsap.to(highlight.outline.material, {
        opacity: 1,
        duration: 0.3
      });
      gsap.to(highlight.glowLine.material, {
        opacity: 0.6,
        duration: 0.3
      });
      gsap.to(highlight.disc.material, {
        opacity: 0.4,
        duration: 0.3
      });
      gsap.to(highlight.disc.scale, {
        x: 1.2,
        y: 1.2,
        z: 1.2,
        duration: 0.5,
        ease: 'elastic.out(1, 0.5)'
      });
    }
  }

  /**
   * Remove city highlight
   */
  unhighlightCity(cityId) {
    const highlight = this.cityHighlights[cityId];
    if (highlight) {
      gsap.to(highlight.outline.material, {
        opacity: 0,
        duration: 0.3
      });
      gsap.to(highlight.glowLine.material, {
        opacity: 0,
        duration: 0.3
      });
      gsap.to(highlight.disc.material, {
        opacity: 0,
        duration: 0.3
      });
      gsap.to(highlight.disc.scale, {
        x: 0.5,
        y: 0.5,
        z: 0.5,
        duration: 0.3
      });
    }
  }

  /**
   * Clear all city highlights
   */
  clearCityHighlights() {
    for (const cityId of Object.keys(this.cityHighlights)) {
      this.unhighlightCity(cityId);
    }
    this.selectedCity = null;
  }

  /**
   * Datacenter location data with visual markers
   */
  getDatacenterLocations() {
    return {
      arizona: {
        center: { lat: 33.3942, lng: -111.9261 },
        name: 'Arizona Hyperscale',
        color: 0xff4444
      },
      finland: {
        center: { lat: 60.5693, lng: 27.1878 },
        name: 'Nordic Green DC',
        color: 0x44ff88
      },
      singapore: {
        center: { lat: 1.3521, lng: 103.8198 },
        name: 'Equinix SG Hub',
        color: 0xff8844
      },
      ireland: {
        center: { lat: 53.4055, lng: -6.3725 },
        name: 'Dublin Cloud Campus',
        color: 0x4488ff
      }
    };
  }

  /**
   * Create datacenter highlight marker on the globe
   */
  createDatacenterHighlight(datacenterId) {
    const locations = this.getDatacenterLocations();
    const dcData = locations[datacenterId];
    
    if (!dcData) return null;

    const radius = 1.005;
    const centerPos = this.latLngToVector3(dcData.center.lat, dcData.center.lng, radius);

    // Create a diamond/rhombus shape for datacenter (different from city circle)
    const diamondShape = new THREE.Shape();
    const size = 0.04;
    diamondShape.moveTo(0, size);
    diamondShape.lineTo(size * 0.6, 0);
    diamondShape.lineTo(0, -size);
    diamondShape.lineTo(-size * 0.6, 0);
    diamondShape.lineTo(0, size);

    const diamondGeometry = new THREE.ShapeGeometry(diamondShape);
    const diamondMaterial = new THREE.MeshBasicMaterial({
      color: dcData.color,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });
    const diamond = new THREE.Mesh(diamondGeometry, diamondMaterial);
    diamond.position.copy(centerPos);
    diamond.lookAt(0, 0, 0);
    diamond.userData = { datacenterId, type: 'datacenterMarker' };

    // Create outer ring for glow effect
    const ringGeometry = new THREE.RingGeometry(0.045, 0.055, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: dcData.color,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.copy(centerPos);
    ring.lookAt(0, 0, 0);
    ring.userData = { datacenterId, type: 'datacenterRing' };

    // Create pulsing outer ring
    const pulseRingGeometry = new THREE.RingGeometry(0.06, 0.065, 32);
    const pulseRingMaterial = new THREE.MeshBasicMaterial({
      color: dcData.color,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide
    });
    const pulseRing = new THREE.Mesh(pulseRingGeometry, pulseRingMaterial);
    pulseRing.position.copy(centerPos);
    pulseRing.lookAt(0, 0, 0);
    pulseRing.userData = { datacenterId, type: 'datacenterPulse' };

    // Store references
    this.datacenterHighlights[datacenterId] = { diamond, ring, pulseRing };
    
    // Add larger invisible click target
    const clickTargetGeometry = new THREE.CircleGeometry(0.08, 32);
    const clickTargetMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    const clickTarget = new THREE.Mesh(clickTargetGeometry, clickTargetMaterial);
    clickTarget.position.copy(centerPos);
    clickTarget.lookAt(0, 0, 0);
    clickTarget.userData = { datacenterId, type: 'dcClickTarget', locationType: 'datacenter', locationId: datacenterId };
    this.datacenterHighlights[datacenterId].clickTarget = clickTarget;
    this.globeGroup.add(clickTarget);
    
    // Add to globe group
    this.globeGroup.add(diamond);
    this.globeGroup.add(ring);
    this.globeGroup.add(pulseRing);

    return { diamond, ring, pulseRing };
  }

  /**
   * Highlight a datacenter (show its marker)
   */
  highlightDatacenter(datacenterId) {
    // Remove previous highlight
    if (this.selectedDatacenter && this.selectedDatacenter !== datacenterId) {
      this.unhighlightDatacenter(this.selectedDatacenter);
    }

    this.selectedDatacenter = datacenterId;

    // Create highlight if it doesn't exist
    if (!this.datacenterHighlights[datacenterId]) {
      this.createDatacenterHighlight(datacenterId);
    }

    const highlight = this.datacenterHighlights[datacenterId];
    if (highlight) {
      // Animate in with pulsing effect
      gsap.to(highlight.diamond.material, {
        opacity: 0.9,
        duration: 0.3
      });
      gsap.to(highlight.ring.material, {
        opacity: 0.6,
        duration: 0.3
      });
      gsap.to(highlight.pulseRing.material, {
        opacity: 0.4,
        duration: 0.3
      });
      
      // Scale up effect
      gsap.to(highlight.diamond.scale, {
        x: 1.3,
        y: 1.3,
        z: 1.3,
        duration: 0.5,
        ease: 'elastic.out(1, 0.5)'
      });
      
      // Pulsing animation on the outer ring
      gsap.to(highlight.pulseRing.scale, {
        x: 1.5,
        y: 1.5,
        z: 1.5,
        duration: 1,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
    }
  }

  /**
   * Remove datacenter highlight
   */
  unhighlightDatacenter(datacenterId) {
    const highlight = this.datacenterHighlights[datacenterId];
    if (highlight) {
      gsap.killTweensOf(highlight.pulseRing.scale);
      gsap.to(highlight.diamond.material, {
        opacity: 0.3,
        duration: 0.3
      });
      gsap.to(highlight.ring.material, {
        opacity: 0.1,
        duration: 0.3
      });
      gsap.to(highlight.pulseRing.material, {
        opacity: 0,
        duration: 0.3
      });
      gsap.to(highlight.diamond.scale, {
        x: 0.8,
        y: 0.8,
        z: 0.8,
        duration: 0.3
      });
      gsap.to(highlight.pulseRing.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.3
      });
    }
  }

  /**
   * Clear all datacenter highlights
   */
  clearDatacenterHighlights() {
    for (const dcId of Object.keys(this.datacenterHighlights)) {
      this.unhighlightDatacenter(dcId);
    }
    this.selectedDatacenter = null;
  }

  /**
   * Focus globe on datacenter location
   */
  focusOnDatacenter(datacenterId) {
    const locations = this.getDatacenterLocations();
    const dcData = locations[datacenterId];
    if (dcData) {
      this.focusOnLocation(dcData.center);
      this.highlightDatacenter(datacenterId);
    }
  }

  onWheel(event) {
    event.preventDefault();
    const zoomSpeed = 0.001;
    this.camera.position.z += event.deltaY * zoomSpeed;
    this.camera.position.z = Math.max(1.5, Math.min(5, this.camera.position.z));
  }

  /**
   * Convert lat/lng to 3D position on sphere
   */
  latLngToVector3(lat, lng, radius = 1) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);

    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }

  /**
   * Create a curved line between two points (ghost line)
   */
  createGhostLine(from, to, type, intensity = 1) {
    const startVec = this.latLngToVector3(from.lat, from.lng);
    const endVec = this.latLngToVector3(to.lat, to.lng);

    // Calculate arc height based on distance
    const distance = startVec.distanceTo(endVec);
    const arcHeight = 0.2 + distance * 0.3;

    // Create control point for quadratic curve
    const midPoint = new THREE.Vector3()
      .addVectors(startVec, endVec)
      .multiplyScalar(0.5)
      .normalize()
      .multiplyScalar(1 + arcHeight);

    // Create curve
    const curve = new THREE.QuadraticBezierCurve3(startVec, midPoint, endVec);
    const points = curve.getPoints(50);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    // Color based on type
    const color = this.colors[type] || this.colors.data;

    // Create dashed line material for ghost effect
    const material = new THREE.LineDashedMaterial({
      color,
      linewidth: 2,
      dashSize: 0.03,
      gapSize: 0.02,
      transparent: true,
      opacity: intensity * 0.8
    });

    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();
    line.userData = { type, intensity, curve };

    return line;
  }

  /**
   * Create animated flowing particles along a path
   */
  createFlowParticles(curve, type, count = 20) {
    const particles = [];
    const color = this.colors[type] || this.colors.data;

    for (let i = 0; i < count; i++) {
      const geometry = new THREE.SphereGeometry(0.008, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.9
      });
      
      const particle = new THREE.Mesh(geometry, material);
      particle.userData = {
        curve,
        offset: i / count,
        speed: 0.001 + Math.random() * 0.001,
        type: type // Store the layer type for filtering
      };
      
      particles.push(particle);
      this.globeGroup.add(particle); // Add to globeGroup so it rotates with globe
    }

    return particles;
  }

  /**
   * Create location marker
   */
  createMarker(coords, label, type = 'city') {
    const position = this.latLngToVector3(coords.lat, coords.lng, 1.01);
    
    // Marker geometry
    const geometry = new THREE.SphereGeometry(0.015, 16, 16);
    const color = type === 'city' ? 0x00ff88 : 
                  type === 'datacenter' ? 0xff6b6b : 
                  0xffffff;
    
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9
    });
    
    const marker = new THREE.Mesh(geometry, material);
    marker.position.copy(position);
    marker.userData = { label, type, coords };
    
    // Pulse ring
    const ringGeometry = new THREE.RingGeometry(0.02, 0.025, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.copy(position);
    ring.lookAt(new THREE.Vector3(0, 0, 0));
    marker.userData.ring = ring;
    
    // Add to globeGroup so markers rotate with globe
    this.globeGroup.add(marker);
    this.globeGroup.add(ring);
    this.markers.push(marker);
    
    return marker;
  }

  /**
   * Visualize simulation flows
   */
  visualizeFlows(flows) {
    // Clear existing flows
    this.clearFlows();

    const allParticles = [];

    for (const flow of flows) {
      // Check layer visibility
      if (!this.layerVisibility[flow.type] && flow.type !== 'data') {
        continue;
      }

      // Create ghost line
      const line = this.createGhostLine(flow.from, flow.to, flow.type, flow.intensity);
      this.flowLines.push(line);
      this.globeGroup.add(line); // Add to globeGroup so lines rotate with globe

      // Create flowing particles
      const particles = this.createFlowParticles(line.userData.curve, flow.type);
      allParticles.push(...particles);

      // Create markers at endpoints
      this.createMarker(flow.from, flow.label || 'Source', flow.type);
      this.createMarker(flow.to, flow.label || 'Destination', flow.type);
    }

    // Store particles for animation
    this.flowParticles = allParticles;

    // Animate lines appearing
    this.animateFlowsIn();
  }

  /**
   * Animate flows appearing
   */
  animateFlowsIn() {
    for (const line of this.flowLines) {
      line.material.opacity = 0;
      gsap.to(line.material, {
        opacity: line.userData.intensity * 0.8,
        duration: 1,
        ease: 'power2.out'
      });
    }

    for (const marker of this.markers) {
      marker.scale.set(0, 0, 0);
      gsap.to(marker.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.5,
        ease: 'back.out(1.7)'
      });
      
      if (marker.userData.ring) {
        marker.userData.ring.scale.set(0, 0, 0);
        gsap.to(marker.userData.ring.scale, {
          x: 1,
          y: 1,
          z: 1,
          duration: 0.5,
          delay: 0.2,
          ease: 'back.out(1.7)'
        });
      }
    }
  }

  /**
   * Clear all flow visualizations
   */
  clearFlows() {
    // Remove lines
    for (const line of this.flowLines) {
      this.globeGroup.remove(line);
      line.geometry.dispose();
      line.material.dispose();
    }
    this.flowLines = [];

    // Remove particles
    if (this.flowParticles) {
      for (const particle of this.flowParticles) {
        this.globeGroup.remove(particle);
        particle.geometry.dispose();
        particle.material.dispose();
      }
      this.flowParticles = [];
    }

    // Remove markers
    for (const marker of this.markers) {
      this.globeGroup.remove(marker);
      marker.geometry.dispose();
      marker.material.dispose();
      if (marker.userData.ring) {
        this.globeGroup.remove(marker.userData.ring);
        marker.userData.ring.geometry.dispose();
        marker.userData.ring.material.dispose();
      }
    }
    this.markers = [];
  }

  /**
   * Set layer visibility
   */
  setLayerVisibility(layer, visible) {
    this.layerVisibility[layer] = visible;
    console.log('Globe: Setting layer', layer, 'to', visible ? 'visible' : 'hidden');

    // Update existing flow lines
    for (const line of this.flowLines) {
      if (line.userData.type === layer) {
        line.visible = visible;
        line.material.opacity = visible ? line.userData.intensity * 0.8 : 0;
      }
    }
    
    // Update particles
    if (this.flowParticles) {
      for (const particle of this.flowParticles) {
        if (particle.userData.type === layer) {
          particle.visible = visible;
          particle.material.opacity = visible ? 0.9 : 0;
        }
      }
    }
    
    // Update markers
    for (const marker of this.markers) {
      if (marker.userData.type === layer) {
        marker.visible = visible;
        marker.material.opacity = visible ? 0.9 : 0;
        if (marker.userData.ring) {
          marker.userData.ring.visible = visible;
          marker.userData.ring.material.opacity = visible ? 0.6 : 0;
        }
      }
    }
  }
  
  /**
   * Set all layers visible or hidden
   */
  setAllLayersVisibility(visible) {
    console.log('Globe: Setting all layers to', visible ? 'visible' : 'hidden');
    const layers = ['electricity', 'water', 'emissions', 'materials'];
    for (const layer of layers) {
      this.setLayerVisibility(layer, visible);
    }
  }

  /**
   * Focus camera on a location
   */
  focusOnLocation(coords) {
    const targetPosition = this.latLngToVector3(coords.lat, coords.lng);
    
    // Calculate rotation to face this point
    const angle = Math.atan2(targetPosition.x, targetPosition.z);
    
    gsap.to(this.globeGroup.rotation, {
      y: -angle,
      duration: 1.5,
      ease: 'power2.inOut'
    });
  }

  /**
   * Animation loop
   */
  animate() {
    if (!this.isAnimating) return;
    
    requestAnimationFrame(() => this.animate());

    // Slow auto-rotation when not dragging
    if (!this.isDragging) {
      this.globeGroup.rotation.y += this.rotationSpeed;
    }

    // Animate flowing particles
    if (this.flowParticles) {
      for (const particle of this.flowParticles) {
        const { curve, offset, speed } = particle.userData;
        particle.userData.offset = (offset + speed) % 1;
        
        const point = curve.getPoint(particle.userData.offset);
        particle.position.copy(point);
      }
    }

    // Animate marker pulse rings
    const time = Date.now() * 0.001;
    for (const marker of this.markers) {
      if (marker.userData.ring) {
        const scale = 1 + Math.sin(time * 2) * 0.2;
        marker.userData.ring.scale.set(scale, scale, scale);
        marker.userData.ring.material.opacity = 0.6 - Math.sin(time * 2) * 0.3;
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Cleanup
   */
  dispose() {
    this.isAnimating = false;
    this.clearFlows();
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}
