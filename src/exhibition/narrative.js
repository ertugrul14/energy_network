/**
 * NarrativeDirector — Cinematic storytelling sequence for the exhibition screen.
 * Orchestrates a 6-act narrative using GSAP timeline + Mapbox camera.
 */

import gsap from 'gsap';

const DESTINATION_COORDS = {
  'Stockholm':                { lat: 59.3293, lng: 18.0686 },
  'Hamina (Finland)':         { lat: 60.5693, lng: 27.1878 },
  'Dublin (serves EMEA)':     { lat: 53.4055, lng: -6.3725 },
  'Paris (France)':           { lat: 48.8566, lng: 2.3522 },
  'Paris':                    { lat: 48.8566, lng: 2.3522 },
  'Virginia (serves N. America)': { lat: 39.0438, lng: -77.4874 },
  'The Dalles, Oregon':       { lat: 45.5946, lng: -121.1787 },
  'Columbus, Ohio':           { lat: 39.9612, lng: -82.9988 },
  'Central Ohio':             { lat: 40.0, lng: -82.9 },
  'Changhua County (Taiwan)': { lat: 24.0518, lng: 120.5161 },
  'Inzai City (Japan)':       { lat: 35.8319, lng: 140.1462 },
  'Tokyo (serves Asia Pacific)': { lat: 35.6762, lng: 139.6503 },
  'Jakarta (Indonesia)':      { lat: -6.2088, lng: 106.8456 },
  'Chennai':                  { lat: 13.0827, lng: 80.2707 },
  'Mumbai':                   { lat: 19.0760, lng: 72.8777 },
  'Pune':                     { lat: 18.5204, lng: 73.8567 },
};

export class NarrativeDirector {
  constructor(globe, exhibitData) {
    this.globe = globe;
    this.exhibitData = exhibitData;
    this.timeline = null;
    this._slotTween = null;
    this._loopTimeout = null;
  }

  run(cityData, workloadData, exhibitMin, exhibitMax) {
    this.stop();

    this.cityData = cityData;
    this.workloadData = workloadData;

    this.destinations = this._collectDestinations();

    // Pick closest and farthest by distance
    if (this.destinations.length >= 2) {
      this.closestE = this.destinations[0][1];
      this.farthestE = this.destinations[this.destinations.length - 1][1];
    } else {
      this.closestE = exhibitMin;
      this.farthestE = exhibitMax;
    }

    this._buildSlotTrack();

    this.timeline = gsap.timeline({
      onComplete: () => {
        this._loopTimeout = setTimeout(() => this.run(cityData, workloadData, exhibitMin, exhibitMax), 2000);
      }
    });

    this._buildAct1();
    this._buildAct2();
    this._buildAct3();
    this._buildAct4();
    this._buildAct5();
    this._buildAct6();
  }

  stop() {
    if (this.timeline) {
      this.timeline.kill();
      this.timeline = null;
    }
    if (this._slotTween) {
      this._slotTween.kill();
      this._slotTween = null;
    }
    if (this._loopTimeout) {
      clearTimeout(this._loopTimeout);
      this._loopTimeout = null;
    }
    this.globe.clearFlows();
    this._hideAll();
  }

  _collectDestinations() {
    const cityKey = this.cityData.exhibitKey;
    const cityExhibit = this.exhibitData[cityKey];
    if (!cityExhibit) return [];

    const destMap = new Map();
    for (const [, opData] of Object.entries(cityExhibit.operations)) {
      for (const entry of [opData.min, opData.max]) {
        if (!entry || !DESTINATION_COORDS[entry.destination]) continue;
        const existing = destMap.get(entry.destination);
        if (!existing || entry.distance_km < existing.distance_km) {
          destMap.set(entry.destination, entry);
        }
      }
    }
    // Returns [name, fullDataEntry] pairs sorted by distance (closest first)
    return [...destMap.entries()]
      .sort((a, b) => a[1].distance_km - b[1].distance_km);
  }

