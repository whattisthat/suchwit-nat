// functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express, { Request, Response } from 'express';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { randomUUID } from 'crypto';
import { defineSecret } from 'firebase-functions/params';
import { UUID_RE, SHORT_RE, randomShort } from './short';
import { renderRegisterInner } from './views/registerPage';


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

function isLikelyUrl(text: string): boolean {
  const t = (text || '').trim().toLowerCase();
  if (!t) return false;
  if (t.startsWith('http://') || t.startsWith('https://')) return true;
  if (t.includes('.') && !t.includes(' ')) return true; // 공백 없고 . 있으면 URL로 간주
  return false;
}

function normalizePhone(raw: string): { display: string; tel: string } {
  const digits = (raw || '').replace(/[^0-9+]/g, '');
  const tel = digits;
  const only = digits.replace(/[^0-9]/g, '');
  let display = only;
  if (only.length === 11) display = `${only.slice(0, 3)}-${only.slice(3, 7)}-${only.slice(7)}`;
  else if (only.length === 10) display = `${only.slice(0, 3)}-${only.slice(3, 6)}-${only.slice(6)}`;
  return { display, tel };
}

// function page(html: string, title = '분실방지본부(NOT-A-TAG, NAT)'): string {
//   return `<!doctype html><html lang="ko"><head>
//   <meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
//   <meta name="robots" content="noindex,nofollow"/>
//   <title>${title}</title>
//   <style>

//   :root {
//       --nat-main: #FF4E42;
//       --nat-sub: #1820EF;
//       --nat-bg: #f3f4f6;
//       --nat-border: #d1d5db;
//       --nat-text: #111827;
//       --nat-muted: #6b7280;
//     }
//     * {
//       box-sizing: border-box;
//       font-family: system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif;
//     }
//     html, body {
//       margin: 0;
//       padding: 0;
//       background: var(--nat-bg);
//       color: var(--nat-text);
//     }
//     body {
//       min-height: 100vh;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       padding: 16px;
//       font-size: 16px;
//       line-height: 1.6;
//     }
//     .wrap {
//       width: 100%;
//       max-width: 460px;
//       background: #ffffff;
//       border-radius: 18px;
//       border: 1px solid var(--nat-border);
//       box-shadow: 0 18px 40px rgba(15, 23, 42, 0.18);
//       padding: 24px 20px 20px;
//     }
//     .brand {
//       display: flex;
//       align-items: center;
//       gap: 10px;
//       margin-bottom: 10px;
//     }
//     .brand-mark {
//       width: 28px;
//       height: 28px;
//       border-radius: 8px;
//       flex-shrink: 0;
//       /* TODO: 여기 경로를 실제 NAT 로고 파일 경로로 바꾸세요. 예: /assets/nat-mark.svg */
//       background:
//         url("/nat-brand-mark.svg") center/contain no-repeat,
//         linear-gradient(135deg, var(--nat-sub), var(--nat-main));
//     }
//     .brand-name {
//       font-size: 13px;
//       font-weight: 600;
//       letter-spacing: 0.06em;
//       text-transform: uppercase;
//       color: var(--nat-sub);
//     }
//     h1 {
//       font-size: 22px;
//       margin: 4px 0 6px 0;
//     }
//     .subtitle {
//       font-size: 14px;
//       color: var(--nat-muted);
//       margin-bottom: 18px;
//     }
//     .section {
//       margin-top: 12px;
//     }
//     label {
//       display: block;
//       font-size: 14px;
//       font-weight: 500;
//       margin-bottom: 6px;
//     }
//     .hint {
//       font-size: 12px;
//       color: var(--nat-muted);
//       margin-top: 4px;
//     }
//     input[type="text"],
//     input[type="tel"],
//     textarea {
//       width: 100%;
//       padding: 11px 12px;
//       border-radius: 10px;
//       border: 1px solid var(--nat-border);
//       font-size: 15px;
//       outline: none;
//       background: #f9fafb;
//       transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
//     }
//     input:focus,
//     textarea:focus {
//       border-color: var(--nat-sub);
//       background: #ffffff;
//       box-shadow: 0 0 0 1px rgba(24, 32, 239, 0.12);
//     }
//     textarea {
//       min-height: 90px;
//       resize: vertical;
//     }
//     .actions {
//       display: flex;
//       flex-direction: column;
//       gap: 8px;
//       margin-top: 20px;
//     }
//     .actions.actions-horizontal {
//       flex-direction: column;
//       gap: 8px;
//     }
//     .btn-primary {
//       display: inline-flex;
//       align-items: center;
//       justify-content: center;
//       width: 100%;
//       padding: 12px 14px;
//       border-radius: 999px;
//       border: none;
//       background: var(--nat-sub);
//       color: #ffffff;
//       font-size: 16px;
//       font-weight: 600;
//       cursor: pointer;
//       text-decoration: none;
//       transition: background 0.15s ease, transform 0.05s ease, box-shadow 0.15s ease;
//       box-shadow: 0 12px 25px rgba(24, 32, 239, 0.28);
//     }

