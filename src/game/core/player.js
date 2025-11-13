export function createPlayer() {
  return {
    name: 'Ryker Vale',
    credits: 1200,
    heat: 0.2, // wanted level
    rep: {
      ember: 0.0,
      volt: 0.0,
      scorp: 0.0,
      biovex: 0.0,
      corps: 0.0,
    },
    alignment: 'ghost', // 'savior' | 'tyrant' | 'ghost'
    arm: {
      level: 1,
      mods: ['Shock Gloves'],
    },
    hacks: ['Vehicle Hijack', 'Traffic Tamper', 'Drone Puppet', 'ATM Siphon', 'Camera Scrub'],
    vehicles: [],
  };
}
