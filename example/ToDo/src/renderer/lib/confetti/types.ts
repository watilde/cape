export type ConfettiMode = 'single' | 'all';

export type ParticleShape = 'rect' | 'circle';

export interface ParticleConfig {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  rotEnd: number;
  scale: number;
  color: string;
  delay: number;
  shape: ParticleShape;
  mode: ConfettiMode;
}

export interface ConfettiTriggerOptions {
  epicenterElement: HTMLElement;
  mode: ConfettiMode;
}