//         .btn-secondary {
//       display: inline-flex;
//       align-items: center;
//       justify-content: center;
//       width: 100%;
//       padding: 11px 14px;
//       border-radius: 999px;
//       border: 1px solid var(--nat-sub);
//       background: #ffffff;
//       color: var(--nat-sub);
//       font-size: 15px;
//       font-weight: 600;
//       cursor: pointer;
//       text-decoration: none;
//       transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
//     }
//     .btn-secondary:hover {
//       background: rgba(24, 32, 239, 0.04);
//       box-shadow: 0 4px 10px rgba(15, 23, 42, 0.1);
//     }

//     .btn-primary:active {
//       transform: translateY(1px);
//       box-shadow: 0 8px 18px rgba(24, 32, 239, 0.25);
//     }
//     .badge {
//       display: inline-flex;
//       align-items: center;
//       padding: 3px 10px;
//       border-radius: 999px;
//       background: rgba(24, 32, 239, 0.06);
//       color: var(--nat-sub);
//       font-size: 11px;
//       font-weight: 500;
//       margin-bottom: 4px;
//     }
//     .field-row {
//       margin-top: 14px;
//     }
//     .footer-note {
//       margin-top: 14px;
//       font-size: 12px;
//       color: var(--nat-muted);
//     }

//     .public-header {
//       margin-bottom: 14px;
//     }

//     .global-footer {
//       margin-top: 20px;
//       padding-top: 10px;
//       border-top: 1px solid #e5e7eb;
//       font-size: 12px;
//       color: var(--nat-muted);
//       text-align: left;
//     }
//     .global-footer strong {
//       font-weight: 600;
//       color: var(--nat-text);
//     }

//     @media (max-width: 480px) {
//       .wrap {
//         padding: 22px 16px 18px;
//         border-radius: 16px;
//       }
//       h1 {
//         font-size: 20px;
//       }
//     }



//   </style>
//   </head>

//   <body>
//   <div class="wrap">` + html + `</div>
//   </body>
//   </html>`;
// }

