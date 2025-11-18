// functions/src/preview.ts
import { renderRegister } from "./views/registerPage";

declare const window: any;
declare const document: any;

window.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("nat-root");
  if (!root) return;

  root.innerHTML = renderRegister("PREVIEW-ID-1234");
});
