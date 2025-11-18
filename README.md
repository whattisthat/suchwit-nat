
# suchwit.com — NAT QR MVP (Firebase Hosting + Functions)

**테스트 도메인**: www.suchwit.com (또는 Firebase가 제공하는 서브도메인)
**경로**: https://www.suchwit.com/q/{uuid}

## Firestore 컬렉션
- `qr_items/{uuid}`: 공개(상태/마스킹/메시지)
- `qr_private/{uuid}`: 비공개(연락처 원문)

## 빠른 시작
```bash
npm i -g firebase-tools
firebase login
firebase use --add   # suchwit 프로젝트 선택 또는 신규 연결

cd functions
npm i
npm run build

cd ..
firebase deploy --only hosting,functions,firestore:rules
```

## 테스트
1) 콘솔에서 `qr_items/{uuid}` 문서를 하나 만들고 `status="issued"`로 저장
2) 브라우저에서 `https://www.suchwit.com/q/{uuid}` 접속 → 등록 폼 보임
3) 폼 제출 → 활성화 후 공개 페이지로 리다이렉트
