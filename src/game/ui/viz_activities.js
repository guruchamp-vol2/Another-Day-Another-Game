export function renderActivities(world) {
  const el = document.getElementById('activitiesPanel');
  el.innerHTML = '';
  for (const a of world.activities.active) {
    const div = document.createElement('div');
    div.className = 'card';
    const d = world.districts.find(x => x.id === a.district);
    div.innerHTML = `
      <h4>${a.name}</h4>
      <div class="meta">${d?.name ?? 'Unknown'} • ${a.tags.join(' • ')}</div>
      <div style="margin-top:6px; font-size:12px; color:#b7c6e6">${a.desc}</div>
    `;
    el.appendChild(div);
  }
}
