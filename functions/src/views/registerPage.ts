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

        <!-- 등록 완료 확인용 팝업 -->
        <div class="confirm-modal" id="confirm-modal">
          <div class="confirm-modal-backdrop"></div>
          <div class="confirm-modal-dialog">
            <p class="confirm-modal-message">
              등록 완료 시 정보 수정이 불가능합니다.<br />
              완료하시겠습니까?
            </p>
            <div class="confirm-modal-actions">
              <button type="button" id="confirm-cancel" class="btn-secondary">
                취소
              </button>
              <button type="button" id="confirm-ok" class="btn-primary">
                완료
              </button>
            </div>
          </div>
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
    var form = document.querySelector('form'); // 현재 페이지의 등록 폼

    var contact = document.getElementById('contact');
    var sns = document.getElementById('sns');
    var message = document.getElementById('message');
    var charCount = document.getElementById('char-count'); // 실제 id가 다르면 여기 수정
    var submitBtn = document.getElementById('submit-btn');

    // 팝업 요소
    var modal = document.getElementById('confirm-modal');
    var cancelBtn = document.getElementById('confirm-cancel');
    var okBtn = document.getElementById('confirm-ok');

    // 1) 연락처 / SNS 둘 중 하나라도 입력됐는지 체크
    function updateButton() {
      if (!submitBtn) return;
      var hasContact = contact && contact.value.trim().length > 0;
      var hasSns = sns && sns.value.trim().length > 0;
      submitBtn.disabled = !(hasContact || hasSns);
    }

    // 2) 메시지 글자 수 카운트
    function updateCharCount() {
      if (!message || !charCount) return;
      var current = message.value.length;
      var max = message.maxLength || 120;
      charCount.textContent = current + '/' + max;
    }

    // 입력 변화 감지
    if (contact) {
      contact.addEventListener('input', updateButton);
    }
    if (sns) {
      sns.addEventListener('input', updateButton);
    }
    if (message) {
      message.addEventListener('input', updateCharCount);
    }

    // ✅ 3) "등록 완료" 버튼 클릭 시: 바로 submit 금지, 팝업 먼저 띄우기
    if (form && submitBtn && modal && cancelBtn && okBtn) {
      submitBtn.addEventListener('click', function(event) {
        // 아직 조건이 안 돼서 비활성화 상태면 무시
        if (submitBtn.disabled) return;

        // 원래 폼 제출 막기
        event.preventDefault();

        // 팝업 열기
        modal.classList.add('is-open');
      });

      // 취소 버튼: 팝업만 닫고 아무 동작 안 함
      cancelBtn.addEventListener('click', function() {
        modal.classList.remove('is-open');
      });

      // 완료 버튼: 팝업 닫고 실제로 폼 submit → Firebase에서 status 변경
      okBtn.addEventListener('click', function() {
        modal.classList.remove('is-open');
        form.submit();
      });
    }

    // 초기 상태 세팅
    updateButton();
    updateCharCount();
  })();
</script>
  `;
}

export { renderRegisterInner as renderRegister };