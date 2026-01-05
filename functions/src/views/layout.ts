// functions/src/views/layout.ts
import { Request } from "express";

/**
 * 오류가 났을 때, 개발자에게 보내는 mailto 링크를 만들어 주는 함수
 */
export function buildErrorMailto(title: string, e: any, req?: Request): string {
  const to = 'suchwit.wit@gmail.com'; // 실제 사용할 분실방지본부 개발자 메일로 교체
  const subject = `[NAT 오류 신고] ${title}`; // 메일 제목
  const parts: string[] = [];

  // 1) 상단 안내 문구
  parts.push("안녕하세요, 분실방지본부 오류 신고 메일입니다.");
  parts.push("아래 자동으로 채워진 정보를 그대로 두시고,");
  parts.push("맨 아래에 겪으신 상황을 간단히 적어 주세요.");
  parts.push("");
  parts.push("────────────────────────────");
  parts.push("");

  // 2) 자동 수집 정보
  parts.push(`페이지 URL: ${req?.originalUrl || "(알 수 없음)"}`);
  parts.push(`요청 메서드: ${req?.method || "(알 수 없음)"}`);

  // (선택) 사용자 브라우저 정보도 같이 넣고 싶다면:
  const ua = req?.headers["user-agent"] || "";
  parts.push(`사용자 환경(User-Agent): ${ua}`);

  parts.push("");
  parts.push("오류 메시지(내부 로그용):");
  parts.push(String(e && e.message ? e.message : e || "(메시지 없음)"));
  parts.push("");
  parts.push("────────────────────────────");
  parts.push("");

  // 3) 사용자가 직접 적을 영역
  parts.push("▶ 사용자가 겪은 상황을 적어 주세요:");
  parts.push("- 언제 발생했나요? (예: 2025-11-25 오후 3시경)");
  parts.push("- 어떤 QR을 스캔했고, 어떤 화면에서 오류가 났나요?");
  parts.push("- 참고할 만한 추가 정보가 있다면 적어 주세요.");
  parts.push("");
  parts.push("감사합니다.");

  const body = encodeURIComponent(parts.join('\n'));
  const subj = encodeURIComponent(subject);
  return `mailto:${to}?subject=${subj}&body=${body}`;
}

/**
 * 오류 페이지 HTML 조각 생성
 */
export function renderErrorWithMail(
  title: string,
  description: string,
  mailtoHref: string
): string {
  return `
    <h1>${title}</h1>
    <p>${description}</p>
    <p style="margin-top:16px;">
      <a href="${mailtoHref}" class="btn-secondary">
        분실방지본부에 오류 메일 보내기
      </a>
    </p>
  `;
}

/**
 * 공통 HTML 레이아웃
 * 👉 이 함수의 본문은 현재 index.ts에 있는 `function page(...)` 내용을
 *    그대로 복사해서 붙여넣으면 됩니다.
 */
