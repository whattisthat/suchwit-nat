// functions/src/index.ts
import * as admin from 'firebase-admin';


import express, { Request, Response } from 'express';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { randomUUID } from 'crypto';
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';

import { UUID_RE, SHORT_RE, randomShort } from './short';
import { renderRegisterInner } from './views/registerPage';
import { page, buildErrorMailto, renderErrorWithMail } from './views/layout';
//import { renderPublicView, PublicPageProps } from "./views/publicPage";
import { createRenderPublic } from "./views/publicLegacy";

// ✅ admin/app 초기화가 파일 어딘가에 이미 있다면 중복 호출만 피하세요.
admin.initializeApp();

const renderPublic = createRenderPublic(page);



const db = getFirestore();
const app = express();

// ====== Middleware ======
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 크롤링/캐시 최소화
app.use((req, res, next) => {
  res.set('X-Robots-Tag', 'noindex, nofollow');
  if (req.path.startsWith('/q/')) {
    res.set('Cache-Control', 'no-store');
  }
  next();
});

// ====== View helpers ======

function normalizePhone(raw: string): { display: string; tel: string } {
  const digits = (raw || '').replace(/[^0-9+]/g, '');
  const tel = digits;
  const only = digits.replace(/[^0-9]/g, '');
  let display = only;
  if (only.length === 11) display = `${only.slice(0, 3)}-${only.slice(3, 7)}-${only.slice(7)}`;
  else if (only.length === 10) display = `${only.slice(0, 3)}-${only.slice(3, 6)}-${only.slice(6)}`;
  return { display, tel };
}


function renderRegister(idForHidden: string) {
  // views/registerPage.ts에서 가져온 "내용"을 page()로 감싸서 전체 HTML로 만든다
  return page(
    renderRegisterInner(idForHidden),
    'NAT 태그 등록 · 분실방지본부'
  );
}

// ====== ID resolution (uuid or short) ======
async function idToUuid(id: string): Promise<string | null> {
  const raw = decodeURIComponent(String(id || '')).trim();
  if (UUID_RE.test(raw)) return raw;
  const up = raw.toUpperCase();
  if (!SHORT_RE.test(up)) return null;
  const a = await db.doc(`qr_alias/${up}`).get();
  return a.exists ? (a.data() as any).uuid : null;
}

async function ensureAlias(uuid: string, len = 14): Promise<string> {
  const itemRef = db.doc(`qr_items/${uuid}`);
  const snap = await itemRef.get();
  const existing = snap.exists ? (snap.data() as any).short : null;
  if (existing) return existing;

  for (let i = 0; i < 5; i++) {
    const cand = randomShort(len);
    const aliasRef = db.doc(`qr_alias/${cand}`);
    try {
      await db.runTransaction(async (tx) => {
        const a = await tx.get(aliasRef);
        if (a.exists) throw new Error('collision');
        tx.set(aliasRef, { uuid, created_at: FieldValue.serverTimestamp() });
        tx.update(itemRef, { short: cand });
      });
      return cand;
    } catch (e: any) {
      if (!/collision/.test(String(e?.message))) throw e;
    }
  }
  throw new Error('alias-gen-failed');
}

// ====== Public routes ======

// GET /q/:id  (id = uuid 또는 short)
app.get('/q/:id', async (req: Request, res: Response) => {
  try {
    const uuid = await idToUuid(String(req.params.id || ''));
    if (!uuid)
      return res
        .status(404)
        .send(page('<h1>등록 불가</h1><p>유효하지 않은 태그입니다.</p>'));

     const ref = db.doc(`qr_items/${uuid}`);
    const snap = await ref.get();
    if (!snap.exists)
      return res
        .status(404)
        .send(page('<h1>등록 불가</h1><p>유효하지 않은 태그입니다.</p>'));

    const item = snap.data() as any;

    if (item.status === 'issued') {
      const short = await ensureAlias(uuid, 14);
      return res.status(200).send(renderRegister(short));
    }
    if (item.status === 'activated') {
      console.log('PUBLIC VIEW HIT v2026-01-07', {
      id: uuid,
      url: req.originalUrl,
    });

    return res.status(200).send(renderPublic(item.public_profile || {}));
      
    }
    return res
      .status(410)
      .send(page('<h1>사용 중지된 태그</h1><p class="hint">이 태그는 현재 사용할 수 없습니다.</p>'));
  } catch (e) {
    console.error('[NAT][public] unexpected error', e);
    const mailto = buildErrorMailto('/q/:id 처리 중 오류', e, req);
    return res.status(500).send(
      page(
        renderErrorWithMail(
          '페이지를 불러오는 중 오류가 발생했습니다.',
          '잠시 후 다시 시도해 주세요. 계속 반복되면 아래 버튼으로 분실방지본부에 알려 주세요.',
          mailto
        ),
        '오류 · 분실방지본부'
      )
    );
  }
});


