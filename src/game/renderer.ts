import { GameEngineState } from './engine';
import { Enemy, Platform } from '../types/game';

export function renderGame(
  ctx: CanvasRenderingContext2D,
  state: GameEngineState,
  width: number,
  height: number
) {
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // Screen shake application
  let shakeX = 0;
  let shakeY = 0;
  if (state.screenShake > 0) {
    shakeX = (Math.random() - 0.5) * state.screenShake * 2;
    shakeY = (Math.random() - 0.5) * state.screenShake * 2;
  }

  // --- 1. Background Layers (Parallax) ---
  drawParallaxBackground(ctx, state, width, height);

  // Apply camera transformation
  ctx.save();
  ctx.translate(-state.camera.x + shakeX, -state.camera.y + shakeY);

  // --- 2. Level Platforms & Environment ---
  drawPlatforms(ctx, state);

  // --- 3. Hazards (Lava, Spikes, Jets) ---
  drawHazards(ctx, state);

  // --- 4. Checkpoints & Level Goal ---
  drawCheckpoints(ctx, state);
  drawLevelGoal(ctx, state);

  // --- 5. Collectibles ---
  drawCollectibles(ctx, state);

  // --- 6. Enemies & Enemy Projectiles ---
  drawEnemies(ctx, state);
  drawEnemyProjectiles(ctx, state);

  // --- 7. Fireballs ---
  drawFireballs(ctx, state);

  // --- 8. The Player (Ember Knight) ---
  drawPlayer(ctx, state);

  // --- 9. Particles ---
  drawParticles(ctx, state);

  // --- 10. Floating Combat Texts ---
  drawFloatingTexts(ctx, state);

  ctx.restore(); // Restore camera translation

  // --- 11. Boss Health Bar (if Boss is in level and alive) ---
  drawBossHealthBar(ctx, state, width);

  ctx.restore();
}

