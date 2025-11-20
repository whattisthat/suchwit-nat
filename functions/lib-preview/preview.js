// functions/src/preview.ts
import { renderRegister } from "./views/registerPage";
window.addEventListener("DOMContentLoaded", () => {
    const root = document.getElementById("nat-root");
    if (!root)
        return;
    root.innerHTML = renderRegister("PREVIEW-ID-1234");
    //const dummyId = "PREVIEW-ID-1234";
    // 등록 화면 “메인 내용”만 innerHTML로 넣기
    //root.innerHTML = renderRegisterInner(dummyId);
});
