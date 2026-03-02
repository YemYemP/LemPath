// ── Skill metadata ────────────────────────────────────────────────────────────

import { SkillType } from '../types';

export interface SkillMeta {
  type: SkillType;
  label: string;
  shortcut: string;          // keyboard shortcut key ('1'–'8')
  /** Colour used to draw placeholder icon */
  iconColor: string;
  /** Is this a permanent skill (flag, not state change)? */
  isPermanent: boolean;
  /** If true, cannot be assigned while lemming is in these states */
  invalidStates: string[];
}

export const SKILL_CONFIG: Record<SkillType, SkillMeta> = {
  [SkillType.Climber]: {
    type: SkillType.Climber,
    label: 'Climber',
    shortcut: '1',
    iconColor: '#00aaff',
    isPermanent: true,
    invalidStates: ['blocking', 'dead', 'saved'],
  },
  [SkillType.Floater]: {
    type: SkillType.Floater,
    label: 'Floater',
    shortcut: '2',
    iconColor: '#88ddff',
    isPermanent: true,
    invalidStates: ['blocking', 'dead', 'saved'],
  },
  [SkillType.Bomber]: {
    type: SkillType.Bomber,
    label: 'Bomber',
    shortcut: '3',
    iconColor: '#ff4400',
    isPermanent: false,
    invalidStates: ['bombing', 'dead', 'saved', 'splatting'],
  },
  [SkillType.Blocker]: {
    type: SkillType.Blocker,
    label: 'Blocker',
    shortcut: '4',
    iconColor: '#ff8800',
    isPermanent: false,
    invalidStates: ['blocking', 'digging', 'bashing', 'mining', 'building', 'falling', 'dead', 'saved'],
  },
  [SkillType.Builder]: {
    type: SkillType.Builder,
    label: 'Builder',
    shortcut: '5',
    iconColor: '#ffdd00',
    isPermanent: false,
    invalidStates: ['blocking', 'falling', 'dead', 'saved'],
  },
  [SkillType.Basher]: {
    type: SkillType.Basher,
    label: 'Basher',
    shortcut: '6',
    iconColor: '#44ff44',
    isPermanent: false,
    invalidStates: ['blocking', 'falling', 'dead', 'saved'],
  },
  [SkillType.Miner]: {
    type: SkillType.Miner,
    label: 'Miner',
    shortcut: '7',
    iconColor: '#aaffaa',
    isPermanent: false,
    invalidStates: ['blocking', 'falling', 'dead', 'saved'],
  },
  [SkillType.Digger]: {
    type: SkillType.Digger,
    label: 'Digger',
    shortcut: '8',
    iconColor: '#aa88ff',
    isPermanent: false,
    invalidStates: ['blocking', 'falling', 'dead', 'saved'],
  },
};

/** Ordered list used to render the skill bar left-to-right */
export const SKILL_ORDER: SkillType[] = [
  SkillType.Climber,
  SkillType.Floater,
  SkillType.Bomber,
  SkillType.Blocker,
  SkillType.Builder,
  SkillType.Basher,
  SkillType.Miner,
  SkillType.Digger,
];
