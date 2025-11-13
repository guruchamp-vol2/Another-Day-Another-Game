export function renderPlayer(world) {
  const el = document.getElementById('playerPanel');
  const p = world.player;
  el.innerHTML = `
    <div class="kv">
      <div>Name</div><div>${p.name}</div>
      <div>Credits</div><div>₡ ${p.credits.toLocaleString()}</div>
      <div>Heat</div><div>${(p.heat*5).toFixed(1)} / 5</div>
      <div>Alignment</div><div class="tag">${cap(p.alignment)}</div>
      <div>Arm</div><div>Lv.${p.arm.level} — ${p.arm.mods.join(', ')}</div>
      <div>Hacks</div><div>${p.hacks.join(' • ')}</div>
    </div>
  `;
}
function cap(s){ return s[0].toUpperCase()+s.slice(1); }
