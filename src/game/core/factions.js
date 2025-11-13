export class FactionSystem {
  constructor(factionsData) {
    this.factions = factionsData.map(f => ({ ...f }));
  }

  getPower(name) {
    const f = this.factions.find(x => x.name === name);
    return f ? f.power : 0;
  }

  tick(world) {
    // Simple inter-faction dynamics reacting to player's alignment and district states
    const align = world.player.alignment;

    for (const f of this.factions) {
      let delta = 0;
      if (align === 'savior' && f.type === 'corp') delta -= 0.01;
      if (align === 'savior' && f.type === 'rebel') delta += 0.01;
      if (align === 'tyrant' && (f.type === 'gang' || f.type === 'merc')) delta += 0.02;
      if (align === 'ghost' && f.type === 'corp') delta += 0.01; // corps thrive on hidden control

      // District pressure: unrest helps gangs/rebels, safety helps corps
      const avgUnrest = avg(world.districts.map(d => d.unrest));
      const avgSafety = avg(world.districts.map(d => d.safety));
      if (f.type === 'gang' || f.type === 'rebel') delta += (avgUnrest - 0.4) * 0.02;
      if (f.type === 'corp') delta += (avgSafety - 0.5) * 0.02;

      // Clamp and apply
      f.power = clamp01((f.power ?? 0.5) + delta);
    }

    // Log dominant shifts
    const dominant = [...this.factions].sort((a,b) => b.power - a.power)[0];
    if (dominant && Math.random() < 0.2) {
      world.log(`${dominant.name} influence surges.`);
    }
  }
}

function avg(a){ return a.reduce((p,c)=>p+c,0)/Math.max(1,a.length); }
function clamp01(x){ return Math.max(0, Math.min(1, x)); }
