import {
  Collectible,
  Enemy,
  EnemyProjectile,
  Fireball,
  FloatingText,
  Hazard,
  KeyState,
  LevelData,
  Particle,
  Platform,
  Player,
  Vector2D,
} from '../types/game';
import { soundManager } from '../utils/audio';

export interface GameEngineState {
  player: Player;
  level: LevelData;
  platforms: Platform[];
  enemies: Enemy[];
  enemyProjectiles: EnemyProjectile[];
  fireballs: Fireball[];
  collectibles: Collectible[];
  hazards: Hazard[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  camera: Vector2D;
  screenShake: number;
  score: number;
  coins: number;
  gems: number;
  lives: number;
  timeSeconds: number;
  isLevelCleared: boolean;
  isGameOver: boolean;
  activeCheckpointPos: Vector2D | null;
  prevKeys?: KeyState;
}

const GRAVITY = 0.48;
const MAX_FALL_SPEED = 13.5;
const RUN_ACCEL = 0.9;
const RUN_MAX_SPEED = 5.5;
const FRICTION = 0.84;
const JUMP_FORCE = -13.0;
const DOUBLE_JUMP_FORCE = -11.5;
const CHARGE_TIME_REQUIRED = 0.55; // seconds

export function createInitialPlayer(start: Vector2D): Player {
  return {
    x: start.x,
    y: start.y,
    vx: 0,
    vy: 0,
    w: 32,
    h: 46,
    grounded: false,
    facing: 'right',
    health: 4,
    maxHealth: 4,
    mana: 100,
    maxMana: 100,
    isInvulnerable: false,
    invulnerableTimer: 0,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    doubleJumpAvailable: true,
    isCasting: false,
    castTimer: 0,
    chargeTime: 0,
    isCharging: false,
    isDashing: false,
    dashTimer: 0,
    dashCooldown: 0,
    currentPowerup: 'STANDARD',
    powerupTimeRemaining: 0,
    runCycle: 0,
    squashStretch: { x: 1, y: 1 },
    hasSteppedOffMushroom: true,
  };
}

export function initGameEngine(level: LevelData, initialLives = 3): GameEngineState {
  return {
    player: createInitialPlayer(level.playerStart),
    level: JSON.parse(JSON.stringify(level)),
    platforms: JSON.parse(JSON.stringify(level.platforms)),
    enemies: JSON.parse(JSON.stringify(level.enemies)),
    enemyProjectiles: [],
    fireballs: [],
    collectibles: JSON.parse(JSON.stringify(level.collectibles)),
    hazards: JSON.parse(JSON.stringify(level.hazards)),
    particles: [],
    floatingTexts: [],
    camera: { x: 0, y: 0 },
    screenShake: 0,
    score: 0,
    coins: 0,
    gems: 0,
    lives: Math.max(1, initialLives),
    timeSeconds: 0,
    isLevelCleared: false,
    isGameOver: false,
    activeCheckpointPos: null,
    prevKeys: {
      ArrowLeft: false,
      ArrowRight: false,
      ArrowUp: false,
      ArrowDown: false,
      Space: false,
      KeyA: false,
      KeyD: false,
      KeyW: false,
      KeyS: false,
      ShiftLeft: false,
    },
  };
}

export function updateEngine(
  state: GameEngineState,
  keys: KeyState,
  dt: number,
  viewWidth: number,
  viewHeight: number
): void {
  if (state.isLevelCleared || state.isGameOver) {
    return;
  }

  state.timeSeconds += dt;
  const p = state.player;

  // Flame Energy gradual auto-regeneration (20 energy per sec: 0 to 100 in 5s)
  if (p.mana < p.maxMana) {
    p.mana = Math.min(p.maxMana, p.mana + dt * 20);
  }

  // Powerup countdown
  if (p.powerupTimeRemaining > 0) {
    p.powerupTimeRemaining -= dt;
    if (p.powerupTimeRemaining <= 0) {
      p.currentPowerup = 'STANDARD';
      state.floatingTexts.push({
        id: Math.random().toString(),
        text: 'Power Expired',
        x: p.x,
        y: p.y - 20,
        vy: -1,
        alpha: 1,
        life: 1.2,
        color: '#94a3b8',
      });
    }
  }

  // Invulnerability timer
  if (p.invulnerableTimer > 0) {
    p.invulnerableTimer -= dt;
    p.isInvulnerable = p.invulnerableTimer > 0;
  }

  // Dash cooldown & timer
  if (p.dashCooldown > 0) p.dashCooldown -= dt;
  if (p.dashTimer > 0) {
    p.dashTimer -= dt;
    p.isDashing = p.dashTimer > 0;
    // Emit dash flame trail
    spawnParticles(state, p.x + p.w / 2, p.y + p.h / 2, 2, '#f97316', 3, 0.4);
  }

  // Squash and stretch return to 1
  p.squashStretch.x += (1 - p.squashStretch.x) * 0.15;
  p.squashStretch.y += (1 - p.squashStretch.y) * 0.15;

  // Screen shake decay
  if (state.screenShake > 0) {
    state.screenShake = Math.max(0, state.screenShake - dt * 25);
  }

  // --- Horizontal Movement (Left / Right Arrow or A / D) ---
  const leftPressed = keys.ArrowLeft || keys.KeyA;
  const rightPressed = keys.ArrowRight || keys.KeyD;
  const upPressed = keys.ArrowUp || keys.KeyW;
  const downPressed = keys.ArrowDown || keys.KeyS;
  const spacePressed = keys.Space;

  if (!p.isDashing) {
    if (leftPressed && !rightPressed) {
      p.vx -= RUN_ACCEL;
      if (p.vx < -RUN_MAX_SPEED) p.vx = -RUN_MAX_SPEED;
      p.facing = 'left';
      p.runCycle += dt * 14;
    } else if (rightPressed && !leftPressed) {
      p.vx += RUN_ACCEL;
      if (p.vx > RUN_MAX_SPEED) p.vx = RUN_MAX_SPEED;
      p.facing = 'right';
      p.runCycle += dt * 14;
    } else {
      p.vx *= FRICTION;
      if (Math.abs(p.vx) < 0.1) p.vx = 0;
      p.runCycle = 0;
    }
  }

  // --- Jumping & Double Jump (Edge-triggered to prevent eating air jump while holding) ---
  const prevUpPressed = state.prevKeys ? (state.prevKeys.ArrowUp || state.prevKeys.KeyW) : false;
  const upJustPressed = upPressed && !prevUpPressed;

  // Coyote time & Double Jump replenishment
  if (p.grounded) {
    p.coyoteTimer = 0.12; // 120ms coyote grace window
    p.doubleJumpAvailable = true;
  } else {
    p.coyoteTimer = Math.max(0, p.coyoteTimer - dt);
  }

  // Jump buffer countdown
  if (p.jumpBufferTimer > 0) {
    p.jumpBufferTimer = Math.max(0, p.jumpBufferTimer - dt);
  }

  // Jump execution on fresh press
  if (upJustPressed) {
    if (p.grounded || p.coyoteTimer > 0) {
      // First Jump (from ground or coyote time)
      p.vy = JUMP_FORCE;
      p.grounded = false;
      p.coyoteTimer = 0;
      p.jumpBufferTimer = 0;
      p.doubleJumpAvailable = true; // Still have double jump available for subsequent air tap!
      p.squashStretch = { x: 0.75, y: 1.35 };
      soundManager.playJump();
      spawnParticles(state, p.x + p.w / 2, p.y + p.h, 6, '#cbd5e1', 2.5, 0.3);
    } else if (p.doubleJumpAvailable) {
      // Mid-Air Double Jump!
      p.vy = DOUBLE_JUMP_FORCE;
      p.doubleJumpAvailable = false;
      p.coyoteTimer = 0;
      p.jumpBufferTimer = 0;
      p.squashStretch = { x: 0.7, y: 1.35 };
      soundManager.playDoubleJump();
      // Radiant fiery double jump burst at hero feet
      spawnParticles(state, p.x + p.w / 2, p.y + p.h - 4, 14, '#f59e0b', 4, 0.45);
      state.floatingTexts.push({
        id: Math.random().toString(),
        text: 'DOUBLE JUMP!',
        x: p.x + p.w / 2,
        y: p.y - 12,
        vy: -1.4,
        alpha: 1,
        life: 0.75,
        color: '#fbbf24',
      });
    } else {
      // Both jumps used, but player pressed jump in the air: buffer for landing!
      p.jumpBufferTimer = 0.16;
    }
  }

  // Variable Jump Height: releasing Up early dampens ascent for controllable short hops
  if (!upPressed && p.vy < -4.0) {
    p.vy *= 0.82;
  }

  // Gravity
  if (!p.isDashing) {
    p.vy += GRAVITY;
    if (p.vy > MAX_FALL_SPEED) p.vy = MAX_FALL_SPEED;
  }

  // Fast fall if holding down in air
  if (downPressed && !p.grounded && p.vy > 0) {
    p.vy = Math.min(p.vy + 0.4, MAX_FALL_SPEED + 3);
  }

  // --- Spacebar Special Moves: Fireball & Mega Charge ---
  handleFireballInput(state, p, spacePressed, dt);

  // --- Dash Mechanic (Shift or Down+Jump in air) ---
  if ((keys.ShiftLeft) && p.dashCooldown <= 0 && !p.isDashing) {
    p.isDashing = true;
    p.dashTimer = 0.22;
    p.dashCooldown = 0.7;
    p.invulnerableTimer = 0.25;
    p.isInvulnerable = true;
    p.vx = (p.facing === 'right' ? 1 : -1) * 11;
    p.vy = 0;
    soundManager.playFireball();
    state.screenShake = 3;
    state.floatingTexts.push({
      id: Math.random().toString(),
      text: 'EMBER DASH!',
      x: p.x,
      y: p.y - 15,
      vy: -1.2,
      alpha: 1,
      life: 0.8,
      color: '#f97316',
    });
  }

  // --- Physics & Collision Resolution with Platforms ---
  updatePlayerPositionAndCollisions(state, p, downPressed);

  // Moving platforms update
  updateMovingPlatforms(state, dt);

  // Update Fireballs
  updateFireballs(state, dt);

  // Update Enemies & Projectiles
  updateEnemies(state, dt);
  updateEnemyProjectiles(state, dt);

  // Update Collectibles & Hazards
  checkCollectibles(state);
  checkHazards(state);

  // Check Checkpoints
  checkCheckpoints(state);

  // Check Level Goal
  checkLevelGoal(state);

  // Update Particles
  updateParticles(state, dt);

  // Update Floating Texts
  updateFloatingTexts(state, dt);

  // Camera tracking
  updateCamera(state, viewWidth, viewHeight);

  // Check bottom pit death
  if (p.y > state.level.height + 60) {
    handlePlayerHazardHit(state, 'fell into the void');
  }

  // Record key states for edge-detection on next frame
  state.prevKeys = { ...keys };
}

function handleFireballInput(state: GameEngineState, p: Player, spacePressed: boolean, dt: number) {
  if (p.castTimer > 0) {
    p.castTimer -= dt;
    if (p.castTimer <= 0) p.isCasting = false;
  }

  const prevSpacePressed = state.prevKeys ? state.prevKeys.Space : false;

  if (spacePressed) {
    p.isCharging = true;
    p.chargeTime += dt;

    // Ambient charge particles
    if (Math.random() < 0.45) {
      const chargeRadius = 32;
      const angle = Math.random() * Math.PI * 2;
      const sx = p.x + p.w / 2 + Math.cos(angle) * chargeRadius;
      const sy = p.y + p.h / 2 + Math.sin(angle) * chargeRadius;
      state.particles.push({
        x: sx,
        y: sy,
        vx: (p.x + p.w / 2 - sx) * 0.12,
        vy: (p.y + p.h / 2 - sy) * 0.12,
        size: p.chargeTime >= CHARGE_TIME_REQUIRED ? 4.5 : 2.5,
        color: p.chargeTime >= CHARGE_TIME_REQUIRED ? '#ef4444' : '#f59e0b',
        alpha: 0.9,
        life: 0.3,
        maxLife: 0.3,
      });
    }
  } else {
    // Key was released after charging/pressing
    if (p.isCharging || (prevSpacePressed && !spacePressed)) {
      const isMega = p.chargeTime >= CHARGE_TIME_REQUIRED || p.currentPowerup === 'MEGA_INFERNO';
      firePlayerBall(state, p, isMega);
      p.isCharging = false;
      p.chargeTime = 0;
    }
  }
}

function firePlayerBall(state: GameEngineState, p: Player, isMega: boolean) {
  let manaCost = 22; // Standard fireball cost (22% of bar)
  if (isMega) {
    manaCost = 48; // Mega inferno cost (48% of bar)
  } else if (p.currentPowerup === 'TRIPLE_FLAME') {
    manaCost = 30; // Triple flame cost (30% of bar)
  }

  if (p.mana < manaCost) {
    soundManager.playFizzle();
    state.floatingTexts.push({
      id: Math.random().toString(),
      text: 'LOW FLAME ENERGY!',
      x: p.x + p.w / 2,
      y: p.y - 18,
      vy: -1.2,
      alpha: 1,
      life: 0.85,
      color: '#f87171',
    });
    return;
  }

  // Deplete flame energy visibly!
  p.mana = Math.max(0, p.mana - manaCost);
  p.isCasting = true;
  p.castTimer = 0.22;

  const direction = p.facing === 'right' ? 1 : -1;
  const speed = isMega ? 9.5 : 8.2;
  const startX = p.facing === 'right' ? p.x + p.w + 4 : p.x - 16;
  const startY = p.y + p.h / 2 - 8;

  if (isMega) {
    soundManager.playMegaFireball();
    state.screenShake = 6;
    state.fireballs.push({
      id: Math.random().toString(),
      x: startX,
      y: startY,
      vx: direction * speed,
      vy: 0,
      radius: 18,
      damage: 4,
      life: 2.2,
      maxLife: 2.2,
      isMega: true,
      isHoming: false,
      color: '#ef4444',
      tailParticles: [],
    });
    spawnParticles(state, startX, startY, 15, '#f97316', 4, 0.4);
  } else if (p.currentPowerup === 'TRIPLE_FLAME') {
    soundManager.playFireball();
    [-0.2, 0, 0.2].forEach((angleOffset) => {
      state.fireballs.push({
        id: Math.random().toString(),
        x: startX,
        y: startY,
        vx: direction * speed,
        vy: angleOffset * speed,
        radius: 9,
        damage: 1,
        life: 1.6,
        maxLife: 1.6,
        isMega: false,
        isHoming: false,
        color: '#f59e0b',
        tailParticles: [],
      });
    });
    spawnParticles(state, startX, startY, 8, '#f59e0b', 3, 0.3);
  } else {
    // Standard fireball
    soundManager.playFireball();
    state.fireballs.push({
      id: Math.random().toString(),
      x: startX,
      y: startY,
      vx: direction * speed,
      vy: 0,
      radius: 9,
      damage: 1,
      life: 1.8,
      maxLife: 1.8,
      isMega: false,
      isHoming: false,
      color: '#f59e0b',
      tailParticles: [],
    });
    spawnParticles(state, startX, startY, 6, '#f97316', 3, 0.25);
  }
}

function updatePlayerPositionAndCollisions(state: GameEngineState, p: Player, dropPressed: boolean) {
  // Horizontal movement first
  p.x += p.vx;
  for (const plat of state.platforms) {
    if (plat.isDestroyed) continue;
    // Pass horizontally through one-way platforms and bouncy mushrooms
    if (plat.type === 'ONE_WAY' || plat.type === 'BOUNCY_MUSHROOM') continue;

    if (checkAABB(p, plat)) {
      if (p.vx > 0) {
        p.x = plat.x - p.w;
      } else if (p.vx < 0) {
        p.x = plat.x + plat.w;
      }
      p.vx = 0;
    }
  }

  // Vertical movement
  p.y += p.vy;
  let onGround = false;

  for (const plat of state.platforms) {
    if (plat.isDestroyed) continue;

    // Super bouncy mushroom trampoline launch
    if (plat.type === 'BOUNCY_MUSHROOM') {
      if (checkAABB(p, plat) && p.y + p.h >= plat.y) {
        p.y = plat.y - p.h - 4;
        // Calibrated to match the exact peak height of a full double jump (314px)
        p.vy = -17.2;
        p.grounded = false;
        p.coyoteTimer = 0;
        p.doubleJumpAvailable = true;
        p.squashStretch = { x: 0.55, y: 1.5 };
        soundManager.playSpring();
        spawnParticles(state, p.x + p.w / 2, plat.y, 14, '#ec4899', 4.5, 0.45);

        // Only display floating text if the player has stepped off the mushroom between jumps
        if (p.hasSteppedOffMushroom !== false) {
          p.hasSteppedOffMushroom = false;
          state.floatingTexts.push({
            id: Math.random().toString(),
            text: 'SUPER SPRING! 🍄',
            x: p.x,
            y: p.y - 25,
            vy: -2,
            alpha: 1,
            life: 0.9,
            color: '#f472b6',
          });
        }
        return;
      }
      continue;
    }

    if (plat.type === 'ONE_WAY') {
      // If pressing down, don't land on one-way platform
      if (dropPressed) continue;

      // Only land if falling down and player feet were above platform top
      if (p.vy >= 0 && p.y + p.h - p.vy <= plat.y + 8 && checkAABB(p, plat)) {
        p.y = plat.y - p.h;
        p.vy = 0;
        onGround = true;
      }
      continue;
    }

    if (checkAABB(p, plat)) {
      if (p.vy > 0) {
        // Landed on floor
        p.y = plat.y - p.h;
        p.vy = 0;
        onGround = true;
        if (!p.grounded) {
          // Landing impact
          p.squashStretch = { x: 1.25, y: 0.75 };
        }
      } else if (p.vy < 0) {
        // Hit ceiling
        p.y = plat.y + plat.h;
        p.vy = 0;
      }
    }
  }

  p.grounded = onGround;
  if (p.grounded) {
    p.hasSteppedOffMushroom = true; // Stepped onto solid ground
    p.doubleJumpAvailable = true;
    // Execute buffered jump if the player pressed jump right before touching down
    if (p.jumpBufferTimer > 0) {
      p.vy = JUMP_FORCE;
      p.grounded = false;
      p.coyoteTimer = 0;
      p.jumpBufferTimer = 0;
      p.doubleJumpAvailable = true;
      p.squashStretch = { x: 0.75, y: 1.35 };
      soundManager.playJump();
      spawnParticles(state, p.x + p.w / 2, p.y + p.h, 6, '#cbd5e1', 2.5, 0.3);
    }
  }

  // If player has moved horizontally away from the mushroom, mark that they have stepped off
  if (!p.hasSteppedOffMushroom) {
    const overlappingMushroom = state.platforms.some(
      (plat) => plat.type === 'BOUNCY_MUSHROOM' && !plat.isDestroyed && p.x + p.w >= plat.x && p.x <= plat.x + plat.w
    );
    if (!overlappingMushroom) {
      p.hasSteppedOffMushroom = true;
    }
  }
}

function updateMovingPlatforms(state: GameEngineState, dt: number) {
  for (const plat of state.platforms) {
    if (plat.type !== 'MOVING' || !plat.startX || !plat.endX) continue;

    const speed = plat.speed || 1.5;
    const dir = plat.direction || 1;

    // Move horizontally or vertically
    if (plat.startX !== plat.endX) {
      plat.x += speed * dir;
      if (plat.x > Math.max(plat.startX, plat.endX)) {
        plat.x = Math.max(plat.startX, plat.endX);
        plat.direction = -1;
      } else if (plat.x < Math.min(plat.startX, plat.endX)) {
        plat.x = Math.min(plat.startX, plat.endX);
        plat.direction = 1;
      }

      // Carry player if standing on it
      const p = state.player;
      if (p.grounded && p.x + p.w > plat.x && p.x < plat.x + plat.w && Math.abs(p.y + p.h - plat.y) < 6) {
        p.x += speed * dir;
      }
    } else if (plat.startY !== undefined && plat.endY !== undefined) {
      plat.y += speed * dir;
      if (plat.y > Math.max(plat.startY, plat.endY)) {
        plat.y = Math.max(plat.startY, plat.endY);
        plat.direction = -1;
      } else if (plat.y < Math.min(plat.startY, plat.endY)) {
        plat.y = Math.min(plat.startY, plat.endY);
        plat.direction = 1;
      }

      // Carry player vertically if standing on it
      const p = state.player;
      if (p.grounded && p.x + p.w > plat.x && p.x < plat.x + plat.w && Math.abs(p.y + p.h - plat.y) < 8) {
        p.y = plat.y - p.h;
      }
    }
  }
}

function updateFireballs(state: GameEngineState, dt: number) {
  for (let i = state.fireballs.length - 1; i >= 0; i--) {
    const fb = state.fireballs[i];
    fb.x += fb.vx;
    fb.y += fb.vy;
    fb.life -= dt;

    // Tail particle
    fb.tailParticles.push({
      x: fb.x,
      y: fb.y,
      alpha: 0.9,
      size: fb.radius * 0.7,
      color: fb.color,
    });
    if (fb.tailParticles.length > 8) fb.tailParticles.shift();

    // Fade tail particles
    for (const tp of fb.tailParticles) {
      tp.alpha -= dt * 2.5;
      tp.size *= 0.92;
    }

    let hitSomething = false;

    // Hit platforms / cracked walls
    for (const plat of state.platforms) {
      if (plat.isDestroyed) continue;
      if (
        fb.x + fb.radius > plat.x &&
        fb.x - fb.radius < plat.x + plat.w &&
        fb.y + fb.radius > plat.y &&
        fb.y - fb.radius < plat.y + plat.h
      ) {
        if (plat.type === 'CRACKED_WALL') {
          plat.isDestroyed = true;
          soundManager.playExplosion();
          state.screenShake = 5;
          spawnParticles(state, plat.x + plat.w / 2, plat.y + plat.h / 2, 20, '#78716c', 5, 0.6);
          state.floatingTexts.push({
            id: Math.random().toString(),
            text: 'WALL DESTROYED!',
            x: plat.x,
            y: plat.y - 10,
            vy: -1.2,
            alpha: 1,
            life: 1,
            color: '#fbbf24',
          });
        }
        if (plat.type === 'SOLID' || plat.type === 'CRACKED_WALL') {
          hitSomething = true;
          break;
        }
      }
    }

    // Hit enemies
    for (const enemy of state.enemies) {
      if (enemy.isDead) continue;
      if (
        fb.x + fb.radius > enemy.x &&
        fb.x - fb.radius < enemy.x + enemy.w &&
        fb.y + fb.radius > enemy.y &&
        fb.y - fb.radius < enemy.y + enemy.h
      ) {
        hitSomething = true;
        damageEnemy(state, enemy, fb.damage, fb.isMega);
        break;
      }
    }

    if (hitSomething || fb.life <= 0) {
      soundManager.playExplosion();
      spawnParticles(state, fb.x, fb.y, fb.isMega ? 16 : 8, fb.color, 4, 0.35);
      state.fireballs.splice(i, 1);
    }
  }
}

function damageEnemy(state: GameEngineState, enemy: Enemy, damage: number, isMega: boolean) {
  enemy.health -= damage;
  enemy.hurtTimer = 0.25;
  soundManager.playEnemyPoof();

  state.floatingTexts.push({
    id: Math.random().toString(),
    text: isMega ? `CRIT -${damage * 25}!` : `-${damage * 15}`,
    x: enemy.x + enemy.w / 2,
    y: enemy.y - 15,
    vy: -1.5,
    alpha: 1,
    life: 0.9,
    color: isMega ? '#f43f5e' : '#f59e0b',
  });

  if (enemy.health <= 0) {
    enemy.isDead = true;
    state.score += enemy.type === 'BOSS_WYRM' ? 5000 : 250;
    spawnParticles(state, enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, 25, '#ef4444', 5, 0.6);

    // Drop coins or hearts
    state.collectibles.push({
      id: Math.random().toString(),
      x: enemy.x + enemy.w / 2,
      y: enemy.y,
      w: 20,
      h: 20,
      type: Math.random() < 0.25 ? 'HEART' : 'COIN',
      collected: false,
      floatOffset: 0,
    });

    if (enemy.type === 'BOSS_WYRM') {
      state.screenShake = 12;
      soundManager.playLevelClear();
      state.isLevelCleared = true;
      state.floatingTexts.push({
        id: Math.random().toString(),
        text: 'WYRM VANQUISHED!',
        x: enemy.x,
        y: enemy.y - 40,
        vy: -1,
        alpha: 1,
        life: 2.5,
        color: '#fbbf24',
      });
    }
  }
}

function updateEnemies(state: GameEngineState, dt: number) {
  const p = state.player;

  for (const e of state.enemies) {
    if (e.isDead) continue;
    if (e.hurtTimer > 0) e.hurtTimer -= dt;
    e.stateTimer += dt;

    if (e.type === 'SLIME') {
      e.x += e.vx;
      if (e.x < e.patrolStartX || e.x + e.w > e.patrolEndX) {
        e.vx *= -1;
        e.facing = e.vx > 0 ? 'right' : 'left';
      }
    } else if (e.type === 'BAT') {
      e.x += e.vx;
      e.y += Math.sin(e.stateTimer * 3.5) * 1.6;
      if (e.x < e.patrolStartX || e.x + e.w > e.patrolEndX) {
        e.vx *= -1;
        e.facing = e.vx > 0 ? 'right' : 'left';
      }
    } else if (e.type === 'GOLEM') {
      e.x += e.vx;
      if (e.x < e.patrolStartX || e.x + e.w > e.patrolEndX) {
        e.vx *= -1;
        e.facing = e.vx > 0 ? 'right' : 'left';
      }
    } else if (e.type === 'FLAME_SPITTER') {
      e.attackCooldown -= dt;
      if (e.attackCooldown <= 0) {
        e.attackCooldown = 2.4;
        // Shoot flame towards player direction
        const dir = p.x < e.x ? -1 : 1;
        state.enemyProjectiles.push({
          id: Math.random().toString(),
          x: dir === 1 ? e.x + e.w : e.x,
          y: e.y + 12,
          vx: dir * 4.2,
          vy: 0,
          radius: 8,
          damage: 1,
          life: 2.5,
          color: '#ea580c',
        });
      }
    } else if (e.type === 'BOSS_WYRM') {
      updateBossAI(state, e, dt);
    }

    // Check collision with player
    if (!e.isDead && checkAABB(p, e)) {
      // Player jumps on top of enemy (stomp)
      if (p.vy > 0 && p.y + p.h - p.vy <= e.y + 14 && e.type !== 'BOSS_WYRM') {
        p.vy = -9.5;
        p.squashStretch = { x: 1.3, y: 0.7 };
        damageEnemy(state, e, 2, false);
      } else {
        // Boss hits much harder: 2 HP in phase 1-2, 3 HP in phase 3 enrage!
        const damage = e.type === 'BOSS_WYRM' ? (e.bossPhase === 3 ? 3 : 2) : 1;
        handlePlayerHurt(state, damage);
      }
    }
  }
}

function updateBossAI(state: GameEngineState, boss: Enemy, dt: number) {
  const p = state.player;
  const hpRatio = boss.health / boss.maxHealth;

  if (hpRatio <= 0.33) boss.bossPhase = 3;
  else if (hpRatio <= 0.66) boss.bossPhase = 2;
  else boss.bossPhase = 1;

  // Boss patrol speed scales aggressively with phase
  const targetSpeed = boss.bossPhase === 3 ? 2.8 : boss.bossPhase === 2 ? 2.1 : 1.5;
  boss.vx = (boss.vx > 0 ? 1 : -1) * targetSpeed;

  boss.attackCooldown -= dt;

  // Horizontal patrol
  boss.x += boss.vx;
  if (boss.x < boss.patrolStartX || boss.x + boss.w > boss.patrolEndX) {
    boss.vx *= -1;
    boss.facing = boss.vx > 0 ? 'right' : 'left';
  }

  // Boss attack cycle - much faster and more aggressive!
  if (boss.attackCooldown <= 0) {
    boss.attackCooldown = boss.bossPhase === 3 ? 0.95 : boss.bossPhase === 2 ? 1.4 : 1.9;

    const attackRoll = Math.random();
    if (attackRoll < 0.6) {
      // MASSIVE VOLLEY OF FLAME FIREBALLS (7 in Phase 1, 10 in Phase 2, 15 in Phase 3!)
      soundManager.playFireball();
      const numShots = boss.bossPhase === 3 ? 15 : boss.bossPhase === 2 ? 10 : 7;
      const spreadAngle = boss.bossPhase === 3 ? Math.PI * 0.9 : Math.PI * 0.7;
      const startAngle = (Math.PI - spreadAngle) / 2;

      for (let i = 0; i < numShots; i++) {
        const angle = startAngle + (i / (numShots - 1)) * spreadAngle;
        const dir = boss.facing === 'right' ? 1 : -1;
        const speed = 4.2 + (i % 2) * 1.2;
        state.enemyProjectiles.push({
          id: Math.random().toString(),
          x: boss.x + boss.w / 2,
          y: boss.y + 25,
          vx: Math.cos(angle) * speed * dir,
          vy: -Math.sin(angle) * speed,
          radius: 12,
          damage: 2, // 2 HP damage per boss fireball!
          life: 3.5,
          color: '#ef4444',
        });
      }

      // In Phase 2 & 3: also unleash a high-speed targeted sniper fireball tracking player!
      if (boss.bossPhase >= 2) {
        const dx = p.x + p.w / 2 - (boss.x + boss.w / 2);
        const dy = p.y + p.h / 2 - (boss.y + 25);
        const dist = Math.hypot(dx, dy) || 1;
        state.enemyProjectiles.push({
          id: Math.random().toString(),
          x: boss.x + boss.w / 2,
          y: boss.y + 25,
          vx: (dx / dist) * 6.5,
          vy: (dy / dist) * 6.5,
          radius: 14,
          damage: 2,
          life: 2.8,
          color: '#ea580c',
        });
      }

      state.floatingTexts.push({
        id: Math.random().toString(),
        text: boss.bossPhase === 3 ? 'INFERNO CASCADE! (15 SHOTS)' : 'FLAME STORM!',
        x: boss.x + boss.w / 2,
        y: boss.y - 20,
        vy: -1.2,
        alpha: 1,
        life: 0.9,
        color: '#ef4444',
      });
    } else {
      // Boss devastating ground stomp & shockwave + Sky Meteor Rain!
      state.screenShake = 14;
      soundManager.playExplosion();
      spawnParticles(state, boss.x + boss.w / 2, boss.y + boss.h, 30, '#f97316', 7, 0.7);

      state.floatingTexts.push({
        id: Math.random().toString(),
        text: 'TITAN SLAM & METEOR RAIN!',
        x: boss.x + boss.w / 2,
        y: boss.y - 20,
        vy: -1.2,
        alpha: 1,
        life: 1.0,
        color: '#ea580c',
      });

      // Ground shockwaves travelling left and right along the floor
      [-1, 1].forEach((dir) => {
        state.enemyProjectiles.push({
          id: Math.random().toString(),
          x: boss.x + boss.w / 2,
          y: boss.y + boss.h - 10,
          vx: dir * 5.8,
          vy: 0,
          radius: 14,
          damage: 2, // 2 HP damage from ground shockwave!
          life: 2.5,
          color: '#f97316',
        });
      });

      // Raining Sky Meteors across the arena floor
      const meteorCount = boss.bossPhase === 3 ? 6 : 4;
      for (let m = 0; m < meteorCount; m++) {
        const meteorX = boss.patrolStartX + (m / (meteorCount - 1)) * (boss.patrolEndX - boss.patrolStartX);
        state.enemyProjectiles.push({
          id: Math.random().toString(),
          x: meteorX,
          y: boss.y - 200,
          vx: (Math.random() - 0.5) * 1.5,
          vy: 5.2,
          radius: 13,
          damage: 2,
          life: 2.5,
          color: '#dc2626',
        });
      }
    }
  }
}

function updateEnemyProjectiles(state: GameEngineState, dt: number) {
  const p = state.player;

  for (let i = state.enemyProjectiles.length - 1; i >= 0; i--) {
    const proj = state.enemyProjectiles[i];
    proj.x += proj.vx;
    proj.y += proj.vy;
    proj.life -= dt;

    // Check hit player
    if (
      proj.x + proj.radius > p.x &&
      proj.x - proj.radius < p.x + p.w &&
      proj.y + proj.radius > p.y &&
      proj.y - proj.radius < p.y + p.h
    ) {
      handlePlayerHurt(state, proj.damage);
      state.enemyProjectiles.splice(i, 1);
      continue;
    }

    if (proj.life <= 0) {
      state.enemyProjectiles.splice(i, 1);
    }
  }
}

function checkCollectibles(state: GameEngineState) {
  const p = state.player;

  for (const c of state.collectibles) {
    if (c.collected) continue;
    if (checkAABB(p, c)) {
      c.collected = true;

      if (c.type === 'COIN') {
        soundManager.playCoin();
        state.coins += 1;
        state.score += 100;
        spawnParticles(state, c.x + c.w / 2, c.y + c.h / 2, 8, '#fbbf24', 3, 0.3);
        state.floatingTexts.push({
          id: Math.random().toString(),
          text: '+100',
          x: c.x,
          y: c.y - 10,
          vy: -1.2,
          alpha: 1,
          life: 0.8,
          color: '#fbbf24',
        });
      } else if (c.type === 'EMBER_GEM') {
        soundManager.playGem();
        state.gems += 1;
        state.score += 500;
        spawnParticles(state, c.x + c.w / 2, c.y + c.h / 2, 14, '#38bdf8', 4, 0.5);
        state.floatingTexts.push({
          id: Math.random().toString(),
          text: 'EMBER GEM +500!',
          x: c.x,
          y: c.y - 15,
          vy: -1.4,
          alpha: 1,
          life: 1.1,
          color: '#38bdf8',
        });
      } else if (c.type === 'HEART') {
        soundManager.playCoin();
        p.health = Math.min(p.maxHealth, p.health + 1);
        spawnParticles(state, c.x + c.w / 2, c.y + c.h / 2, 10, '#f43f5e', 3, 0.4);
        state.floatingTexts.push({
          id: Math.random().toString(),
          text: '+1 HEART!',
          x: c.x,
          y: c.y - 12,
          vy: -1.2,
          alpha: 1,
          life: 0.9,
          color: '#f43f5e',
        });
      } else if (c.type === 'POWERUP_TRIPLE') {
        soundManager.playGem();
        p.currentPowerup = 'TRIPLE_FLAME';
        p.powerupTimeRemaining = 15;
        state.score += 300;
        spawnParticles(state, c.x + c.w / 2, c.y + c.h / 2, 16, '#f97316', 4, 0.5);
        state.floatingTexts.push({
          id: Math.random().toString(),
          text: 'TRIPLE FIREBALL!',
          x: c.x,
          y: c.y - 15,
          vy: -1.4,
          alpha: 1,
          life: 1.3,
          color: '#f97316',
        });
      } else if (c.type === 'POWERUP_MEGA') {
        soundManager.playGem();
        p.currentPowerup = 'MEGA_INFERNO';
        p.powerupTimeRemaining = 12;
        state.score += 500;
        spawnParticles(state, c.x + c.w / 2, c.y + c.h / 2, 20, '#ef4444', 5, 0.6);
        state.floatingTexts.push({
          id: Math.random().toString(),
          text: 'MEGA INFERNO!',
          x: c.x,
          y: c.y - 15,
          vy: -1.4,
          alpha: 1,
          life: 1.5,
          color: '#ef4444',
        });
      }
    }
  }
}

function checkHazards(state: GameEngineState) {
  const p = state.player;

  for (const h of state.hazards) {
    if (checkAABB(p, h)) {
      handlePlayerHazardHit(state, h.type === 'LAVA' ? 'burned in lava' : 'pierced by spikes');
      break;
    }
  }
}

function checkCheckpoints(state: GameEngineState) {
  const p = state.player;

  for (const cp of state.level.checkpoints) {
    if (!cp.activated && checkAABB(p, cp)) {
      cp.activated = true;
      state.activeCheckpointPos = { x: cp.x, y: cp.y };
      soundManager.playCheckpoint();
      spawnParticles(state, cp.x + cp.w / 2, cp.y + cp.h / 2, 16, '#38bdf8', 4, 0.6);
      state.floatingTexts.push({
        id: Math.random().toString(),
        text: 'SHRINE LIT - CHECKPOINT!',
        x: cp.x,
        y: cp.y - 20,
        vy: -1.2,
        alpha: 1,
        life: 1.4,
        color: '#38bdf8',
      });
    }
  }
}

function checkLevelGoal(state: GameEngineState) {
  const p = state.player;
  const g = state.level.goal;

  if (checkAABB(p, g)) {
    // If level 3, boss must be defeated first
    if (state.level.id === 3) {
      const boss = state.enemies.find((e) => e.type === 'BOSS_WYRM');
      if (boss && !boss.isDead) return;
    }

    state.isLevelCleared = true;
    soundManager.playLevelClear();
    state.score += 2000;
  }
}

function handlePlayerHurt(state: GameEngineState, dmg: number) {
  const p = state.player;
  if (p.isInvulnerable) return;

  p.health -= dmg;
  p.isInvulnerable = true;
  p.invulnerableTimer = 1.2;
  p.vy = -6.5;
  p.vx = (p.facing === 'right' ? -1 : 1) * 4;
  state.screenShake = 6;
  soundManager.playHurt();

  spawnParticles(state, p.x + p.w / 2, p.y + p.h / 2, 12, '#ef4444', 3, 0.4);
  state.floatingTexts.push({
    id: Math.random().toString(),
    text: `-${dmg} HP`,
    x: p.x,
    y: p.y - 20,
    vy: -1.3,
    alpha: 1,
    life: 0.9,
    color: '#ef4444',
  });

  if (p.health <= 0) {
    handlePlayerHazardHit(state, 'lost all hearts');
  }
}

export function handlePlayerHazardHit(state: GameEngineState, _reason: string) {
  const p = state.player;
  soundManager.playHurt();
  state.screenShake = 8;
  state.lives -= 1;

  if (state.lives <= 0) {
    state.isGameOver = true;
    return;
  }

  // Respawn at checkpoint or start
  const respawnPoint = state.activeCheckpointPos || state.level.playerStart;
  p.x = respawnPoint.x;
  p.y = respawnPoint.y;
  p.vx = 0;
  p.vy = 0;
  p.health = p.maxHealth;
  p.mana = p.maxMana;
  p.doubleJumpAvailable = true;
  p.grounded = true;
  p.isInvulnerable = true;
  p.invulnerableTimer = 2.0;

  state.floatingTexts.push({
    id: Math.random().toString(),
    text: `${state.lives} LIVES REMAINING`,
    x: p.x,
    y: p.y - 30,
    vy: -1,
    alpha: 1,
    life: 1.5,
    color: '#f59e0b',
  });
}

function updateCamera(state: GameEngineState, viewW: number, viewH: number) {
  const p = state.player;
  const targetX = p.x + p.w / 2 - viewW / 2;
  const targetY = p.y + p.h / 2 - viewH / 2;

  // Smooth lerp
  state.camera.x += (targetX - state.camera.x) * 0.12;
  state.camera.y += (targetY - state.camera.y) * 0.12;

  // Clamping to level bounds
  const maxX = Math.max(0, state.level.width - viewW);
  const maxY = Math.max(0, state.level.height - viewH);

  state.camera.x = Math.max(0, Math.min(maxX, state.camera.x));
  state.camera.y = Math.max(0, Math.min(maxY, state.camera.y));
}

function spawnParticles(
  state: GameEngineState,
  x: number,
  y: number,
  count: number,
  color: string,
  maxSpeed: number,
  life: number
) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (0.5 + Math.random() * 0.5) * maxSpeed;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      size: 2 + Math.random() * 4,
      color,
      alpha: 1,
      life,
      maxLife: life,
      gravity: 0.12,
    });
  }
}

function updateParticles(state: GameEngineState, dt: number) {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const part = state.particles[i];
    part.x += part.vx;
    part.y += part.vy;
    if (part.gravity) part.vy += part.gravity;
    part.life -= dt;
    part.alpha = Math.max(0, part.life / part.maxLife);

    if (part.life <= 0) {
      state.particles.splice(i, 1);
    }
  }
}

function updateFloatingTexts(state: GameEngineState, dt: number) {
  for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
    const ft = state.floatingTexts[i];
    ft.y += ft.vy;
    ft.life -= dt;
    ft.alpha = Math.max(0, ft.life);

    if (ft.life <= 0) {
      state.floatingTexts.splice(i, 1);
    }
  }
}

function checkAABB(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number }
): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
