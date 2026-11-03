import type { DamageType, Hunt } from './types';

export const carries = (h: Hunt, type: DamageType) => h.weps.some(w => w.type === type);
export const carryingName = (h: Hunt, type: DamageType) => h.weps.find(w => w.type === type)?.name ?? '';
export const exposeTag = '[EXPOSE]';
export const dazeTag = '[DAZE]';