// POST /api/register  (uuid 또는 short 허용)
app.post('/api/register', async (req: Request, res: Response) => {
  try {
    const id = String(req.body.uuidOrShort || req.body.uuid || '').trim();
    
    const uuid = await idToUuid(id);
    if (!uuid) return res.status(400).send(page('<h1>오류</h1><p>유효하지 않은 태그입니다.</p>'));

    const contactRaw = String(req.body.contact || '').trim();
    const snsRaw = String(req.body.sns || '').trim();
    //const message = (req.body.message ? String(req.body.message) : '').slice(0, 140);

    if (!contactRaw && !snsRaw) {
      return res
        .status(400)
        .send(page('<h1>오류</h1><p>전화번호 또는 SNS 중 하나 이상을 입력해주세요.</p>'));
    }

    const { uuidOrShort, contact, sns, message } = req.body || {};

    const contactStr = (contact || '').toString().trim();
    const snsStr = (sns || '').toString().trim();

    // 최소 조건: 전화번호 또는 SNS 중 하나는 반드시 있어야 한다
    if (!contactStr && !snsStr) {
      console.error('[NAT][register] missing contact & sns');
      return res.status(400).send(
        page(
          `
          <h1>등록이 필요합니다</h1>
          <p>전화번호 또는 SNS 중 하나 이상은 반드시 입력해 주세요.</p>
          <p><a href="javascript:history.back()">이전 페이지로 돌아가기</a></p>
          `,
          '등록 오류 · 분실방지본부'
        )
      );
    }

    await db.runTransaction(async (tx) => {
      const itemRef = db.doc(`qr_items/${uuid}`);
      const snap = await tx.get(itemRef);
      if (!snap.exists) throw new Error('not issued');
      const item = snap.data() as any;
      if (item.status !== 'issued') throw new Error('already');

      const now = FieldValue.serverTimestamp();
      const phone = contactRaw ? normalizePhone(contactRaw).display : null;
      const pub = { phone, sns: snsRaw || null, message };

      tx.update(itemRef, {
        status: 'activated',
        activated_at: now,
        public_profile: pub,
      });
    });

    // short 보장 후 그걸로 리다이렉트
    const back =
      SHORT_RE.test((id || '').toUpperCase()) ? id.toUpperCase() : await ensureAlias(uuid, 14);
    return res.redirect(303, `/q/${back}`);
  } catch (e) {
    console.error('[NAT][register] unexpected error', e);
    const mailto = buildErrorMailto('등록 중 오류 발생', e, req);
    return res.status(500).send(
      page(
        renderErrorWithMail(
          '등록 처리 중 오류가 발생했습니다.',
          '잠시 후 다시 시도해 주세요. 계속 반복되면 아래 버튼으로 분실방지본부에 알려 주세요.',
          mailto
        ),
        '오류 · 분실방지본부'
      )
    );
  }
});

// ====== Admin-only: batch issuing ======
// Secret: ADMIN_TOKEN (set via `firebase functions:secrets:set ADMIN_TOKEN`)
// ✅ Secret 정의 (v2에서 runWith 대신 이 방식으로 주입/사용)
const ADMIN_TOKEN = defineSecret('ADMIN_TOKEN');

function checkAdmin(req: Request): boolean {
  const incoming = String(req.get('x-admin-token') || req.query.token || '');
  const secret = ADMIN_TOKEN.value() || process.env.ADMIN_TOKEN || '';
  return !!secret && incoming === secret;
}

// POST /admin/issue-batch  → CSV(uuid,short,url)
app.post('/admin/issue-batch', async (req: Request, res: Response) => {
  try {
    if (!checkAdmin(req)) return res.status(401).send('Unauthorized');

    const count = Math.min(parseInt(String(req.body.count || req.query.count || '1'), 10) || 1, 1000);
    const len = Math.max(10, Math.min(parseInt(String(req.body.len || req.query.len || '14'), 10) || 14, 20));
    const batchId =
      String(req.body.batch_id || req.query.batch_id || new Date().toISOString().replace(/[:.]/g, '').slice(0, 15));
    const domain = String(req.body.domain || req.query.domain || 'https://www.suchwit.com').replace(/\/+$/, '');

    const rows: string[][] = [['uuid', 'short', 'url']];

    for (let i = 0; i < count; i++) {
      const uuid = randomUUID();
      const short = await (async () => {
        for (let j = 0; j < 5; j++) {
          const cand = randomShort(len);
          try {
            await db.runTransaction(async (tx) => {
              const aliasRef = db.doc(`qr_alias/${cand}`);
              const a = await tx.get(aliasRef);
              if (a.exists) throw new Error('collision');

              const itemRef = db.doc(`qr_items/${uuid}`);
              tx.set(aliasRef, { uuid, created_at: FieldValue.serverTimestamp() });
              tx.set(itemRef, {
                status: 'issued',
                created_at: FieldValue.serverTimestamp(),
                batch_id: batchId,
                short: cand,
              });
            });
            return cand;
          } catch (e: any) {
            if (!/collision/.test(String(e?.message))) throw e;
          }
        }
        throw new Error('alias-gen-failed');
      })();

      rows.push([uuid, short, `${domain}/q/${short}`]);
    }

    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', `attachment; filename="batch-${batchId}.csv"`);
    res.status(200).send(rows.map((r) => r.join(',')).join('\n'));
  } catch (e: any) {
    console.error(e);
    res.status(500).send('issue-batch failed');
  }
});

// 예시: 어떤 라우트에서 secret 사용
app.get('/debug', (req: Request, res: Response) => {
  const token = ADMIN_TOKEN.value(); // ✅ 런타임에서 읽기
  res.status(200).send({ ok: true, tokenExists: !!token });
});


// ✅ v2 export: runWith/region 체이닝 제거
export const webV2 = onRequest(
  {
    region: 'us-central1',
    secrets: [ADMIN_TOKEN],
    // 필요하면 여기서 memory, timeoutSeconds, concurrency 등도 설정
    // timeoutSeconds: 60,
    // memory: '256MiB',
  },
  app
);