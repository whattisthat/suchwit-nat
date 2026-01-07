// functions/src/views/registerPage.ts

/**
 * /q/:id → 등록 화면의 "메인 내용"만 반환. 
 * 전체 HTML이 아니라 <body> 안에 들어갈 내용 부분만 반환합니다.
 */
export function renderRegisterInner(idForHidden: string): string {
  return `
  <div class="register-page">
    <div class="container">
      <div class="help-section">
        <a href="https://suchwit.bullet.site/qr/" class="help-link" rel="noopener noreferrer">
          <svg class="help-icon" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="2"/>
            <path d="M8 11.5v-1M8 5v3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          등록 방법
        </a>
      </div>

      <header class="header">
        <h1>연결을 시작합니다</h1>
        <p class="subtitle">
          <span class="highlight">습득자와 즉시 연결될</span><br />
          연락 수단을 입력해 주세요
        </p>
      </header>

      <form id="nat-register-form" class="form-section" action="/api/register" method="POST">
        <input type="hidden" name="uuidOrShort" value="${idForHidden}" />

        <div class="field-group">
          <label for="contact" class="field-label">전화번호</label>
          <input
            id="contact"
            name="contact"
            type="tel"
            inputmode="tel"
            placeholder="010-1234-5678"
            class="field-input"
          />
        </div>

        <div class="field-group">
          <label for="sns" class="field-label">SNS 또는 링크(선택)</label>
          <input
            id="sns"
            name="sns"
            type="text"
            placeholder="카카오톡 오픈채팅, 인스타그램"
            class="field-input"
          />
        </div>

        <div class="field-group">
          <label for="message" class="field-label">습득자에게 전할 메시지(선택)</label>
          <div class="message-wrapper">
            <textarea
              id="message"
              name="message"
              maxlength="120"
              placeholder="소중한 물건입니다. 연락 주시면 감사하겠습니다"
              class="field-input"
            ></textarea>
            <span class="char-count" id="char-count">0/120</span>
          </div>
          <p class="field-hint">미입력 시 기본 문구가 저장됩니다</p>
        </div>

        <div class="actions">
          <button type="submit" id="submit-btn" class="btn-primary" disabled>
            등록 완료
          </button>
        </div>

        <div class="footer-info">
          <p class="privacy-note">
            입력하신 정보는 <strong>태그를 스캔한 사람에게만</strong> 공개됩니다<br />
            분실방지본부는 연락을 중개하며, 이후 거래에 관여하지 않습니다
          </p>
          <a class="brand-footer" href="https://suchwit.bullet.site/" target="_blank" rel="noopener noreferrer">
          분실방지본부 NAT
          </a>
        </div>
      </form>
    </div>
  </div>

  <script>
    (function() {
      var contact = document.getElementById('contact');
      var sns = document.getElementById('sns');
      var message = document.getElementById('message');
      var charCount = document.getElementById('char-count');
      var submitBtn = document.getElementById('submit-btn');

      function updateButton() {
        var hasContact = contact.value.trim().length > 0;
        var hasSns = sns.value.trim().length > 0;
        submitBtn.disabled = !(hasContact || hasSns);
      }

      function updateCharCount() {
        var current = message.value.length;
        charCount.textContent = current + '/120';
      }

      contact.addEventListener('input', updateButton);
      sns.addEventListener('input', updateButton);
      message.addEventListener('input', updateCharCount);

      updateButton();
      updateCharCount();
    })();
  </script>
  `;
}

export { renderRegisterInner as renderRegister };