function drawParallaxBackground(
  ctx: CanvasRenderingContext2D,
  state: GameEngineState,
  w: number,
  h: number
) {
  const theme = state.level.theme;

  // Sky Gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  if (theme === 'FOREST') {
    skyGrad.addColorStop(0, '#07130e');
    skyGrad.addColorStop(0.5, '#0c241b');
    skyGrad.addColorStop(1, '#133a2b');
  } else if (theme === 'CAVERN') {
    skyGrad.addColorStop(0, '#150604');
    skyGrad.addColorStop(0.5, '#2e0e09');
    skyGrad.addColorStop(1, '#4a150c');
  } else {
    // CITADEL
    skyGrad.addColorStop(0, '#0a0614');
    skyGrad.addColorStop(0.5, '#190e2b');
    skyGrad.addColorStop(1, '#2c1547');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // Moon / Sun in sky
  ctx.save();
  const celestialX = w * 0.8 - (state.camera.x * 0.03) % (w * 1.5);
  const celestialY = h * 0.22;
  const sunGrad = ctx.createRadialGradient(celestialX, celestialY, 5, celestialX, celestialY, 50);
  if (theme === 'FOREST') {
    sunGrad.addColorStop(0, '#fef08a');
    sunGrad.addColorStop(0.3, 'rgba(253, 224, 71, 0.4)');
    sunGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
  } else {
    sunGrad.addColorStop(0, '#fbbf24');
    sunGrad.addColorStop(0.4, 'rgba(249, 115, 22, 0.4)');
    sunGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
  }
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(celestialX, celestialY, 50, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Distant Mountain Silhouette (Scroll speed 0.15)
  ctx.save();
  ctx.fillStyle = state.level.parallexColor1;
  const mOffset = (state.camera.x * 0.12) % 600;
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = -600; x < w + 600; x += 300) {
    const px = x - mOffset;
    ctx.lineTo(px, h - 220);
    ctx.lineTo(px + 150, h - 380);
    ctx.lineTo(px + 300, h - 220);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Midground Ruins / Pillars (Scroll speed 0.35)
  ctx.save();
  ctx.fillStyle = state.level.parallexColor2;
  const pOffset = (state.camera.x * 0.28) % 400;
  for (let x = -400; x < w + 400; x += 220) {
    const px = x - pOffset;
    ctx.fillRect(px, h - 260, 45, 260);
    // Archway connecting
    ctx.fillRect(px - 20, h - 275, 85, 18);
  }
  ctx.restore();

  // Ambient floating dust / embers
  ctx.save();
  const time = state.timeSeconds;
  ctx.fillStyle = theme === 'FOREST' ? 'rgba(74, 222, 128, 0.3)' : 'rgba(249, 115, 22, 0.4)';
  for (let i = 0; i < 20; i++) {
    const ex = ((i * 97 + time * (15 + i * 2)) % w);
    const ey = ((i * 53 + Math.sin(time + i) * 30 + h) % h);
    ctx.beginPath();
    ctx.arc(ex, ey, 1.5 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPlatforms(ctx: CanvasRenderingContext2D, state: GameEngineState) {
  const theme = state.level.theme;

  for (const plat of state.platforms) {
    if (plat.isDestroyed) continue;

    // View frustum check
    if (
      plat.x + plat.w < state.camera.x - 50 ||
      plat.x > state.camera.x + ctx.canvas.width + 50
    ) {
      continue;
    }

    if (plat.type === 'BOUNCY_MUSHROOM') {
      drawMushroom(ctx, plat);
      continue;
    }

    if (plat.type === 'CRACKED_WALL') {
      drawCrackedWall(ctx, plat);
      continue;
    }

    if (plat.type === 'ONE_WAY') {
      drawOneWayPlatform(ctx, plat, theme);
      continue;
    }

    // Standard Solid & Moving Platforms
    ctx.save();
    let baseColor = '#1e293b';
    let topColor = '#334155';
    let trimColor = '#64748b';

    if (theme === 'FOREST') {
      baseColor = '#1c2e24';
      topColor = '#2d4a3b';
      trimColor = '#22c55e'; // Moss
    } else if (theme === 'CAVERN') {
      baseColor = '#281310';
      topColor = '#451e19';
      trimColor = '#f97316'; // Hot rock trim
    } else {
      baseColor = '#1a1028';
      topColor = '#321c4e';
      trimColor = '#a855f7'; // Runic purple
    }

    if (plat.type === 'MOVING') {
      baseColor = '#334155';
      topColor = '#475569';
      trimColor = '#38bdf8'; // Blue energy trim for moving
    }

    // Platform Body
    ctx.fillStyle = baseColor;
    ctx.fillRect(plat.x, plat.y, plat.w, plat.h);

    // Platform Top slab
    ctx.fillStyle = topColor;
    ctx.fillRect(plat.x, plat.y, plat.w, Math.min(12, plat.h));

    // Platform Surface Trim / Moss / Rune
    ctx.fillStyle = trimColor;
    ctx.fillRect(plat.x, plat.y, plat.w, 4);

    // Brick detailing
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1.5;
    for (let bx = plat.x + 30; bx < plat.x + plat.w; bx += 40) {
      ctx.beginPath();
      ctx.moveTo(bx, plat.y + 4);
      ctx.lineTo(bx, plat.y + Math.min(24, plat.h));
      ctx.stroke();
    }

    // Gear indicator for moving platform
    if (plat.type === 'MOVING') {
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(plat.x + 14, plat.y + plat.h / 2, 5, 0, Math.PI * 2);
      ctx.arc(plat.x + plat.w - 14, plat.y + plat.h / 2, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

function drawMushroom(ctx: CanvasRenderingContext2D, plat: Platform) {
  ctx.save();
  const mx = plat.x + plat.w / 2;
  const my = plat.y + plat.h;

  // Mushroom stem
  ctx.fillStyle = '#f1f5f9';
  ctx.beginPath();
  ctx.rect(mx - 8, my - 16, 16, 16);
  ctx.fill();

  // Bouncy cap (red with white dots)
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(mx, my - 14, 24, Math.PI, 0);
  ctx.fill();

  // White polka dots
  ctx.fillStyle = '#ffffff';
  [-12, 0, 12].forEach((ox) => {
    ctx.beginPath();
    ctx.arc(mx + ox, my - 24, 3.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // Spring glow effect
  ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
  ctx.beginPath();
  ctx.arc(mx, my - 16, 28, Math.PI, 0);
  ctx.fill();

  ctx.restore();
}

function drawCrackedWall(ctx: CanvasRenderingContext2D, plat: Platform) {
  ctx.save();
  ctx.fillStyle = '#44403c';
  ctx.fillRect(plat.x, plat.y, plat.w, plat.h);

  // Glowing red/amber fissure lines
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(plat.x + 6, plat.y + 10);
  ctx.lineTo(plat.x + 22, plat.y + 35);
  ctx.lineTo(plat.x + 10, plat.y + 70);
  ctx.lineTo(plat.x + 24, plat.y + 105);
  ctx.stroke();

  // Warning icon
  ctx.fillStyle = '#fbbf24';
  ctx.font = '10px monospace';
  ctx.fillText('CRACK', plat.x + 2, plat.y + plat.h / 2);

  ctx.restore();
}

function drawOneWayPlatform(
  ctx: CanvasRenderingContext2D,
  plat: Platform,
  theme: string
) {
  ctx.save();
  ctx.fillStyle = theme === 'FOREST' ? '#4d3319' : theme === 'CAVERN' ? '#5c2c16' : '#332047';
  ctx.fillRect(plat.x, plat.y, plat.w, plat.h);

  ctx.fillStyle = theme === 'FOREST' ? '#84cc16' : theme === 'CAVERN' ? '#fb923c' : '#c084fc';
  ctx.fillRect(plat.x, plat.y, plat.w, 3);

  // Wooden plank lines
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1;
  for (let px = plat.x + 20; px < plat.x + plat.w; px += 24) {
    ctx.beginPath();
    ctx.moveTo(px, plat.y);
    ctx.lineTo(px, plat.y + plat.h);
    ctx.stroke();
  }
  ctx.restore();
}

function drawHazards(ctx: CanvasRenderingContext2D, state: GameEngineState) {
  for (const h of state.hazards) {
    ctx.save();
    if (h.type === 'SPIKES') {
      ctx.fillStyle = '#94a3b8';
      const spikeWidth = 16;
      const count = Math.ceil(h.w / spikeWidth);
      for (let i = 0; i < count; i++) {
        const sx = h.x + i * spikeWidth;
        ctx.beginPath();
        ctx.moveTo(sx, h.y + h.h);
        ctx.lineTo(sx + spikeWidth / 2, h.y);
        ctx.lineTo(sx + spikeWidth, h.y + h.h);
        ctx.closePath();
        ctx.fill();
        // Red tip
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(sx + 4, h.y + 8);
        ctx.lineTo(sx + spikeWidth / 2, h.y);
        ctx.lineTo(sx + spikeWidth - 4, h.y + 8);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#94a3b8';
      }
    } else if (h.type === 'LAVA') {
      const lavaGrad = ctx.createLinearGradient(0, h.y, 0, h.y + h.h);
      lavaGrad.addColorStop(0, '#f97316');
      lavaGrad.addColorStop(0.3, '#dc2626');
      lavaGrad.addColorStop(1, '#7f1d1d');
      ctx.fillStyle = lavaGrad;
      ctx.fillRect(h.x, h.y, h.w, h.h);

      // Animated lava surface waves
      const t = state.timeSeconds * 4;
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.moveTo(h.x, h.y);
      for (let x = 0; x <= h.w; x += 15) {
        ctx.lineTo(h.x + x, h.y + Math.sin(t + x * 0.08) * 4);
      }
      ctx.lineTo(h.x + h.w, h.y + h.h);
      ctx.lineTo(h.x, h.y + h.h);
      ctx.closePath();
      ctx.fill();
    } else if (h.type === 'FIRE_JET') {
      // Fire jet hazard
      ctx.fillStyle = '#475569';
      ctx.fillRect(h.x, h.y + h.h - 12, h.w, 12);

      // Jet flame
      const flameH = h.h - 12;
      const fGrad = ctx.createLinearGradient(0, h.y, 0, h.y + flameH);
      fGrad.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
      fGrad.addColorStop(0.5, 'rgba(249, 115, 22, 0.8)');
      fGrad.addColorStop(1, 'rgba(220, 38, 38, 0)');
      ctx.fillStyle = fGrad;
      ctx.beginPath();
      ctx.moveTo(h.x, h.y + flameH);
      ctx.lineTo(h.x + h.w / 2, h.y);
      ctx.lineTo(h.x + h.w, h.y + flameH);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawCheckpoints(ctx: CanvasRenderingContext2D, state: GameEngineState) {
  for (const cp of state.level.checkpoints) {
    ctx.save();
    // Shrine stone base
    ctx.fillStyle = '#334155';
    ctx.fillRect(cp.x + 4, cp.y + 40, cp.w - 8, 20);
    ctx.fillRect(cp.x, cp.y + 52, cp.w, 8);

    // Stone brazier bowl
    ctx.beginPath();
    ctx.arc(cp.x + cp.w / 2, cp.y + 40, 14, 0, Math.PI);
    ctx.fill();

    // Bonfire flame (blue if active, dim gray if unlit)
    if (cp.activated) {
      const t = state.timeSeconds * 6;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(cp.x + cp.w / 2, cp.y + 28 + Math.sin(t) * 2, 10, 0, Math.PI * 2);
      ctx.fill();

      // Flame core
      ctx.fillStyle = '#f0f9ff';
      ctx.beginPath();
      ctx.arc(cp.x + cp.w / 2, cp.y + 28 + Math.sin(t) * 2, 5, 0, Math.PI * 2);
      ctx.fill();

      // Halo
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.beginPath();
      ctx.arc(cp.x + cp.w / 2, cp.y + 28, 22, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(cp.x + cp.w / 2, cp.y + 36, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawLevelGoal(ctx: CanvasRenderingContext2D, state: GameEngineState) {
  const g = state.level.goal;
  ctx.save();

  // Stone pillars of portal
  ctx.fillStyle = '#312e81';
  ctx.fillRect(g.x, g.y, 10, g.h);
  ctx.fillRect(g.x + g.w - 10, g.y, 10, g.h);
  ctx.fillRect(g.x, g.y, g.w, 12);

  // Swirling portal vortex
  const t = state.timeSeconds * 3;
  const portalGrad = ctx.createRadialGradient(
    g.x + g.w / 2,
    g.y + g.h / 2,
    5,
    g.x + g.w / 2,
    g.y + g.h / 2,
    g.w / 2
  );
  portalGrad.addColorStop(0, '#fef08a');
  portalGrad.addColorStop(0.5, '#6366f1');
  portalGrad.addColorStop(1, '#312e81');

  ctx.fillStyle = portalGrad;
  ctx.beginPath();
  ctx.ellipse(g.x + g.w / 2, g.y + g.h / 2, g.w / 2 - 10, g.h / 2 - 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Orbiting light motes
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 4; i++) {
    const angle = t + (i * Math.PI) / 2;
    const px = g.x + g.w / 2 + Math.cos(angle) * (g.w / 2 - 14);
    const py = g.y + g.h / 2 + Math.sin(angle) * (g.h / 2 - 14);
    ctx.beginPath();
    ctx.arc(px, py, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawCollectibles(ctx: CanvasRenderingContext2D, state: GameEngineState) {
  const t = state.timeSeconds;

  for (const c of state.collectibles) {
    if (c.collected) continue;

    const floatY = c.y + Math.sin(t * 3 + c.floatOffset) * 4;
    ctx.save();

    if (c.type === 'COIN') {
      // Spinning gold coin
      const spinScale = Math.abs(Math.cos(t * 4 + c.floatOffset));
      ctx.translate(c.x + c.w / 2, floatY + c.h / 2);
      ctx.scale(Math.max(0.15, spinScale), 1);

      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(0, 0, c.w / 2, 0, Math.PI * 2);
      ctx.fill();

      // Inner rim
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Sun rune
      ctx.fillStyle = '#713f12';
      ctx.fillRect(-2, -2, 4, 4);
    } else if (c.type === 'EMBER_GEM') {
      // Glowing Cyan Diamond
      ctx.translate(c.x + c.w / 2, floatY + c.h / 2);
      ctx.rotate(Math.sin(t * 2) * 0.1);

      // Outer glow
      ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.beginPath();
      ctx.arc(0, 0, c.w * 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Gem shape
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(0, -c.h / 2);
      ctx.lineTo(c.w / 2, 0);
      ctx.lineTo(0, c.h / 2);
      ctx.lineTo(-c.w / 2, 0);
      ctx.closePath();
      ctx.fill();

      // Specular highlight
      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      ctx.moveTo(0, -c.h / 2);
      ctx.lineTo(c.w / 4, 0);
      ctx.lineTo(0, -2);
      ctx.closePath();
      ctx.fill();
    } else if (c.type === 'HEART') {
      // Ruby Heart
      const scale = 1 + Math.sin(t * 6) * 0.1;
      ctx.translate(c.x + c.w / 2, floatY + c.h / 2);
      ctx.scale(scale, scale);

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      const r = c.w / 2;
      ctx.moveTo(0, r * 0.6);
      ctx.bezierCurveTo(r, -r * 0.4, r * 0.8, -r * 0.9, 0, -r * 0.3);
      ctx.bezierCurveTo(-r * 0.8, -r * 0.9, -r, -r * 0.4, 0, r * 0.6);
      ctx.fill();
    } else if (c.type.startsWith('POWERUP')) {
      // Flaming Orb Powerup
      ctx.translate(c.x + c.w / 2, floatY + c.h / 2);
      const isMega = c.type === 'POWERUP_MEGA';

      // Revolving fire aura
      ctx.fillStyle = isMega ? '#ef4444' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, 0, c.w / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, 0, c.w / 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

function drawEnemies(ctx: CanvasRenderingContext2D, state: GameEngineState) {
  for (const e of state.enemies) {
    if (e.isDead) continue;
    ctx.save();

    // Hurt flash
    if (e.hurtTimer > 0 && Math.floor(state.timeSeconds * 20) % 2 === 0) {
      ctx.filter = 'brightness(2.5)';
    }

    if (e.type === 'SLIME') {
      drawSlime(ctx, e, state.timeSeconds);
    } else if (e.type === 'BAT') {
      drawBat(ctx, e, state.timeSeconds);
    } else if (e.type === 'GOLEM') {
      drawGolem(ctx, e, state.timeSeconds);
    } else if (e.type === 'FLAME_SPITTER') {
      drawFlameSpitter(ctx, e);
    } else if (e.type === 'BOSS_WYRM') {
      drawBossWyrm(ctx, e, state.timeSeconds);
    }

    ctx.restore();
  }
}

function drawSlime(ctx: CanvasRenderingContext2D, e: Enemy, time: number) {
  const cx = e.x + e.w / 2;
  const cy = e.y + e.h;
  const squish = Math.sin(time * 6 + e.x) * 0.15;

  ctx.translate(cx, cy);
  ctx.scale(1 + squish, 1 - squish);

  // Slime body
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.arc(0, -e.h / 2, e.w / 2, Math.PI, 0);
  ctx.lineTo(e.w / 2, 0);
  ctx.lineTo(-e.w / 2, 0);
  ctx.closePath();
  ctx.fill();

  // Darker core
  ctx.fillStyle = '#16a34a';
  ctx.beginPath();
  ctx.arc(0, -e.h / 3, e.w / 3, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  const lookDir = e.facing === 'right' ? 3 : -3;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-5 + lookDir, -e.h / 2, 3.5, 0, Math.PI * 2);
  ctx.arc(5 + lookDir, -e.h / 2, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(-5 + lookDir * 1.5, -e.h / 2, 1.8, 0, Math.PI * 2);
  ctx.arc(5 + lookDir * 1.5, -e.h / 2, 1.8, 0, Math.PI * 2);
  ctx.fill();
}

function drawBat(ctx: CanvasRenderingContext2D, e: Enemy, time: number) {
  const cx = e.x + e.w / 2;
  const cy = e.y + e.h / 2;
  const wingAngle = Math.sin(time * 12) * 0.5;

  ctx.translate(cx, cy);

  // Bat wings
  ctx.fillStyle = '#991b1b';
  [-1, 1].forEach((dir) => {
    ctx.save();
    ctx.scale(dir, 1);
    ctx.rotate(wingAngle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(16, -10);
    ctx.lineTo(20, 4);
    ctx.lineTo(10, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });

  // Bat body & ears
  ctx.fillStyle = '#7f1d1d';
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();

  // Red glowing eyes
  const lookDir = e.facing === 'right' ? 2 : -2;
  ctx.fillStyle = '#f87171';
  ctx.beginPath();
  ctx.arc(-2 + lookDir, -2, 2, 0, Math.PI * 2);
  ctx.arc(2 + lookDir, -2, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawGolem(ctx: CanvasRenderingContext2D, e: Enemy, _time: number) {
  const cx = e.x + e.w / 2;
  const cy = e.y + e.h / 2;

  ctx.translate(cx, cy);

  // Heavy stone armor body
  ctx.fillStyle = '#57534e';
  ctx.beginPath();
  ctx.roundRect(-e.w / 2, -e.h / 2, e.w, e.h, 6);
  ctx.fill();

  // Shoulder plates
  ctx.fillStyle = '#78716c';
  ctx.fillRect(-e.w / 2 - 4, -e.h / 2, 8, 14);
  ctx.fillRect(e.w / 2 - 4, -e.h / 2, 8, 14);

  // Fiery magma core visor slit
  ctx.fillStyle = '#f97316';
  ctx.fillRect(-10, -8, 20, 6);
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(-5, -6, 10, 3);
}

function drawFlameSpitter(ctx: CanvasRenderingContext2D, e: Enemy) {
  // Carved stone head turret
  ctx.fillStyle = '#475569';
  ctx.fillRect(e.x, e.y, e.w, e.h);

  // Open mouth cannon
  ctx.fillStyle = '#0f172a';
  const mouthX = e.facing === 'right' ? e.x + e.w - 10 : e.x;
  ctx.fillRect(mouthX, e.y + 12, 10, 16);

  // Glowing red eye
  ctx.fillStyle = '#ef4444';
  const eyeX = e.facing === 'right' ? e.x + 18 : e.x + 8;
  ctx.beginPath();
  ctx.arc(eyeX, e.y + 8, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawBossWyrm(ctx: CanvasRenderingContext2D, boss: Enemy, time: number) {
  const cx = boss.x + boss.w / 2;
  const cy = boss.y + boss.h / 2;
  const phase = boss.bossPhase || 1;

  ctx.translate(cx, cy);
  if (boss.facing === 'left') ctx.scale(-1, 1);

  // Serpentine body segments
  for (let i = 3; i >= 0; i--) {
    const segX = -i * 20;
    const segY = Math.sin(time * 4 + i) * 6;
    ctx.fillStyle = phase === 3 ? '#991b1b' : '#7f1d1d';
    ctx.beginPath();
    ctx.arc(segX, segY, 32 - i * 4, 0, Math.PI * 2);
    ctx.fill();

    // Spines on back
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(segX - 5, segY - 26 + i * 3);
    ctx.lineTo(segX, segY - 40 + i * 3);
    ctx.lineTo(segX + 5, segY - 26 + i * 3);
    ctx.closePath();
    ctx.fill();
  }

  // Wyrm Head
  ctx.fillStyle = phase === 3 ? '#b91c1c' : '#991b1b';
  ctx.beginPath();
  ctx.ellipse(15, 0, 32, 24, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Glowing Horns
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(8, -46);
  ctx.lineTo(16, -18);
  ctx.closePath();
  ctx.fill();

  // Fiery Maw
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.arc(36, 4, 8, 0, Math.PI * 2);
  ctx.fill();

  // Eye
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(18, -8, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(20, -8, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawEnemyProjectiles(ctx: CanvasRenderingContext2D, state: GameEngineState) {
  for (const proj of state.enemyProjectiles) {
    ctx.save();
    ctx.fillStyle = proj.color;
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
    ctx.fill();

    // Core
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, proj.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawFireballs(ctx: CanvasRenderingContext2D, state: GameEngineState) {
  for (const fb of state.fireballs) {
    ctx.save();

    // Tail particles
    for (const tp of fb.tailParticles) {
      ctx.fillStyle = tp.color;
      ctx.globalAlpha = Math.max(0, tp.alpha);
      ctx.beginPath();
      ctx.arc(tp.x, tp.y, tp.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    // Outer glow
    const glowGrad = ctx.createRadialGradient(
      fb.x,
      fb.y,
      fb.radius * 0.2,
      fb.x,
      fb.y,
      fb.radius * 2
    );
    glowGrad.addColorStop(0, fb.color);
    glowGrad.addColorStop(0.6, 'rgba(249, 115, 22, 0.4)');
    glowGrad.addColorStop(1, 'rgba(249, 115, 22, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(fb.x, fb.y, fb.radius * 2, 0, Math.PI * 2);
    ctx.fill();

    // Core sphere
    ctx.fillStyle = fb.color;
    ctx.beginPath();
    ctx.arc(fb.x, fb.y, fb.radius, 0, Math.PI * 2);
    ctx.fill();

    // Pure white/yellow hot center
    ctx.fillStyle = '#fffbeb';
    ctx.beginPath();
    ctx.arc(fb.x, fb.y, fb.radius * 0.55, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

function drawPlayer(ctx: CanvasRenderingContext2D, state: GameEngineState) {
  const p = state.player;
  ctx.save();

  // Invulnerability flashing
  if (p.isInvulnerable && Math.floor(state.timeSeconds * 25) % 2 === 0) {
    ctx.globalAlpha = 0.45;
  }

  const cx = p.x + p.w / 2;
  const cy = p.y + p.h;

  ctx.translate(cx, cy);
  ctx.scale(
    (p.facing === 'right' ? 1 : -1) * p.squashStretch.x,
    p.squashStretch.y
  );

  // Charging Aura
  if (p.isCharging) {
    const chargeRatio = Math.min(1, p.chargeTime / 0.6);
    ctx.save();
    ctx.strokeStyle = chargeRatio >= 1 ? '#ef4444' : '#f59e0b';
    ctx.lineWidth = 2 + chargeRatio * 3;
    ctx.beginPath();
    ctx.arc(0, -p.h / 2, 26 + Math.sin(state.timeSeconds * 16) * 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Flowing Cloak
  const windOffset = Math.sin(state.timeSeconds * 10 + (p.vx !== 0 ? p.runCycle : 0)) * 6;
  ctx.fillStyle = '#991b1b'; // Crimson cloak
  ctx.beginPath();
  ctx.moveTo(-6, -p.h + 16);
  ctx.lineTo(-18 - windOffset - Math.abs(p.vx) * 2, -10);
  ctx.lineTo(-12, -4);
  ctx.lineTo(-4, -p.h + 20);
  ctx.closePath();
  ctx.fill();

  // Legs & Boots
  const legCycle = Math.sin(p.runCycle) * 7;
  ctx.fillStyle = '#334155'; // Dark armor legs
  if (p.grounded && p.vx !== 0) {
    ctx.fillRect(-6 + legCycle, -14, 5, 14);
    ctx.fillRect(3 - legCycle, -14, 5, 14);
  } else {
    ctx.fillRect(-6, -14, 5, 14);
    ctx.fillRect(2, -14, 5, 14);
  }

  // Torso & Gold Runic Breastplate
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-8, -p.h + 16, 16, 20);

  ctx.fillStyle = '#fbbf24'; // Gold rune
  ctx.beginPath();
  ctx.moveTo(0, -p.h + 20);
  ctx.lineTo(4, -p.h + 26);
  ctx.lineTo(0, -p.h + 32);
  ctx.lineTo(-4, -p.h + 26);
  ctx.closePath();
  ctx.fill();

  // Arms & Fireball casting pose
  ctx.fillStyle = '#334155';
  if (p.isCasting) {
    // Cast arm thrust forward
    ctx.fillRect(4, -p.h + 20, 16, 5);
    // Glow at hand
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(20, -p.h + 22, 5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillRect(4, -p.h + 20, 5, 14);
  }

  // Helmet / Cowl
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(0, -p.h + 10, 10, 0, Math.PI * 2);
  ctx.fill();

  // Glowing Visor Eyes (Amber / Flame)
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(2, -p.h + 8, 7, 3.5);

  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, state: GameEngineState) {
  for (const part of state.particles) {
    ctx.save();
    ctx.fillStyle = part.color;
    ctx.globalAlpha = part.alpha;
    ctx.beginPath();
    ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawFloatingTexts(ctx: CanvasRenderingContext2D, state: GameEngineState) {
  for (const ft of state.floatingTexts) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, ft.alpha);
    ctx.fillStyle = ft.color;
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    // Dark stroke outline for clarity
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeText(ft.text, ft.x, ft.y);
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  }
}

function drawBossHealthBar(
  ctx: CanvasRenderingContext2D,
  state: GameEngineState,
  viewW: number
) {
  const boss = state.enemies.find((e) => e.type === 'BOSS_WYRM');
  if (!boss || boss.isDead) return;

  const barW = Math.min(480, viewW - 60);
  const barH = 16;
  const barX = (viewW - barW) / 2;
  const barY = 24;

  ctx.save();

  // Title
  ctx.font = 'bold 12px Cinzel, serif';
  ctx.fillStyle = '#fbbf24';
  ctx.textAlign = 'center';
  ctx.fillText('IGNIS WYRM — GUARDIAN OF THE CORE', viewW / 2, barY - 8);

  // Background box
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.5;
  ctx.fillRect(barX, barY, barW, barH);
  ctx.strokeRect(barX, barY, barW, barH);

  // Fill ratio
  const ratio = Math.max(0, boss.health / boss.maxHealth);
  const hpGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
  hpGrad.addColorStop(0, '#ef4444');
  hpGrad.addColorStop(0.5, '#f97316');
  hpGrad.addColorStop(1, '#fde047');

  ctx.fillStyle = hpGrad;
  ctx.fillRect(barX + 2, barY + 2, (barW - 4) * ratio, barH - 4);

  // Text inside
  ctx.font = 'bold 10px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`${boss.health} / ${boss.maxHealth} HP`, viewW / 2, barY + 12);

  ctx.restore();
}