function page(html: string, title = '분실방지본부 NAT 태그'): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root {
      --nat-main: #FF4E42;
      --nat-sub: #1820EF;
      --nat-bg: #f3f4f6;
      --nat-border: #d1d5db;
      --nat-text: #111827;
      --nat-muted: #6b7280;
    }
    * {
      box-sizing: border-box;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: var(--nat-bg);
      color: var(--nat-text);
    }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      font-size: 16px;
      line-height: 1.6;
    }
    .wrap {
      width: 100%;
      max-width: 460px;
      background: #FAFAED;
      border-radius: 18px;
      border: 1px solid var(--nat-border);
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.18);
      padding: 24px 20px 20px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }
    .brand-mark {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      flex-shrink: 0;
      /* TODO: 여기 경로를 실제 NAT 로고 파일 경로로 바꾸세요. 예: /assets/nat-mark.svg */
      background:
        url("/nat-brand-mark.svg") center/contain no-repeat,
        linear-gradient(135deg, var(--nat-sub), var(--nat-main));
    }
    .brand-name {
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      color: var(--nat-sub);
    }
    h1 {
      font-size: 25px;
      margin: 4px 0 6px 0;
    }
    .subtitle {
      font-size: 15px;
      color: #272727ff;
      margin-bottom: 18px;
    }
    .section {
      margin-top: 12px;
    }
    label {
      display: block;
      font-size: 16px;
      font-weight: 500;
      margin-left: 1px;
      margin-bottom: 6px;
    }
    .hint {
      font-size: 13px;
      color: var(--nat-muted);
      margin-top: 2px;
      margin-left: 1px;
    }
    input[type="text"],
    input[type="tel"],

    textarea {
      width: 100%;
      padding: 11px 12px;
      border-radius: 10px;
      border: 1px solid var(--nat-border);
      font-size: 15px;
      outline: none;
      background: #f2f3f4ff;
      transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
    }
    input:focus,
    textarea:focus {
      border-color: var(--nat-sub);
      background: #ffffff;
      box-shadow: 0 0 0 1px rgba(24, 32, 239, 0.12);
    }
    textarea {
      min-height: 90px;
      resize: vertical;
    }
    .actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 20px;
    }
    .btn-primary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 12px 14px;
      border-radius: 999px;
      border: none;
      background: var(--nat-sub);
      color: #ffffff;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: background 0.15s ease, transform 0.05s ease, box-shadow 0.15s ease;
      box-shadow: 0 11px 20px rgba(24, 32, 239, 0.28);
    }
    .btn-primary:active {
      transform: translateY(1px);
      box-shadow: 0 8px 18px rgba(24, 32, 239, 0.25);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 999px;
      background: rgba(24, 32, 239, 0.06);
      color: var(--nat-sub);
      font-size: 11px;
      font-weight: 500;
      margin-bottom: 4px;
    }
    .field-row {
      margin-top: 15px;
    }
    .footer-note {
      margin-top: 16px;
      font-size: 13px;
      color: var(--nat-muted);
    }
    @media (max-width: 480px) {
      .wrap {
        padding: 22px 16px 18px;
        border-radius: 16px;
      }
    }


    /* 새로 추가해보는 내용 */
        /* 공개 페이지 전용 카드 레이아웃 */
    .public-card {
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid var(--nat-border);
      padding: 18px 16px 16px;
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.15);
      margin-bottom: 12px;
    }

    .public-footer-card {
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid var(--nat-border);
      padding: 14px 16px 16px;
      box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
      font-size: 13px;
      color: var(--nat-muted);
    }

    .public-footer-card strong {
      font-weight: 600;
      color: var(--nat-text);
    }

    .actions.actions-horizontal {
      flex-direction: column;
      gap: 8px;
    }

    .btn-secondary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 11px 14px;
      border-radius: 999px;
      border: 1px solid var(--nat-sub);
      background: #ffffff;
      color: var(--nat-sub);
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
    }
    .btn-secondary:hover {
      background: rgba(24, 32, 239, 0.04);
      box-shadow: 0 4px 10px rgba(15, 23, 42, 0.1);
    }

    .public-header {
      margin-bottom: 14px;
    }

  </style>
</head>
<body>
  <main class="wrap">
    ${html}    
  </main>
