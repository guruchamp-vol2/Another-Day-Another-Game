import { renderMap } from './viz_map.js';
import { renderPlayer } from './viz_player.js';
import { renderDistricts } from './viz_districts.js';
import { renderFactions } from './viz_factions.js';
import { renderActivities } from './viz_activities.js';

export class UI {
  bind(world) {
    const logPanel = document.getElementById('logPanel');
    const clock = document.getElementById('clock');

    world.on('log', ({ time, msg }) => {
      const div = document.createElement('div');
      div.className = 'entry';
      div.innerHTML = `<span class="time">${time}</span>${msg}`;
      logPanel.prepend(div);
    });

    world.on('tick', () => {
      clock.textContent = world.nowString();
    });

    // Bind player choice buttons
    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => world.act(btn.dataset.action));
    });

    this.world = world;
  }

  render(world) {
    // panels
    renderMap(world);
    renderPlayer(world);
    renderDistricts(world);
    renderFactions(world);
    renderActivities(world);

    // clock (in case of first frame)
    document.getElementById('clock').textContent = world.nowString();
  }
}
