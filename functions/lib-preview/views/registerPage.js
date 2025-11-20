// functions/src/views/registerPage.ts
/**
 * /q/:id → 등록 화면의 "메인 내용"만 반환.
 * 전체 HTML이 아니라 <main> 안에 들어갈 내용 부분만 반환합니다.
 */
export function renderRegisterInner(idForHidden) {
    return `
    <div class="brand">
      <div class="brand-mark"></div>
      <div class="brand-name">분실방지본부(NOT-A-TAG, NAT)</div>
    </div>
    <span class="badge">Owner setup</span>
    <h1>등록해주세요</h1>

    <p class="subtitle">
      습득자가 QR코드를 인식했을 때, 아래 연락처로 연락할 수 있습니다.
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
            placeholder="예: 01012345678"
          />
          <p class="hint">습득자가 전화 또는 문자로 연락할 수 있습니다</p>
        </div>

        <div class="field-row">
          <label for="sns">SNS·링크 (선택)</label>
          <input
            id="sns"
            name="sns"
            type="text"
            placeholder="예: 인스타 링크, 카카오 오픈채팅 링크 등"
          />
          <p class="hint">전화 대신 DM·채팅으로 연락받을 수 있습니다.</p>
        </div>

        <div class="field-row">
          <label for="message">한 줄 메시지 (선택)</label>
          <textarea
            id="message"
            name="message"
            maxlength="140"
            placeholder="물건을 발견해 주셔서 감사합니다. 편한 방법으로 연락 부탁드립니다."
          ></textarea>
          <p class="hint">비워두셔도 되지만, 기본 문구가 함께 저장됩니다.(최대 140자)</p>
        </div>
      </div>

      <div class="actions">
        <button type="submit" class="btn-primary">등록 완료</button>
      </div>

      <p class="footer-note">
        입력하신 정보는 <strong>이 태그를 스캔한 사람에게만</strong> 보입니다.<br/>
        분실방지본부(NAT)는 연락을 도와주는 역할만 하며, 이후의 보상·거래에는 관여하지 않습니다.
      </p>
    </form>

    <script>
      (function () {
        var contact = document.getElementById('contact');
        var sns = document.getElementById('sns');
        var submit = document.getElementById('submitBtn');
        var note = document.getElementById('contact-or-sns-note');

        function updateState() {
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

        if (contact) contact.addEventListener('input', updateState);
        if (sns) sns.addEventListener('input', updateState);
        updateState();
      })();
    </script>


  `;
}
export { renderRegisterInner as renderRegister };