  _buildSlotTrack() {
    const track = document.getElementById('narrative-slot-track');
    track.innerHTML = '';

    const dests = this.destinations;
    if (dests.length === 0) return;

    for (let copy = 0; copy < 3; copy++) {
      for (const [cityName, entry] of dests) {
        const item = document.createElement('div');
        item.className = 'narrative-slot-item';
        item.dataset.city = cityName;
        item.innerHTML = `
          <span class="narrative-slot-city">${cityName.toUpperCase()}</span>
          <span class="narrative-slot-distance">${entry.distance_km.toLocaleString()} km</span>
        `;
        track.appendChild(item);
      }
    }

    // Temporarily show to measure item height
    const slot = document.getElementById('narrative-slot');
    const wasHidden = slot.classList.contains('hidden');
    if (wasHidden) {
      slot.style.visibility = 'hidden';
      slot.classList.remove('hidden');
    }
    this._slotItemHeight = track.firstElementChild?.offsetHeight || 64;
    this._slotItemCount = dests.length;
    if (wasHidden) {
      slot.classList.add('hidden');
      slot.style.visibility = '';
    }
  }

  // ── Act 1: Your Operation (0s-12s) ──
  _buildAct1() {
    const tl = this.timeline;
    const center = document.getElementById('narrative-center');
    const text = document.getElementById('narrative-center-text');
    const sub = document.getElementById('narrative-center-sub');
    const coords = this.cityData.coords;
    const avgKwh = ((this.closestE.electricity_kWh + this.farthestE.electricity_kWh) / 2).toFixed(1);

    tl.addLabel('act1', 0);

    // Fly to city
    tl.call(() => {
      this.globe.map.flyTo({
        center: [coords.lng, coords.lat],
        zoom: 5,
        pitch: 45,
        bearing: 0,
        duration: 2000
      });
    }, null, 'act1');

    // Show "YOU MADE THIS OPERATION"
    tl.call(() => {
      text.innerHTML = 'YOU MADE THIS OPERATION';
      sub.innerHTML = '';
      center.classList.remove('hidden');
    }, null, 'act1+=2');

    tl.fromTo(center, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8 }, 'act1+=2');

    // Show operation name
    tl.call(() => {
      text.innerHTML = `<span class="hl-accent">${(this.workloadData.name || '').toUpperCase()}</span>`;
    }, null, 'act1+=4.5');

    // Show electricity
    tl.call(() => {
      text.innerHTML = `<span class="hl-kwh">${avgKwh} kWh</span>`;
      sub.innerHTML = 'THIS ELECTRICITY IS THE SAME<br>REGARDLESS OF WHERE IT\'S PROCESSED';
    }, null, 'act1+=7');

    const counter = { val: 0 };
    tl.to(counter, {
      val: parseFloat(avgKwh),
      duration: 1.5,
      ease: 'power2.out',
      onUpdate: () => {
        text.innerHTML = `<span class="hl-kwh">${counter.val.toFixed(1)} kWh</span>`;
      }
    }, 'act1+=7');

