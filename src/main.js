import { loadWorld } from './game/core/world.js';
import { UI } from './game/ui/ui.js';
import { NeonScene } from './game/three/scene.js';

(async function start() {
  const ui = new UI();
  const world = await loadWorld({ ui });
  ui.bind(world);

  // 3D Scene
  const container = document.getElementById('threeContainer');
  const scene3D = new NeonScene(container);

  // Hook world tick to adjust scene state
  world.on('tick', () => {
    ui.render(world); // also updates panels per tick
    scene3D.updateFromWorld(world);
  });

  // Controls
  const pauseBtn = document.getElementById('pauseBtn');
  const stepBtn = document.getElementById('stepBtn');
  pauseBtn.addEventListener('click', () => {
    world.togglePause();
    pauseBtn.textContent = world.paused ? 'Resume' : 'Pause';
  });
  stepBtn.addEventListener('click', () => world.stepHour());

  // Render loop
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    // continuous UI small updates
    ui.render(world);

    // 3D
    scene3D.frame(dt);

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