export function page(html: string, title = '분실방지본부 NAT 태그'): string {
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
      position: relative;              /* 아이콘 absolute 기준 */
      width: 100%;
      max-width: 460px;
      background: #FAFAED;
      /* border-radius: 18px; */       /* CSS 주석은 이렇게 */
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
      font-size: 15px;
      font-weight: 600;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      color: var(--nat-sub);
    }

    h1 {
      text-align: center;
      font-size: 28px;
      line-height: 1.25;
      font-weight: 700;
      margin: 4px 0 8px;
      /* margin: 4px 0 6px 0; */
      color: #111827;
    }

    .register-title {
      margin-top: 30px;    /* 아이콘 바로 아래로, 필요하면 24까지 줄여도 됨 */
      margin-bottom: 16px;
      text-align: center;
    }

    .subtitle {
      font-size: 15px;
      color: #272727ff;
      margin-bottom: 18px;
    }
    .section {
      margin-top: 12px;
    }

    .register-header {
      position: absolute;
      top: 16px;     /* 카드 안 위쪽 여백 */
      right: 16px;   /* 카드 안 오른쪽 여백 */
    }

    /* 아이콘 링크 스타일 */
    .register-help-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 999px;
      text-decoration: none;
    }

    .register-help-icon {
      display: block;
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
      font-size: 16px;
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
      padding: 13px 15px;
      border-radius: 24px;
      border: none;
      background: var(--nat-sub) 16%;
      color: #ffffff;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: background 0.15s ease, transform 0.05s ease, box-shadow 0.15s ease;
      box-shadow: 0 10px 22px rgba(24, 32, 239, 0.10);
    }
    .btn-primary:active {
      transform: translateY(1px);
      box-shadow: 0 8px 18px rgba(24, 32, 239, 0.25);
    }

    .field-row {
      margin-top: 15px;
    }
    @media (max-width: 470px) {
      .wrap {
        padding: 22px 18px 18px;
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
      border-radius: 24px;
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

    /* 공통 타이포 / 배경 */
body {
  margin: 0;
  padding: 0;
  background-color: #fffdf1;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

/* 등록 페이지 레이아웃(모바일 기준) */
main {
  max-width: 480px;
  margin: 0 auto;
  padding: 24px 20px 40px;
  box-sizing: border-box;
}

/* 상단 헤더 */
.register-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 24px;
  font-size: 12px;
  font-weight: 500;
  background-color: #eef2ff;
  color: #1820ef;
  white-space: nowrap;
}

.register-help-link {
  font-size: 12px;
  color: #ff4e42;
  text-decoration: none;
}

.register-help-link:hover {
  text-decoration: underline;
}

.subtitle {
  text-align: center;
  font-size: 14px;
  line-height: 1.4;
  color: #111827;
  margin: 0 0 8px;
}

.subtitle-strong {
  color: #ff4e42;
  font-weight: 600;
  display: inline;
  margin: 0;
  padding: 0;
}

/* 전화/SNS/메시지 폼 */
.section {
  margin-top: 8px;
  margin-bottom: 24px;
}

.field-row {
  margin-bottom: 20px;
}

.field-row label {
  display: block;
  margin-bottom: 8px;
  margin-left: 2px;
  font-size: 15px;
  font-weight: 600;
  color: #000000;
}

/* 기본 상태: placeholder만 보일 때 배경 #DDDDDD */
.field-row input,
.field-row textarea {
  width: 100%;
  border-radius: 18px;
  border: none;
  padding: 14px 16px;
  box-sizing: border-box;
  background-color: #DDDDDD;
  font-size: 15px;
  color: #111827;
  transition: background-color 0.2s ease-out;
}

.field-row input::placeholder,
.field-row textarea::placeholder {
  color: #7A7A7A;
}

/* 사용자가 값을 입력해서 placeholder가 사라진 상태 */
.field-row input:not(:placeholder-shown),
.field-row textarea:not(:placeholder-shown) {
  background-color: #ffffff;  /* 더 밝은 색. 원하면 #FFFFFF로 변경 가능 */
}

.field-row textarea {
  min-height: 96px;
  resize: vertical;
}

.hint {
  margin-top: 2px;
  margin-left: 1px;
  font-size: 12px;
  color: #7A7A7A;
}


.message-box {
  position: relative;
}

.message-box textarea {
  width: 100%;
  box-sizing: border-box;
  padding-bottom: 33px; /* 카운터 자리 확보 */
}

/* 메시지 글자 수 */
.message-box .message-count {
  position: absolute;
  right: 13px;
  bottom: 11px;
  font-size: 12px;
  color: #A8A8A8;
  pointer-events: none; /* 클릭 방해 X */
}


/* 완료 버튼 */
.actions {
  margin-top: 16px;
  margin-bottom: 8px;
}

.btn-primary {
  width: 100%;
  border: none;
  border-radius: 24px;
  padding: 14px 16px;
  font-size: 16px;
  font-weight: 600;
  background-color: #1820ef;
  color: #ffffff;
  cursor: pointer;
  transition: opacity 0.15s ease, transform 0.05s ease;
}

.btn-primary:active {
  transform: translateY(1px);
}

.btn-primary:disabled {
  cursor: default;
  opacity: 0.6;
}

/* 안내 문구 / 브랜드 */
.footer-note {
  margin-top: 22px;
  text-align: center;
  font-size: 12px;
  line-height: 1.5;
  color: #6b7280;
  /* color: var(--nat-muted) */
}


.footer-note strong {
  font-weight: 600;
}

.register-footer-brand {
  margin-top: 12px;
  text-align: center;
  font-size: 13px;
  color: #ff4e42;
}

@media (min-width: 768px) {
  main {
    padding-top: 32px;
    padding-bottom: 48px;
  }
}

/* ===== public page ===== */

.public-logo {
  display: flex;
  justify-content: center;
  margin-bottom: 15px;  /* h1과의 간격, 필요하면 조절 */
}

.public-logo-img {
  width: 95px;   /* 원하는 크기로 조정 (예: 48, 64 등) */
  height: auto;
  display: block;
}


.public-title {
  text-align: center;
  font-size: 29px;
  line-height: 1.3;
  font-weight: 700;
  margin: 24px 0 12px;
  color: #111827;
}

.public-subtitle {
  text-align: center;
  font-size: 14px;
  line-height: 1.5;
  color: #111827;
  margin: 0 0 24px;
}

.public-subtitle strong {
  color: #ff4e42;
}

/* 전화번호 큰 글씨 */
.public-phone-number {
  margin-top: 16px;
  margin-bottom: 16px;
  font-size: 24px;
  font-weight: 700;
  text-align: center;
  text-decoration: none;
}


/* 버튼 리스트 */
/* 연락 버튼 묶음 */
.public-actions {
  margin-bottom: 20px;
  margin-left: 2px;
  margin-right: 2px;
}

.public-phone-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.public-phone-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 16px;
  border-radius: 16px;
  background-color: #1820EF; /* NAT 서브 블루 */
  color: #ffffff;
  text-decoration: none;
  font-size: 15px;
  font-weight: 600;

  box-shadow: 0 4px 4px rgba(0, 0, 0, 0.25);

}

.public-phone-button:active {
  opacity: 0.9;
}

.public-phone-icon {
  width: 20px;
  height: 20px;
}
.public-sms-icon {
  width: 20px;
  height: autopx;
}


/* 링크로 연락하기 카드 */
.public-link-section {
  margin-bottom: 20px;
  display: block;
  text-decoration: none;
  color: inherit;/* 유지해도 무방 */
}

.public-link-card {
  border-radius: 18px;
  background-color: #FAFAEE;
  padding: 10px 18px 16px;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
}

.public-link-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}

