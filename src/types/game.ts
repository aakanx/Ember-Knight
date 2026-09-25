export type GameState = 'TITLE' | 'PLAYING' | 'PAUSED' | 'LEVEL_COMPLETE' | 'GAME_OVER' | 'VICTORY';

export type PowerupType = 'STANDARD' | 'TRIPLE_FLAME' | 'MEGA_INFERNO' | 'HOMING_EMBER';

export interface Vector2D {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  grounded: boolean;
  facing: 'left' | 'right';
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  isInvulnerable: boolean;
  invulnerableTimer: number;
  coyoteTimer: number;
  jumpBufferTimer: number;
  doubleJumpAvailable: boolean;
  isCasting: boolean;
  castTimer: number;
  chargeTime: number;
  isCharging: boolean;
  isDashing: boolean;
  dashTimer: number;
  dashCooldown: number;
  currentPowerup: PowerupType;
  powerupTimeRemaining: number;
  runCycle: number;
  squashStretch: { x: number; y: number };
  hasSteppedOffMushroom?: boolean;
}

export interface Fireball {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  life: number;
  maxLife: number;
  isMega: boolean;
  isHoming: boolean;
  color: string;
  tailParticles: { x: number; y: number; alpha: number; size: number; color: string }[];
}

export type EnemyType = 'SLIME' | 'BAT' | 'GOLEM' | 'FLAME_SPITTER' | 'BOSS_WYRM';

export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  health: number;
  maxHealth: number;
  facing: 'left' | 'right';
  patrolStartX: number;
  patrolEndX: number;
  grounded: boolean;
  attackCooldown: number;
  hurtTimer: number;
  stateTimer: number;
  isDead: boolean;
  // Boss specific properties
  bossPhase?: number;
  bossAttackState?: 'IDLE' | 'CHARGING' | 'FIRE_VOLLEY' | 'SLAM' | 'SUMMON';
}

export interface EnemyProjectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  life: number;
  color: string;
}

export type PlatformType = 'SOLID' | 'ONE_WAY' | 'MOVING' | 'CRUMBLED' | 'BOUNCY_MUSHROOM' | 'CRACKED_WALL';

export interface Platform {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: PlatformType;
  // Moving platform props
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  speed?: number;
  direction?: number;
  // Destructible / crumbly
  health?: number;
  isDestroyed?: boolean;
  crumbleTimer?: number;
}

export type CollectibleType = 'COIN' | 'EMBER_GEM' | 'HEART' | 'POWERUP_TRIPLE' | 'POWERUP_MEGA';

export interface Collectible {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: CollectibleType;
  collected: boolean;
  floatOffset: number;
}

export interface Checkpoint {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  activated: boolean;
}

export interface Hazard {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'SPIKES' | 'LAVA' | 'FIRE_JET';
  timer?: number;
  isActive?: boolean;
}

export interface LevelGoal {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  gravity?: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  vy: number;
  alpha: number;
  life: number;
  color: string;
}

export interface LevelData {
  id: number;
  title: string;
  subtitle: string;
  theme: 'FOREST' | 'CAVERN' | 'CITADEL';
  bannerImage: string;
  width: number;
  height: number;
  playerStart: Vector2D;
  goal: LevelGoal;
  platforms: Platform[];
  enemies: Enemy[];
  collectibles: Collectible[];
  checkpoints: Checkpoint[];
  hazards: Hazard[];
  ambientColor: string;
  parallexColor1: string;
  parallexColor2: string;
}

export interface KeyState {
  ArrowLeft: boolean;
  ArrowRight: boolean;
  ArrowUp: boolean;
  ArrowDown: boolean;
  Space: boolean;
  KeyA: boolean;
  KeyD: boolean;
  KeyW: boolean;
  KeyS: boolean;
  ShiftLeft: boolean;
}

export interface ChapterCompletionRecord {
  levelId: number;
  completed: boolean;
  gems: number;
  totalGems: number;
  coins: number;
  totalCoins: number;
  percentage: number;
  points: number;
}
