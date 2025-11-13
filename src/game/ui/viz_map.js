export function renderMap(world) {
  const canvas = document.getElementById('mapCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  ctx.clearRect(0, 0, W, H);
  ctx.save();

  // Background grid
  ctx.strokeStyle = 'rgba(100,150,255,0.12)';
  ctx.lineWidth = 1;
  for (let x=20; x<W; x+=20) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for (let y=20; y<H; y+=20) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

  // Draw districts stacked
  const pad = 20; const blockH = (H - pad*4)/3;
  const districts = world.districts;
  const colors = { chrome: '#00f5d4', rust: '#ff6b6b', under: '#7b5cff' };

  for (let i=0;i<districts.length;i++) {
    const d = districts[i];
    const y = pad + i*(blockH + pad);

    const color = d.layer==='upper'?colors.chrome:d.layer==='mid'?colors.rust:colors.under;

    // Visual evol: use visualScore to modulate color brightness
    const alpha = 0.3 + 0.4 * d.visualScore;

    roundedRect(ctx, pad, y, W - pad*2, blockH, 14);
    ctx.fillStyle = hexToRgba(color, alpha);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(color, 0.8);
    ctx.lineWidth = 2;
    ctx.stroke();

    // Name
    ctx.font = 'bold 16px Orbitron, sans-serif';
    ctx.fillStyle = 'rgba(230,240,255,0.95)';
    ctx.fillText(d.name, pad + 12, y + 24);

    // Bars
    const bars = [
      ['Crime', d.crime, '#ff5566'],
      ['Drones', d.drones, '#19e3ff'],
      ['Unrest', d.unrest, '#ffd166'],
      ['Safety', d.safety, '#5df7a4']
    ];
    const bw = (W - pad*2 - 24); const bh = 10; const bx = pad + 12; let by = y + 44;
    for (const [label,val,clr] of bars) {
      roundedRect(ctx, bx, by, bw, bh, 6); ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fill();
      roundedRect(ctx, bx, by, bw*val, bh, 6); ctx.fillStyle = hexToRgba(clr, 0.9); ctx.fill();
      ctx.font = '11px Inter, sans-serif'; ctx.fillStyle = 'rgba(180,200,240,0.9)';
      ctx.fillText(`${label}`, bx, by - 2);
      by += 24;
    }
  }

  ctx.restore();
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
}
function hexToRgba(hex, a){
  const v = hex.replace('#','');
  const r=parseInt(v.slice(0,2),16), g=parseInt(v.slice(2,4),16), b=parseInt(v.slice(4,6),16);
  return `rgba(${r},${g},${b},${a})`;
}
