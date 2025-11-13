import districtsData from '../../game/data/districts.json' assert { type: 'json' };
import factionsData from '../../game/data/factions.json' assert { type: 'json' };
import activitiesData from '../../game/data/activities.json' assert { type: 'json' };
import vehiclesData from '../../game/data/vehicles.json' assert { type: 'json' };
import { createPlayer } from './player.js';
import { FactionSystem } from './factions.js';
import { ActivitySystem } from './activities.js';

export async function loadWorld({ ui }) {
  const world = new World({ ui, districtsData, factionsData, activitiesData, vehiclesData });
  world.init();
  return world;
}

export class World {
  constructor({ ui, districtsData, factionsData, activitiesData, vehiclesData }) {
    this.ui = ui;
    this.clock = { day: 1, hour: 0, minute: 0 };
    this.rate = 2000; // ms per in-game hour (accelerated)
    this.paused = false;
    this._acc = 0;

    this.player = createPlayer();

    this.districts = districtsData.map(d => ({
      id: d.id,
      name: d.name,
      layer: d.layer,
      control: { corps: 0.7, gangs: 0.2, wild: 0.1 },
      crime: 0.35,
      drones: 0.4,
      unrest: 0.25,
      safety: 0.6,
      visuals: d.visuals,
    }));

    this.factions = new FactionSystem(factionsData);
    this.activities = new ActivitySystem(activitiesData);

    this.listeners = { log: [], tick: [] };

    // Start ticking
    this._timer = setInterval(() => { if (!this.paused) this.stepHour(); }, this.rate);
  }

  init() {
    this.log('Welcome to Neovale.');
    this.log('Ryker returns as a wanted man.');
  }

  on(event, cb) {
    this.listeners[event].push(cb);
  }

  emit(event, payload) {
    for (const cb of this.listeners[event]) cb(payload);
  }

  nowString() {
    const d = this.clock;
    const hh = String(d.hour).padStart(2, '0');
    return `Day ${d.day} — ${hh}:00`;
  }

  togglePause() { this.paused = !this.paused; }

  stepHour() {
    // Advance clock
    this.clock.hour += 1;
    if (this.clock.hour >= 24) { this.clock.hour = 0; this.clock.day += 1; }
    this.emit('tick', this.clock);

    // Reactive ecosystem changes based on player reputation and last choices
    this.applyReactiveRules();

    // Generate contextual activities
    this.activities.generate(this);
  }

  applyReactiveRules() {
    const p = this.player;

    // Example systemic levers influenced by player alignment
    const alignment = p.alignment; // 'savior' | 'tyrant' | 'ghost'

    for (const d of this.districts) {
      // Baseline drift
      d.crime = clamp01(d.crime + randn(0, 0.02));
      d.drones = clamp01(d.drones + randn(0, 0.02));
      d.unrest = clamp01(d.unrest + randn(0, 0.02));

      // Alignment effects
      if (alignment === 'savior') {
        d.crime = clamp01(d.crime - 0.05);
        d.safety = clamp01(d.safety + 0.05);
        d.drones = clamp01(d.drones + 0.02); // more surveillance when you expose corruption
      } else if (alignment === 'tyrant') {
        d.crime = clamp01(d.crime + 0.06);
        d.unrest = clamp01(d.unrest + 0.05);
        d.safety = clamp01(d.safety - 0.04);
      } else if (alignment === 'ghost') {
        d.drones = clamp01(d.drones + 0.04); // corps respond
        d.crime = clamp01(d.crime - 0.02); // subtle order emerges
      }

      // Police/weakened enforcement lever via reputation against corps/gangs
      const corpPressure = this.factions.getPower('Dominion Corps');
      const gangPressure = this.factions.getPower('Ember Syndicate') + this.factions.getPower('VoltBlock Crew');

      if (corpPressure > 0.6) {
        d.drones = clamp01(d.drones + 0.03);
        d.crime = clamp01(d.crime - 0.02);
      }
      if (gangPressure > 1.0) {
        d.crime = clamp01(d.crime + 0.05);
        d.safety = clamp01(d.safety - 0.03);
      }

      // Visual evolution score (for map tinting)
      const order = d.safety + (1 - d.unrest) + (1 - d.crime) + (1 - d.drones);
      d.visualScore = clamp01(order / 4);
    }

    // Log notable changes hourly
    const hot = this.districts.filter(d => d.crime > 0.65 || d.unrest > 0.65);
    if (hot.length) this.log(`${hot.map(h => h.name).join(', ')} destabilizing.`);

    // Faction dynamics
    this.factions.tick(this);
  }

  act(actionId) {
    // Major choice stances
    if (actionId === 'public_savior') this.player.alignment = 'savior';
    if (actionId === 'tyrant_takeover') this.player.alignment = 'tyrant';
    if (actionId === 'ghost_influence') this.player.alignment = 'ghost';

    // Apply immediate narrative ripple
    if (actionId === 'public_savior') this.log('Ryker leaks evidence of corporate abuse. Citizens rally.');
    if (actionId === 'tyrant_takeover') this.log('Ryker seizes assets and intimidates gang lieutenants.');
    if (actionId === 'ghost_influence') this.log('Ryker puppeteers key nodes from the shadows.');
  }

  log(msg) {
    const time = this.nowString();
    this.emit('log', { time, msg });
  }
}

export function clamp01(x) { return Math.max(0, Math.min(1, x)); }
export function randn(mean = 0, std = 1) {
  // Gaussian via Box-Muller
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}