.public-link-title {
  font-size: 16px;
  font-weight: 700;
  color: #1820EF;
}

.public-link-arrow {
  font-size: 20px;
  color: #1820EF;
}

.public-link-body {
  display: block;
  font-size: 13px;
  color: #2a2c2eff;
  word-break: break-all;  /* URL 길어질 때 줄바꿈 */
  text-decoration: none;
}

.public-link-body:hover {
  text-decoration: underline;
}


/* 주인이 남기는 말 */
.public-message-section {
  margin-bottom: 20px;
}
.public-message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0px;
}
.public-message-body {
  display: block;
  font-size: 14px;
  color: #111827;
  word-break: break-all;  /* URL 길어질 때 줄바꿈 */
  text-decoration: none;
}



/* 연락처가 없을 때 메시지 */
.public-notice {
  margin-top: 8px;
  font-size: 14px;
  color: #6b7280;
  text-align: center;
}

/* 주인이 남기는 말 */
.public-message-section {
  margin-bottom: 24px;
}

.public-message-title {
  font-size: 16px;
  font-weight: 700;
  color: #1820EF;
  margin-bottom: 8px;
}

.public-message-card {
  border-radius: 18px;
  padding: 16px 18px;
  background-color: #f9fafb;
  font-size: 14px;
  color: #111827;
}

.public-message-card p {
  margin: 0 0 4px;
}

.public-message-card p:last-child {
  margin-bottom: 0;
}

/* 서비스 설명 카드 */

.public-service-card {
  border-radius: 18px;
  padding: 14px 16px;
  background-color: #FF4F42;
  color: #ffffff;
  font-size: 12px;
  line-height: 1.6;
  text-align: center;
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
