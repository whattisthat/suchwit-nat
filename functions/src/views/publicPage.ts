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
  const hasAnyContact = props.hasPhone || props.hasSnsLink;

  // 1) 전화번호 표시용 (+82 10 1234 5678)
  const phoneDisplay =
    props.hasPhone ? formatDisplayPhoneFromHref(props.telHref) : "";

  const phoneNumberHtml = phoneDisplay
    ? `
      <a class="public-phone-number" href="${props.telHref}">
        ${phoneDisplay}
      </a>
    `
  : "";
    
  // 2) PNG 아이콘 버튼: 전화하기 / 문자 보내기
  //   - 아이콘 파일은 Firebase Hosting 기준:
  //     hosting/img/icon-call.png  →  /img/icon-call.png
  //     hosting/img/icon-sms.png   →  /img/icon-sms.png
  const callButton = props.hasPhone
    ? `
      <a class="public-phone-button" href="${props.telHref}">
        <img class="public-phone-icon" src="/img/icon-call.png" alt="call icon" />
        <span class="public-phone-label">전화하기</span>
      </a>`
    : "";

  const smsButton = props.hasPhone
    ? `
      <a class="public-phone-button" href="${props.smsHref}">
        <img class="public-sms-icon" src="/img/icon-sms.png" alt="sms icon" />
        <span class="public-phone-label">문자 보내기</span>
      </a>`
    : "";

  const noContactNotice = hasAnyContact
    ? ""
    : `
      <p class="public-notice">
        이 태그에는 등록된 연락처 정보가 없습니다.<br />
        불편을 끼쳐 드려 죄송합니다.
      </p>`;

  // 3) 링크로 연락하기 영역 (URL 전체 표시 + 클릭 시 이동)
  const linkSection = props.hasSnsLink
    ? `
    <a class="public-link-section"
       href="${props.snsHref}"
       target="_blank"
       rel="noopener noreferrer">
      <div class="public-link-card">
        <div class="public-link-header">
          <h2 class="public-link-title">링크로 연락하기</h2>
          <span class="public-link-arrow" aria-hidden="true">→</span>
        </div>
        <div class="public-link-body">
          ${escapeHtml(props.snsHref)}
        </div>
      </div>
    </a>`
  : "";

  // 4) 주인이 남기는 말
  
  const messageText = props.message || "";
  const messageHtml = escapeHtml(messageText)
    .split("\n")
    .map((line) => `<p>${line}</p>`)
    .join("");

  const messageSection = `
    <section class="public-message-section">
      <div class="public-link-card">
        <div class="public-message-header">
          <h2 class="public-link-title">주인이 보내는 말</h2>
        </div>
        <div class="public-message-body">
          ${messageHtml}
        </div>
      </div>
    </section>`;


  return `
   <div class="public-logo">
      <img
        src="/img/nat-cactus.png"
        alt="분실방지본부 NAT"
        class="public-logo-img"
      />
    </div>

    <h1 class="public-title">물건을 발견하셨나요?</h1>

    <p class="public-subtitle">
      이 QR은 <strong>‘분실방지본부’</strong>와 연결되어 있습니다.<br />
      당신의 친절로, 잃어버린 물건이<br />
      주인에게 돌아갈 수 있습니다.
    </p>

    ${phoneNumberHtml}

    <section class="public-actions">
      ${
        props.hasPhone
          ? `
        <div class="public-phone-buttons">
          ${callButton}
          ${smsButton}
        </div>`
          : ""
      }
      ${noContactNotice}
    </section>

    ${linkSection}

    ${messageSection}

    <section class="public-service-section">
      <div class="public-service-card">
        <p>
          분실방지본부(NAT)는 QR코드를 통해<br />
          잃어버린 물건과 주인을 빠르게 이어주는<br />
          디지털 네임태그 서비스입니다.
        </p>
      </div>
    </section>

    <a class="brand-footer" href="https://suchwit.bullet.site/" target="_blank" rel="noopener noreferrer">
    분실방지본부 NAT
    </a>
  `;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// telHref에서 숫자만 뽑아 +82 10 1234 5678 형태로 변환
function formatDisplayPhoneFromHref(telHref: string): string {
  const digits = (telHref || "").replace(/\D/g, "");
  if (!digits) return "";

  let country = "82";
  let local = digits;

  // tel:+821012345678 / tel:8210... 형태
  if (digits.startsWith("82")) {
    local = digits.slice(2);
    if (local.startsWith("0")) {
      local = local.slice(1);
    }
  } else if (digits.startsWith("0")) {
    // tel:01012345678 형식
    local = digits.slice(1);
  }

  // 한국 휴대폰(9~10자리) 기준: 10-1234-5678, 10-123-4567 등
  if (local.length >= 9 && local.length <= 10) {
    const firstTwo = local.slice(0, 2);
    const middle = local.slice(2, local.length - 4);
    const last4 = local.slice(-4);
    //return `+${country} ${firstTwo} ${middle} ${last4}`;
    return `+${country} ${firstTwo}-${middle}-${last4}`;
  }

  // 그 외 길이는 그냥 붙임
  return `+${country} ${local}`;
}
