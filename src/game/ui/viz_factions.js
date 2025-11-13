export function renderFactions(world) {
  const el = document.getElementById('factionsPanel');
  const list = world.factions.factions;
  el.innerHTML = '';

  for (const f of list) {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
        <h4>${f.name}</h4>
        <span class="tag">${label(f.type)}</span>
      </div>
      <div class="meta">Power</div>
      <div style="background:#0a0f1f;border:1px solid #1b2a4a;border-radius:8px;height:10px;position:relative;">
        <div style="position:absolute;left:0;top:0;bottom:0;width:${(f.power*100)|0}%;background:linear-gradient(90deg,#19e3ff,#ff2fb9);border-radius:8px;"></div>
      </div>
    `;
    el.appendChild(div);
  }
}
function label(t){
  if (t==='corp') return 'Corporation';
  if (t==='gang') return 'Street Gang';
  if (t==='merc') return 'Mercenaries';
  if (t==='rebel') return 'Rebel Cult';
  return t;
}
