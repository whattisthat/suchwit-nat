// functions/src/views/publicLegacy.ts

import { renderPublicView, PublicPageProps } from "./publicPage";

// URL 정규화: 프로토콜 없으면 https:// 붙이기
function normalizeLinkUrl(url: string): string {
  if (!url) return "";
  const trimmed = String(url).trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return "https://" + trimmed;
}

// 입력 텍스트가 URL로 보이는지 대충 판별
function isLikelyUrl(text: string): boolean {
  const t = (text || "").trim().toLowerCase();
  if (!t) return false;
  if (t.startsWith("http://") || t.startsWith("https://")) return true;
  if (t.includes(".") && !t.includes(" ")) return true; // 공백 없고 . 있으면 URL로 간주
  return false;
}

// page(html, title)를 받아서 renderPublic(pub: any) 함수를 만들어 주는 타입
export type PageRenderer = (html: string, title?: string) => string;

// 기존 index.ts의 renderPublic(pub: any)를 여기로 이주한 형태
export function createRenderPublic(page: PageRenderer) {
  return function renderPublic(pub: any) {
    // 1) 연락처 처리
    const rawContact = (pub.contact || pub.phone || "").toString().trim();
    const contactDigits = rawContact.replace(/\s+/g, "");
    const telHref = rawContact ? `tel:${contactDigits}` : "";
    const smsHref = rawContact ? `sms:${contactDigits}` : "";

    // 2) SNS 처리
    const rawSns = (pub.sns || "").toString().trim();
    const snsIsUrl = rawSns ? isLikelyUrl(rawSns) : false;
    const snsUrl = snsIsUrl ? normalizeLinkUrl(rawSns) : "";

    // 3) 메시지 기본값 처리 (순수 텍스트만)
    const defaultMessage =
      "물건을 발견해 주셔서 감사합니다. 편한 방법으로 연락 부탁드립니다.";
    const rawMessage = (pub.message || "").toString().trim();
    const message = rawMessage.length > 0 ? rawMessage : defaultMessage;

    // 4) publicPage.ts에서 쓸 props 구성
    const props: PublicPageProps = {
      hasPhone: !!rawContact,
      telHref,
      smsHref,
      hasSnsLink: !!(rawSns && snsIsUrl && snsUrl),
      snsHref: snsUrl,
      message,
    };

    const innerHtml = renderPublicView(props);

    // ★ 여기 “버전 표기”를 강제로 넣어본다
    const versionBanner = `<p style="color:#FF4E42;font-weight:bold;">[PUBLIC VIEW v2026-01-07]</p>`;


    // 5) 공통 레이아웃(page)에 새 뷰를 집어넣기
    return page(
      renderPublicView(props),
      "분실물 연락 정보 · 분실방지본부"
    );
  };
}
