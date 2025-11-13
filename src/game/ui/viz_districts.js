export function renderDistricts(world) {
  const el = document.getElementById('districtPanel');
  el.innerHTML = '';
  for (const d of world.districts) {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
      <h4>${d.name}</h4>
      <div class="meta">Layer: ${layerName(d.layer)} • Visual score: ${(d.visualScore ?? 0.5).toFixed(2)}</div>
      <div class="state-row" style="margin-top:6px">
        ${stateChip('Crime', d.crime)}
        ${stateChip('Drones', d.drones)}
        ${stateChip('Unrest', d.unrest)}
        ${stateChip('Safety', d.safety, true)}
      </div>
    `;
    el.appendChild(div);
  }
}

function layerName(x){ return x==='upper'?'Chrome District':x==='mid'?'Rustline':'Underhollow'; }
function stateChip(name, val, invert=false){
  const good = invert ? val >= 0.5 : val < 0.5;
  return `<span class="state ${good?'good':'bad'}">${name}: ${(val*100)|0}%</span>`;
}
