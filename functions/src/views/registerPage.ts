// functions/src/views/registerPage.ts

/**
 * /q/:id → 등록 화면의 "메인 내용"만 반환.
 * 전체 HTML이 아니라 <main> 안에 들어갈 내용 부분만 반환합니다.
 */
export function renderRegisterInner(idForHidden: string): string {
  return `
    <div class="register-header">
      <span class="badge">Owner setup</span>
      <a class="register-help-link" href="Www.suchwit.com" onclick="return false;">등록방법</a>
    </div>

    <h1>등록해주세요</h1>

    <p class="subtitle">
      <span class="subtitle-strong">습득자가 QR코드를 인식했을 때,</span><br />
      아래 연락처로 연락할 수 있습니다.<br />
      최소 한 가지 연락 수단은 입력해 주세요.
    </p>

    <form id="nat-register-form" action="/api/register" method="POST">
      <input type="hidden" name="uuidOrShort" value="${idForHidden}" />


      <div class="section">
        <div class="field-row">
          <label for="contact">전화번호 (선택)</label>
          <input
            id="contact"
            name="contact"
            type="tel"
            inputmode="tel"
            placeholder="01012345678"
          />
        </div>

        <div class="field-row">
          <label for="sns">SNS·링크 (선택)</label>
          <input
            id="sns"
            name="sns"
            type="text"
            placeholder="인스타 링크, 카카오톡 오픈 채팅 링크"
          />
        </div>

        <div class="field-row">
          <label for="message">습득자에게 전할 메시지 (선택)</label>
          <textarea
            id="message"
            name="message"
            maxlength="120"
            placeholder="정말 소중한 물건입니다. 찾아주시면 감사하겠습니다."
          ></textarea>
          <p class="hint">입력하지 않을경우, 기본 문구가 저장됩니다.</p>
          <p class="message-count" id="message-count">0/120</p>
        </div>

      </div>


      <div class="actions">
        <button type="submit" 
        id="submitBtn" 
        class="btn-primary" 
        disabled>완료</button>
      </div>

      <p class="footer-note">
        입력하신 정보는 <strong>이 태그를 스캔한 사람에게만</strong> 보입니다.<br />
        분실방지본부(NAT)는 연락을 도와주는 역할만 하며,<br />이후의 보상·거래에는 관여하지 않습니다.
      </p>
    </form>

    <p class="register-footer-brand">NAT by 분실방지본부</p>

    <script>
      (function () {
        var contact = document.getElementById('contact');
        var sns = document.getElementById('sns');
        var submit = document.getElementById('submitBtn');
        var message = document.getElementById('message');
        var messageCount = document.getElementById('message-count');

        function updateContactState() {
          var hasContact = contact && contact.value.trim().length > 0;
          var hasSns = sns && sns.value.trim().length > 0;
          var ok = hasContact || hasSns;

          if (submit) {
            submit.disabled = !ok;
            submit.style.opacity = ok ? '1' : '0.6';
          }
          if (note) {
            note.style.color = ok ? '#6b7280' : '#b91c1c'; // 회색 vs 붉은색
          }
        }

        function updateMessageCount() {
          if (!message || !messageCount) return;
          var max = message.maxLength || 120;
          var current = message.value.length;
          messageCount.textContent = current + '/' + max;
        }

        if (contact) contact.addEventListener('input', updateContactState);
        if (sns) sns.addEventListener('input', updateContactState);
        if (message) message.addEventListener('input', updateMessageCount);

        updateContactState();
        updateMessageCount();
      })();
    </script>
  `;
}
export { renderRegisterInner as renderRegister };
