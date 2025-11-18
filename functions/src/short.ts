import { randomBytes } from 'crypto';
import { renderRegister } from './views/registerPage';


export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const SHORT_RE = /^[0-9A-Z]{10,20}$/; // 14자 기본, 12~16도 허용 가능

const ALPH = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'; // Base36

// 편향 없애는 랜덤 선택 (rejection sampling)
export function randomShort(len = 14): string {
  const out: string[] = [];
  while (out.length < len) {
    const b = randomBytes(1)[0];
    if (b < 252) out.push(ALPH[b % 36]);
  }
  return out.join('');
}
