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
export function page(html: string, title = '분실방지본부 NAT 태그', 
  pageClass: 'page-register' | 'page-public' = 'page-register'
): string {
  return `<!DOCTYPE html>
<html lang="ko">

<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <style>
     * { 
      box-sizing: border-box; 
      margin: 0; 
      padding: 0; 
      -webkit-tap-highlight-color: transparent; 
      }

    html {
      width: 100%;
      height: 100%;
      -webkit-text-size-adjust: 100%;
      -moz-text-size-adjust: 100%;
      text-size-adjust: 100%;
    }
    
    body {
      width: 100%;
      min-height: 100vh;
      min-height: 100dvh;
      font-family: -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'SF Pro Display', system-ui, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      overflow-x: hidden;
      position: relative;
    }

    /* Register 페이지용 전체 배경 – 뷰포트 고정 */
    body.page-register {
      position: relative;
      background: none; /* 기존 background 제거 */
    }

    /* 뷰포트 전체를 덮는 고정 그라데이션 레이어 */
    body.page-register::before {
      content: "";
      position: fixed;
      inset: 0;                 /* top:0; right:0; bottom:0; left:0; 와 동일 */
      z-index: -1;
      background: linear-gradient(
        180deg,
        #F8F9FE 0%,
        #FFFEF8 50%,
        #FFF7F5 100%
      );
      pointer-events: none;     /* 클릭 막지 않도록 */
    }

    body.page-public {
      background: linear-gradient(180deg,
        #FFFEF8 0%,
        #FFF9F5 100%);
    }


    
    /* ========================================
       등록 페이지 전용 스타일 (register-page)
       ======================================== */
    
    .register-page {
      min-height: 100vh;
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
    }
    
    .register-page .container {
      flex: 1;
      width: 100%;
      max-width: 480px;
      margin: 0 auto;
      padding: 32px 24px 32px;
      display: flex;
      flex-direction: column;
    }
    
    .register-page .help-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 40px;
    }
    
    .register-page .help-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 16px;
      border-radius: 24px;
      background: rgba(255, 78, 66, 0.1);
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      color: #FF4E42;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);  /* iOS Safari */
    }
    
    .register-page .help-link:active {
      transform: scale(0.95);
      background: rgba(255, 78, 66, 0.18);
    }
    
    .register-page .help-icon {
      width: 16px;
      height: 16px;
    }
    
    .register-page .header {
      text-align: center;
      margin-bottom: 48px;
    }
    
    .register-page h1 {
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.03em;
      line-height: 1.2;
      color: #000000;
      margin-bottom: 16px;
    }
    
    .register-page .subtitle {
      font-size: 16px;
      line-height: 1.5;
      color: #666666;
      font-weight: 400;
    }
    
    .register-page .highlight {
      color: #FF4E42;
      font-weight: 600;
    }
    
    .register-page .form-section {
      flex: 1;
    }
    
    .register-page .field-group {
      margin-bottom: 28px;
    }
    
    .register-page .field-label {
      display: block;
      font-size: 15px;
      font-weight: 600;
      color: #000000;
      margin-bottom: 12px;
      letter-spacing: -0.01em;
    }
    
    .register-page .field-input {
      width: 100%;
      padding: 17px 18px;
      border: 2px solid #E8E8E8;
      border-radius: 14px;
      font-size: 17px;
      color: #000000;
      background: #FFFFFF;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      -webkit-appearance: none;
      appearance: none;  /* iOS 기본 스타일 제거 */
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    }
    
    .register-page .field-input::placeholder {
      color: #AAAAAA;
    }
    
    .register-page .field-input:focus {
      outline: none;
      border-color: #1820EF;
      background: #FFFFFF;
      box-shadow: 0 0 0 4px rgba(24, 32, 239, 0.1),
                  0 2px 8px rgba(0, 0, 0, 0.08);
      transform: translateY(-1px);
    }
    
    .register-page .field-input:not(:placeholder-shown) {
      border-color: #D0D0D0;
    }
    
    .register-page textarea.field-input {
      min-height: 110px;
      resize: vertical;
      line-height: 1.5;
      font-family: inherit;
      padding-bottom: 42px;
    }
    
    .register-page .message-wrapper {
      position: relative;
    }
    
    .register-page .char-count {
      position: absolute;
      right: 18px;
      bottom: 14px;
      font-size: 13px;
      color: #AAAAAA;
      font-weight: 500;
      pointer-events: none;
    }
    
    .register-page .field-hint {
      margin-top: 10px;
      font-size: 13px;
      color: #888888;
      line-height: 1.4;
    }
    
    .register-page .actions {
      margin-top: 40px;
    }
    
    .register-page .btn-primary {
      width: 100%;
      padding: 18px 24px;
      border: none;
      border-radius: 14px;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: #FFFFFF;
      background: linear-gradient(135deg, #1820EF 0%, #4A52F5 100%);
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 6px 20px rgba(24, 32, 239, 0.25);
      position: relative;
      overflow: hidden;
      -webkit-appearance: none;
      appearance: none;
    }
    
    .register-page .btn-primary::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 100%);
      opacity: 0;
      transition: opacity 0.3s;
    }
    
    .register-page .btn-primary:active {
      transform: scale(0.98);
      box-shadow: 0 4px 12px rgba(24, 32, 239, 0.3);
    }
    
    .register-page .btn-primary:active::before {
      opacity: 1;
    }
    
    .register-page .btn-primary:disabled {
      cursor: not-allowed;
      background: #E0E0E0;
      color: #999999;
      box-shadow: none;
      transform: none;
    }

    /* 등록 완료 확인 팝업 */
    .register-page .confirm-modal {
      position: fixed;
      inset: 0;
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .register-page .confirm-modal.is-open {
      display: flex;
    }

    .register-page .confirm-modal-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(15, 23, 42, 0.35);
      backdrop-filter: blur(2px);
      -webkit-backdrop-filter: blur(2px);
    }

    .register-page .confirm-modal-dialog {
      position: relative;
      background: #f9f8f3ff;
      border-radius: 16px;
      padding: 20px 18px 16px;
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.28);
      max-width: 325px;
      width: calc(100% - 48px);
      animation: confirm-modal-in 0.18s ease-out;
    }

    .register-page .confirm-modal-message {
      font-size: 16px;
      line-height: 1.6;
      color: #000000;
      text-align: center;
    }

    .register-page .confirm-modal-actions {
      display: flex;
      gap: 8px;
      margin-top: 18px;
    }

    /* 팝업 버튼: 좌측 취소, 우측 완료 / 모바일 터치 최적화 */
    .register-page .confirm-modal-actions .btn-secondary,
    .register-page .confirm-modal-actions .btn-primary {
      flex: 1;
      height: 44px;
      font-size: 15px;
      font-weight: 600;
      border-radius: 16px; 
      border: none;
      box-shadow: none;

      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 14px;
      line-height: 1;
    }

    .register-page .confirm-modal-actions .btn-secondary {
      background: #E0E0E0;    
      color: #999999;         
    }

    .register-page .confirm-modal-actions .btn-primary {
      background: #1820EF;    
      color: #FFFFFF;         
    }

    @keyframes confirm-modal-in {
      from {
        opacity: 0;
        transform: translateY(18px);
      }
      to {
        opacity: 1;
        transform: translateY(6px);
      }
    }
    
    .register-page .footer-info {
      margin-top: 32px;
      padding-top: 28px;
      border-top: 1px solid rgba(0, 0, 0, 0.06);
    }
    
    .register-page .privacy-note {
      text-align: center;
      font-size: 13px;
      line-height: 1.6;
      color: #888888;
      margin-bottom: 16px;
    }
    
    .register-page .privacy-note strong {
      font-weight: 600;
      color: #000000;
    }
    
    .brand-footer {
      text-align: center;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.02em;
      background: linear-gradient(135deg, #1820EF 20%, #FF4E42 80%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-top: 12px;
      display: inline-block;
      text-decoration: none;
      cursor: pointer;
      target="_blank" /* (같은 탭 이동). */
      display: flex;
      justify-content: center;
    }
    
    @media (min-width: 768px) {
      .register-page .container {
        padding: 60px 32px 40px;
      }
      
      .register-page h1 {
        font-size: 36px;
      }
    }
    
    @media (max-height: 700px) {
      .register-page .container {
        padding: 24px 24px 24px;
      }
      
      .register-page .header {
        margin-bottom: 32px;
      }
      
      .register-page .field-group {
        margin-bottom: 20px;
      }
      
      .register-page .help-section {
        margin-bottom: 28px;
      }
    }

    /* ========================================
       공개 페이지 전용 스타일 
       ======================================== */
    
    main {
      max-width: 480px;
      margin: 0 auto;
      padding: 32px 20px 40px;
      min-height: 100vh;
      min-height: 100dvh;
    }
    
    /* 로고 */
    .public-logo {
      display: flex;
      justify-content: center;
      margin-bottom: 20px;
    }
    
    .public-logo-img {
      width: 95px;
      height: auto;
      display: block;
    }
    
    /* 타이틀 */
    .public-title {
      text-align: center;
      font-size: 28px;
      line-height: 1.3;
      font-weight: 700;
      margin: 0 0 16px;
      color: #000000;
      /* letter-spacing: -0.02em; */
    }
    
    .public-subtitle {
      text-align: center;
      font-size: 15px;
      line-height: 1.6;
      color: #666666;
      margin: 0 0 32px;
      padding: 0 10px;
    }
    
    .public-subtitle strong {
      color: #FF4E42;
      font-weight: 600;
    }
    
    .public-phone-number {
      margin: 28px 0 24px;
      font-size: 28px;
      font-weight: 700;
      text-align: center;
      color: #1820EF;
      letter-spacing: -0.02em;
      cursor: pointer;
      text-decoration: none;
      display: block;
      transition: all 0.2s;
    }
    
    /* 이 기능은 PC에서만 적용되고 모바일에서는 계속 underline이 표시되고 있음
    .public-phone-number:hover {
      text-decoration: underline;
    }*/ 
    
    .public-phone-number:active {
      transform: scale(0.98);
    }
    
    /* 연락 액션 */
    .public-actions {
      margin-bottom: 20px;
    }
    
    .public-phone-buttons {
      display: flex;
      gap: 12px;
      margin-bottom: 12px;
    }
    
    .public-phone-button {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 18px 18px;
      border-radius: 16px;
      background: #1820EF;
      color: #ffffff;
      text-decoration: none;
      font-size: 16px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      border: none;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

      /* flex-direction: column; */
    }

.public-phone-button,
.public-phone-button * {
  color: #ffffff !important;
}

  .public-phone-button:visited {
    color: #ffffff;
    }
      
    
    .public-phone-button:active {
      transform: scale(0.97);
      box-shadow: 0 4px 12px rgba(24, 32, 239, 0.15);
    }
    
    .public-phone-icon {
      width: 20px;
      height: 20px
    }
    .public-sms-icon {
      width: 20px;
      height: auto;
    }
    
    .public-phone-label {
      font-size: 16px;
      font-weight: 600;
      color: #ffffff;
    } 


    /* 안내 문구 */
    .public-notice {
      text-align: center;
      font-size: 14px;
      line-height: 1.6;
      color: #888888;
      padding: 24px 20px;
      background: #FFFFFF;
      border-radius: 16px;
      border: 2px solid #E8E8E8;
      margin-bottom: 20px;
    }
    
    /* 링크 섹션 */
    .public-link-section {
      display: block;
      text-decoration: none;
      margin-bottom: 20px;
    }
    
    .public-link-card {
      border-radius: 16px;
      background: #FFFFFF;
      padding: 20px;
      border: 2px solid #E8E8E8;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }
    
    .public-link-section:active .public-link-card {
      transform: scale(0.98);
      border-color: #1820EF;
      box-shadow: 0 4px 12px rgba(24, 32, 239, 0.15);
    }
    
    .public-link-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    
    .public-link-title {
      font-size: 16px;
      font-weight: 700;
      color: #1820EF;
      margin: 0;
    }
    
    .public-link-arrow {
      font-size: 20px;
      color: #1820EF;
    }
    
    .public-link-body {
      font-size: 13px;
      color: #666666;
      word-break: break-all;
      line-height: 1.5;
    }
    
    /* 메시지 섹션 */
    .public-message-section {
      margin-bottom: 20px;
    }
    
    .public-message-header {
      margin-bottom: 10px;
    }
    
    .public-message-body {
      font-size: 15px;
      line-height: 1.6;
      color: #333333;
    }
    
    .public-message-body p {
      margin: 0 0 8px;
    }
    
    .public-message-body p:last-child {
      margin-bottom: 0;
    }
    
    /* 서비스 안내 카드: 분실방지본부 설명 */
    .public-service-section {
      margin-bottom: 24px;
    }
    
    .public-service-card {
      border-radius: 16px;
      padding: 20px;
      background: linear-gradient(135deg, #FF4E42 0%, #FF6B5E 100%);
      color: #FFFFFF;
      text-align: center;
      box-shadow: 0 4px 16px rgba(255, 78, 66, 0.25);
    }
    
    .public-service-card p {
      font-size: 13px;
      line-height: 1.6;
      margin: 0;
    }
    
    @media (min-width: 768px) {
      main {
        padding: 60px 32px 48px;
      }
      
      .public-title {
        font-size: 32px;
      }
    }

  /* Safe Area 대응 */
    @supports (padding: max(0px)) {
      .register-page .container,
      main {
        padding-left: max(24px, env(safe-area-inset-left));
        padding-right: max(24px, env(safe-area-inset-right));
        padding-bottom: max(32px, env(safe-area-inset-bottom));
      }
    }

  </style>
</head>
<body class="${pageClass}">
  <main>
    ${html}
  </main>
</body>
</html>`;
}