    // Fade out
    tl.to(center, { opacity: 0, duration: 0.6 }, 'act1+=11');
  }

  // ── Act 2: The Datacenter Lottery (12s-27s) ──
  _buildAct2() {
    const tl = this.timeline;
    const center = document.getElementById('narrative-center');
    const text = document.getElementById('narrative-center-text');
    const sub = document.getElementById('narrative-center-sub');
    const slot = document.getElementById('narrative-slot');
    const track = document.getElementById('narrative-slot-track');
    const narrator = document.getElementById('screen-narrator');
    const coords = this.cityData.coords;

    tl.addLabel('act2', 'act1+=12');

    // Zoom out
    tl.call(() => {
      this.globe.map.flyTo({
        center: [coords.lng, coords.lat],
        zoom: 2.5,
        pitch: 20,
        bearing: 30,
        duration: 3000
      });
    }, null, 'act2');

    // Show routing text
    tl.call(() => {
      text.innerHTML = 'THE PLATFORM ROUTES YOUR REQUEST<br>TO ONE OF THESE DATACENTERS...';
      sub.innerHTML = '';
      center.classList.remove('hidden');
    }, null, 'act2+=1');

    tl.fromTo(center, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 }, 'act2+=1');

    // Fade center text, show slot machine
    tl.to(center, { opacity: 0, duration: 0.5 }, 'act2+=4');

    tl.call(() => {
      slot.classList.remove('hidden');
      gsap.set(slot, { opacity: 0 });
    }, null, 'act2+=4.5');

    tl.to(slot, { opacity: 1, duration: 0.6 }, 'act2+=4.5');

    // Start slot cycling
    tl.call(() => {
      const totalHeight = this._slotItemHeight * this._slotItemCount;
      if (totalHeight > 0) {
        this._slotTween = gsap.to(track, {
          y: `-=${totalHeight}`,
          duration: 4,
          ease: 'none',
          repeat: -1,
          modifiers: {
            y: gsap.utils.unitize(y => parseFloat(y) % totalHeight)
          }
        });
      }
    }, null, 'act2+=5');

    // Narrator text
    tl.call(() => {
      this._showNarrator(narrator, 'SAME ELECTRICITY. DIFFERENT DISTANCE. DIFFERENT CO₂.');
    }, null, 'act2+=6');
  }

  // ── Act 3: Closest Datacenter (27s-38s) ──
  _buildAct3() {
    const tl = this.timeline;
    const center = document.getElementById('narrative-center');
    const text = document.getElementById('narrative-center-text');
    const sub = document.getElementById('narrative-center-sub');
    const track = document.getElementById('narrative-slot-track');
    const narrator = document.getElementById('screen-narrator');

    tl.addLabel('act3', 'act2+=15');

    // Stop slot on closest
    tl.call(() => {
      if (this._slotTween) {
        this._slotTween.kill();
        this._slotTween = null;
      }

      const targetIdx = this.destinations.findIndex(([name]) => name === this.closestE.destination);
      if (targetIdx < 0) return;

      const viewportH = document.querySelector('.narrative-slot-viewport')?.offsetHeight || 320;
      const centerOffset = viewportH / 2 - this._slotItemHeight / 2;
      const targetY = -(targetIdx * this._slotItemHeight) + centerOffset;

      gsap.to(track, { y: targetY, duration: 2.5, ease: 'power3.out' });

      setTimeout(() => {
        const items = track.querySelectorAll('.narrative-slot-item');
        items.forEach(item => {
          item.classList.remove('locked-min', 'locked-max');
          if (item.dataset.city === this.closestE.destination) {
            item.classList.add('locked-min');
          }
        });
      }, 2600);
    }, null, 'act3');

    // Show closest text
    tl.call(() => {
      center.classList.remove('hidden');
      sub.innerHTML = `${this.closestE.destination} — ${this.closestE.co2_kg.toFixed(1)} kg CO₂`;
    }, null, 'act3+=3.5');

    const distCounter = { val: 0 };
    tl.fromTo(center, { opacity: 0 }, { opacity: 1, duration: 0.6 }, 'act3+=3.5');

    tl.to(distCounter, {
      val: this.closestE.distance_km,
      duration: 1.5,
      ease: 'power2.out',
      onUpdate: () => {
        text.innerHTML = `CLOSEST: <span class="hl-co2-good">${Math.round(distCounter.val).toLocaleString()} km</span>`;
      }
    }, 'act3+=3.5');

    // Clear narrator
    tl.call(() => { narrator.innerHTML = ''; }, null, 'act3+=3');

    // Fade center text
    tl.to(center, { opacity: 0, duration: 0.5 }, 'act3+=8');
  }

  // ── Act 4: Farthest Datacenter (38s-50s) ──
  _buildAct4() {
    const tl = this.timeline;
    const center = document.getElementById('narrative-center');
    const text = document.getElementById('narrative-center-text');
    const sub = document.getElementById('narrative-center-sub');
    const track = document.getElementById('narrative-slot-track');
    const slot = document.getElementById('narrative-slot');
    const comparison = document.getElementById('narrative-comparison');
    const narrator = document.getElementById('screen-narrator');

    const sameClosestFarthest = this.closestE.destination === this.farthestE.destination;

    tl.addLabel('act4', 'act3+=11');

    if (sameClosestFarthest) {
      tl.call(() => {
        slot.classList.add('hidden');
      }, null, 'act4');
      return;
    }

    // Resume slot briefly then stop on farthest
    tl.call(() => {
      const totalHeight = this._slotItemHeight * this._slotItemCount;
      if (totalHeight > 0) {
        this._slotTween = gsap.to(track, {
          y: `-=${totalHeight}`,
          duration: 3,
          ease: 'none',
          repeat: 0,
        });
      }
    }, null, 'act4');

    tl.call(() => {
      if (this._slotTween) {
        this._slotTween.kill();
        this._slotTween = null;
      }

      const targetIdx = this.destinations.findIndex(([name]) => name === this.farthestE.destination);
      if (targetIdx < 0) return;

      const viewportH = document.querySelector('.narrative-slot-viewport')?.offsetHeight || 320;
      const centerOffset = viewportH / 2 - this._slotItemHeight / 2;
      const targetY = -(targetIdx * this._slotItemHeight) + centerOffset;

      gsap.to(track, { y: targetY, duration: 2.5, ease: 'power3.out' });

      setTimeout(() => {
        const items = track.querySelectorAll('.narrative-slot-item');
        items.forEach(item => {
          item.classList.remove('locked-min', 'locked-max');
          if (item.dataset.city === this.farthestE.destination) {
            item.classList.add('locked-max');
          }
        });
      }, 2600);
    }, null, 'act4+=2');

    // Show farthest text
    tl.call(() => {
      center.classList.remove('hidden');
      sub.innerHTML = `${this.farthestE.destination} — ${this.farthestE.co2_kg.toFixed(1)} kg CO₂`;
    }, null, 'act4+=5');

    const farCounter = { val: 0 };
    tl.fromTo(center, { opacity: 0 }, { opacity: 1, duration: 0.6 }, 'act4+=5');

    tl.to(farCounter, {
      val: this.farthestE.distance_km,
      duration: 1.5,
      ease: 'power2.out',
      onUpdate: () => {
        text.innerHTML = `FARTHEST: <span class="hl-co2-bad">${Math.round(farCounter.val).toLocaleString()} km</span>`;
      }
    }, 'act4+=5');

    // Fade center, show comparison
    tl.to(center, { opacity: 0, duration: 0.4 }, 'act4+=7.5');

    tl.call(() => {
      slot.classList.add('hidden');
      this._populateComparison();
      comparison.classList.remove('hidden');
      gsap.set(comparison, { opacity: 0, y: 20 });
    }, null, 'act4+=8');

    tl.to(comparison, { opacity: 1, y: 0, duration: 0.8 }, 'act4+=8');

    // Narrator ratio text — show distance multiplier and CO2 contrast
    const distRatio = this.farthestE.distance_km > 0 && this.closestE.distance_km > 0
      ? (this.farthestE.distance_km / this.closestE.distance_km).toFixed(0)
      : '?';

    tl.call(() => {
      this._showNarrator(narrator, `${distRatio}× FARTHER — BUT THE CO₂ DEPENDS ON THE GRID, NOT THE DISTANCE`);
    }, null, 'act4+=9');

    // Fade comparison
    tl.to(comparison, { opacity: 0, duration: 0.6 }, 'act4+=11.5');
  }

  // ── Act 5: Follow the Energy (50s-65s) ──
  _buildAct5() {
    const tl = this.timeline;
    const center = document.getElementById('narrative-center');
    const text = document.getElementById('narrative-center-text');
    const sub = document.getElementById('narrative-center-sub');
    const narrator = document.getElementById('screen-narrator');
    const cityCoords = this.cityData.coords;
    const destCoords = DESTINATION_COORDS[this.closestE.destination];

    if (!destCoords) return;

    tl.addLabel('act5', 'act4+=12');

    // Show "let's follow" text
    tl.call(() => {
      text.innerHTML = `LET'S FOLLOW THE ENERGY<br>TO <span class="hl-accent">${this.closestE.destination.toUpperCase()}</span>`;
      sub.innerHTML = '';
      center.classList.remove('hidden');
      narrator.innerHTML = '';
    }, null, 'act5');

    tl.fromTo(center, { opacity: 0 }, { opacity: 1, duration: 0.6 }, 'act5');

    tl.to(center, { opacity: 0, duration: 0.5 }, 'act5+=2.5');

    // Phase 1: Zoom out
    tl.call(() => {
      this.globe.map.flyTo({
        center: [cityCoords.lng, cityCoords.lat],
        zoom: 1.8,
        pitch: 0,
        bearing: 0,
        duration: 3000
      });
    }, null, 'act5+=3');

    // Draw flow arc
    tl.call(() => {
      this.globe.clearFlows();
      this.globe.visualizeFlows([{
        type: 'electricity',
        from: { lat: cityCoords.lat, lng: cityCoords.lng },
        to: destCoords,
        label: this.closestE.destination,
        intensity: 1
      }]);
    }, null, 'act5+=5');

    // Phase 2: Pan to destination
    tl.call(() => {
      this.globe.map.flyTo({
        center: [destCoords.lng, destCoords.lat],
        zoom: 1.8,
        pitch: 10,
        bearing: 0,
        duration: 5000
      });
    }, null, 'act5+=6');

    // Show distance narrator
    tl.call(() => {
      this._showNarrator(narrator, `${this.closestE.distance_km.toLocaleString()} KM TRAVELED`);
    }, null, 'act5+=8');

    // Phase 3: Zoom into destination
    tl.call(() => {
      this.globe.map.flyTo({
        center: [destCoords.lng, destCoords.lat],
        zoom: 5,
        pitch: 45,
        bearing: -20,
        duration: 3000
      });
    }, null, 'act5+=11');
  }

  // ── Act 6: Water Cost (65s-78s) ──
  _buildAct6() {
    const tl = this.timeline;
    const center = document.getElementById('narrative-center');
    const text = document.getElementById('narrative-center-text');
    const sub = document.getElementById('narrative-center-sub');
    const narrator = document.getElementById('screen-narrator');

    tl.addLabel('act6', 'act5+=15');

    // "At the datacenter"
    tl.call(() => {
      text.innerHTML = 'AT THE DATACENTER';
      sub.innerHTML = '';
      center.classList.remove('hidden');
      narrator.innerHTML = '';
    }, null, 'act6');

    tl.fromTo(center, { opacity: 0 }, { opacity: 1, duration: 0.6 }, 'act6');

    // Water reveal
    tl.call(() => {
      sub.innerHTML = 'OF WATER CONSUMED';
    }, null, 'act6+=2.5');

    const waterCounter = { val: 0 };
    tl.to(waterCounter, {
      val: this.closestE.water_L,
      duration: 2,
      ease: 'power2.out',
      onUpdate: () => {
        text.innerHTML = `<span class="hl-water">${waterCounter.val.toFixed(1)} LITRES</span>`;
      }
    }, 'act6+=2.5');

    // Fade out everything
    tl.to(center, { opacity: 0, duration: 1 }, 'act6+=8');

    tl.call(() => {
      narrator.innerHTML = '';
      this.globe.clearFlows();
    }, null, 'act6+=9');

    tl.call(() => {
      this._hideAll();
    }, null, 'act6+=10');
  }

  // ── Helpers ──

  _populateComparison() {
    const cmp = document.getElementById('narrative-comparison');

    const minCard = cmp.querySelector('.narrative-cmp-min');
    const maxCard = cmp.querySelector('.narrative-cmp-max');

    minCard.innerHTML = `
      <div class="cmp-label">CLOSEST</div>
      <div class="cmp-city">${this.closestE.destination}</div>
      <div class="cmp-distance hl-co2-good">${this.closestE.distance_km.toLocaleString()} <span class="cmp-unit">km</span></div>
      <div class="cmp-co2">${this.closestE.co2_kg.toFixed(1)} <span class="cmp-unit">kg CO₂</span></div>
      <div class="cmp-kwh">${this.closestE.electricity_kWh.toFixed(1)} <span class="cmp-unit">kWh</span></div>
    `;

    maxCard.innerHTML = `
      <div class="cmp-label">FARTHEST</div>
      <div class="cmp-city">${this.farthestE.destination}</div>
      <div class="cmp-distance hl-co2-bad">${this.farthestE.distance_km.toLocaleString()} <span class="cmp-unit">km</span></div>
      <div class="cmp-co2">${this.farthestE.co2_kg.toFixed(1)} <span class="cmp-unit">kg CO₂</span></div>
      <div class="cmp-kwh">${this.farthestE.electricity_kWh.toFixed(1)} <span class="cmp-unit">kWh</span></div>
    `;
  }

  _showNarrator(el, text) {
    el.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'narrator-sentence';
    div.textContent = text;
    el.appendChild(div);
  }

  _hideAll() {
    const ids = ['narrative-center', 'narrative-slot', 'narrative-comparison'];
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) {
        el.classList.add('hidden');
        gsap.set(el, { opacity: 0 });
      }
    }
    const narrator = document.getElementById('screen-narrator');
    if (narrator) narrator.innerHTML = '';

    const track = document.getElementById('narrative-slot-track');
    if (track) {
      track.querySelectorAll('.narrative-slot-item').forEach(item => {
        item.classList.remove('locked-min', 'locked-max');
      });
    }
  }
}
