export class ActivitySystem {
  constructor(activitiesData) {
    this.base = activitiesData;
    this.active = [];
  }

  generate(world) {
    // Generate a few context-sensitive activities each hour
    const picks = [];
    for (const d of world.districts) {
      // pick activities whose tags match district state
      const candidates = this.base.filter(a => a.layers.includes(d.layer));

      // weight by crime/unrest/safety/drone level
      const weighted = candidates.map(a => ({
        a,
        w:
          (a.tags.includes('race') ? (0.3 + (1 - d.drones)) : 0) +
          (a.tags.includes('hack') ? (0.3 + d.drones) : 0) +
          (a.tags.includes('combat') ? (0.3 + d.unrest + d.crime) : 0) +
          (a.tags.includes('monster') ? (d.layer==='under' ? 0.6 + d.unrest : 0) : 0) +
          (a.tags.includes('sabotage') ? (0.2 + (1 - d.safety)) : 0)
      }));

      const choice = pickWeighted(weighted);
      if (choice) picks.push({ ...choice, district: d.id });
    }

    // Keep last N
    this.active = picks.slice(0, 9);
  }
}

function pickWeighted(list) {
  if (!list.length) return null;
  let sum = 0; for (const it of list) sum += it.w;
  if (sum <= 0) return list[Math.floor(Math.random()*list.length)].a;
  let r = Math.random() * sum;
  for (const it of list) { r -= it.w; if (r <= 0) return it.a; }
  return list[list.length-1].a;
}
