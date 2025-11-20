// functions/src/views/publicPage.ts

export type PublicPageProps = {
  hasPhone: boolean;
  telHref: string;
  smsHref: string;
  hasSnsLink: boolean;
  snsHref: string;
  message: string; // \n 포함한 순수 텍스트
};

export function renderPublicView(props: PublicPageProps): string {
  const smsButton = props.hasPhone
    ? `
      <a class="public-button" href="${props.smsHref}">
        <span class="public-button-icon" aria-hidden="true">
          <!-- 메시지 아이콘 -->
          <svg viewBox="0 0 24 24" class="icon-svg">
            <rect x="3" y="5" width="18" height="14" rx="3" ry="3"></rect>
            <polyline points="4,7 12,12 20,7"></polyline>
          </svg>
        </span>
        <span class="public-button-label">물건 주인에게 문자보내기</span>
      </a>`
    : "";

  const callButton = props.hasPhone
    ? `
      <a class="public-button" href="${props.telHref}">
        <span class="public-button-icon" aria-hidden="true">
          <!-- 전화 아이콘 -->
          <svg viewBox="0 0 24 24" class="icon-svg">
            <path d="M7 4c.4-1 1.3-1.4 2.1-1.1l2.1.8c.7.3 1.1 1 1 1.8L12 8c0 .4-.2.7-.5.9l-1.4 1.1a10.7 10.7 0 0 0 4 4l1.1-1.4c.2-.3.6-.5.9-.5l2.4.2c.8.1 1.5.6 1.8 1.3l.8 2.1c.3.8-.1 1.7-1.1 2.1-1.6.7-3.5.9-5.8.3-2.1-.5-4.1-1.6-6-3.4-1.9-1.8-3.1-3.7-3.7-5.7C4 7.5 4.2 5.6 5 4Z"></path>
          </svg>
        </span>
        <span class="public-button-label">물건 주인에게 연락하기</span>
      </a>`
    : "";

  const linkButton = props.hasSnsLink
    ? `
      <a class="public-button" href="${props.snsHref}" target="_blank" rel="noopener noreferrer">
        <span class="public-button-icon" aria-hidden="true">
          <!-- 링크 아이콘 -->
          <svg viewBox="0 0 24 24" class="icon-svg">
            <path d="M10.5 7.5 9.1 9a3.5 3.5 0 0 0 5 5l1.4-1.4"></path>
            <path d="M13.5 16.5 15 15a3.5 3.5 0 0 0-5-5L8.6 11.4"></path>
          </svg>
        </span>
        <span class="public-button-label">링크로 연락하기</span>
      </a>`
    : "";

  const hasAnyContact = props.hasPhone || props.hasSnsLink;

  const noContactNotice = hasAnyContact
    ? ""
    : `
      <p class="public-notice">
        이 태그에는 등록된 연락처 정보가 없습니다.<br />
        불편을 끼쳐 드려 죄송합니다.
      </p>`;

  const messageHtml = escapeHtml(props.message)
    .split("\n")
    .map((line) => `<p>${line}</p>`)
    .join("");

  return `
    <h1 class="public-title">주인과 연결할까요?</h1>

    <p class="public-subtitle">
      이 QR은 <strong>‘분실방지본부’</strong>와 연결되어 있습니다.<br />
      당신의 친절로, 잃어버린 물건이<br />
      주인에게 돌아갈 수 있습니다.
    </p>

    <section class="public-actions">
      ${smsButton}
      ${callButton}
      ${linkButton}
      ${noContactNotice}
    </section>

    <section class="public-message-section">
      <h2 class="public-message-title">습득자에게 전하는 메시지</h2>
      <div class="public-message-card">
        ${messageHtml}
      </div>
    </section>

    <section class="public-service-section">
      <div class="public-service-card">
        <p>
          분실방지본부(NAT)는 QR코드를 통해 잃어버린 물건과 주인을 빠르게 이어주는
          디지털 네임태그 서비스입니다.<br />
          분실로 인한 낭비를 줄이고, 다시 돌아오는 경험을 일상으로 만듭니다.
        </p>
      </div>
    </section>

    <p class="register-footer-brand">NAT by 분실방지본부</p>
  `;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