</body>
</html>`;
}


function renderRegister(idForHidden: string) {
  // views/registerPage.ts에서 가져온 "내용"을 page()로 감싸서 전체 HTML로 만든다
  return page(
    renderRegisterInner(idForHidden),
    'NAT 태그 등록 · 분실방지본부'
  );
}

  // SNS 링크에 http/https가 없으면 붙여 주는 함수
function normalizeLinkUrl(url: string): string {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return 'https://' + trimmed;
}

// SNS URL 안의 키워드로 버튼 라벨을 정하는 함수
function buildSnsLabel(url: string): string {
  const lower = String(url).toLowerCase();
  if (lower.includes('instagram')) return '인스타그램으로 연락';
  if (lower.includes('insta')) return '인스타그램으로 연락';
  if (lower.includes('kakao')) return '카카오톡으로 연락';
  if (lower.includes('open.kakao')) return '카카오톡 오픈채팅으로 연락';
  return '링크로 연락하기';
}

/*function renderPublic(pub: any) {
  const lines: string[] = [];
  if (pub?.phone) {
    const norm = normalizePhone(pub.phone);
    lines.push(
      `<p>전화: <a class="tel" href="tel:${norm.tel}"><strong>${norm.display}</strong></a></p>`
    );
  }
  if (pub?.sns) {
    const link = String(pub.sns);
    const isURL = /^https?:\/\//i.test(link);
    lines.push(
      `<p>SNS: ${
        isURL ? `<a href="${link}" target="_blank" rel="noopener">${link}</a>` : link
      }</p>`
    );
  }
  const msg = pub?.message ? `<h2>메시지</h2><div class="msg">${pub.message}</div>` : ``;
  return page(
    `<h1>분실물을 찾아주셔서 감사합니다</h1>${lines.join('')}${msg}
     <p class="muted">※ 연락은 직접 진행해주세요. (번호/링크가 공개되어 있습니다)</p>`,
    '연락하기'
  );
}*/

function renderPublic(pub: any) {
  // 1) 연락처 처리
  const rawContact = (pub.contact || pub.phone || '').toString().trim();
  const contactDigits = rawContact.replace(/\s+/g, '');
  const telHref = rawContact ? `tel:${contactDigits}` : '';
  const smsHref = rawContact ? `sms:${contactDigits}` : '';

  // 2) SNS 처리
  const rawSns = (pub.sns || '').toString().trim();
  const snsUrl = rawSns ? normalizeLinkUrl(rawSns) : '';
  const snsLabel = rawSns ? buildSnsLabel(rawSns) : '';

  // 3) 메시지 기본값 처리
  const defaultMessage =
    '물건을 발견해 주셔서 감사합니다. 편한 방법으로 연락 부탁드립니다.';
  const rawMessage = (pub.message || '').toString().trim();
  const message = rawMessage.length > 0 ? rawMessage : defaultMessage;

  return page(
    `
    <!-- ① 위쪽 정보 영역 박스 -->
    <!-- <div class="public-card"> -->

    <div class="brand">
      <div class="brand-mark"></div>
      <div class="brand-name">분실방지본부(NOT-A-TAG, NAT)</div>
    </div>

    <div class="public-header">
      <span class="badge">Found item</span>
      <h1>찾아주셔서 감사합니다</h1>
      <p class="subtitle">
        분실물을 발견해 주셔서 감사합니다. 아래 버튼을 눌러 주인에게 바로 연락해 주세요.
      </p>
    </div>

    <div class="section">
      ${
        rawContact
          ? `
        <div class="public-box">
          <!-- <div class="public-label">연락처</div> -->
          <!-- <div class="public-value">${rawContact}</div> -->
          <div class="actions actions-horizontal" style="margin-top:10px;">
            <a class="btn-primary" href="${telHref}">전화하기</a>
          </div>
          <div class="actions actions-horizontal" style="margin-top:10px;">
            <a class="btn-secondary" href="${smsHref}">문자 보내기</a>
          </div>
        </div>
      `
          : `
        <div class="public-box">
          <div class="public-label">연락처</div>
          <div class="public-value">표시된 전화번호가 없습니다.</div>
        </div>
      `
      }

      ${
        snsUrl
          ? `
        <div class="public-box">
          <!-- <div class="public-label">SNS·링크</div> -->
          <div class="actions" style="margin-top:10px;">
            <a class="btn-secondary" href="${snsUrl}" target="_blank" rel="noopener noreferrer">
              ${snsLabel}
            </a>
          </div>
        </div>
      `
          : ''
      }

      <div class="public-box">
        <div class="public-label">주인 메시지</div>
        <div class="public-value">
          ${message.replace(/\n/g, '<br/>')}
        </div>
      </div>
    </div>
    <!-- </div> -->

 <!-- ② 아래쪽 푸터 전용 박스 -->
    <div class="public-footer-card">
      <strong>분실방지본부(NAT)</strong>는
      QR코드를 통해 잃어버린 물건과 주인을 빠르게 이어주는 디지털 네임택 서비스 입니다. <br/>
      분실로 인한 낭비를 줄이고, 다시 돌아오는 경험을 일상으로 만듭니다.
    </div>

  `,
    '분실물 연락 정보 · 분실방지본부'
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
    console.error(e);
    return res.status(500).send(page('<h1>오류</h1><p>일시적인 오류가 발생했습니다.</p>'));
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
    const message = (req.body.message ? String(req.body.message) : '').slice(0, 140);

    if (!contactRaw && !snsRaw) {
      return res
        .status(400)
        .send(page('<h1>오류</h1><p>전화번호 또는 SNS 중 하나 이상을 입력해주세요.</p>'));
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
  } catch (e: any) {
    console.error(e);
    const msg = /not issued/.test(e?.message)
      ? '유효하지 않은 태그입니다.'
      : /already/.test(e?.message)
      ? '이미 등록된 태그입니다.'
      : '등록 중 오류가 발생했습니다.';
    return res.status(400).send(page(`<h1>등록 실패</h1><p>${msg}</p>`));
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
