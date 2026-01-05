// functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express, { Request, Response } from 'express';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { randomUUID } from 'crypto';
import { defineSecret } from 'firebase-functions/params';
import { UUID_RE, SHORT_RE, randomShort } from './short';


import { renderRegisterInner } from './views/registerPage';
import { page, buildErrorMailto, renderErrorWithMail } from './views/layout';
//import { renderPublicView, PublicPageProps } from "./views/publicPage";
import { createRenderPublic } from "./views/publicLegacy";



admin.initializeApp();
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

// function buildErrorMailto(title: string, e: any, req?: Request): string {
//   const to = 'suchwit.wit@gmail.com'; // 실제 사용할 분실방지본부 개발자 메일로 교체
//   const subject = `[NAT 오류 신고] ${title}`;
//   const parts: string[] = [];

//   parts.push(`페이지: ${req?.originalUrl || ''}`);
//   parts.push(`메서드: ${req?.method || ''}`);
//   parts.push('');
//   parts.push('오류 메시지:');
//   parts.push(String(e && e.message ? e.message : e));
//   parts.push('');
//   parts.push('추가 설명을 여기에 적어 주세요:');

//   const body = encodeURIComponent(parts.join('\n'));
//   const subj = encodeURIComponent(subject);
//   return `mailto:${to}?subject=${subj}&body=${body}`;
// }

// function renderErrorWithMail(
//   title: string,
//   description: string,
//   mailtoHref: string
// ): string {
//   return `
//     <h1>${title}</h1>
//     <p>${description}</p>
//     <p style="margin-top:16px;">
//       <a href="${mailtoHref}" class="btn-secondary">
//         분실방지본부에 오류 메일 보내기
//       </a>
//     </p>
//   `;
// }

// function page(html: string, title = '분실방지본부 NAT 태그'): string {
//   return `<!DOCTYPE html>
// <html lang="ko">
// <head>
//   <meta charset="utf-8" />
//   <title>${title}</title>
//   <meta name="viewport" content="width=device-width, initial-scale=1" />
  
// </head>
// <body>
//   <main class="wrap">
//     ${html}    
//   </main>
// </body>
// </html>`;
// }
const renderPublic = createRenderPublic(page);



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

// ====== Export (region 변경 원하면 'asia-northeast3') ======
export const web = functions
  .runWith({ secrets: [ADMIN_TOKEN] }) // ⬅️ Secret 주입
  .region('us-central1')
  .https.onRequest(app);
