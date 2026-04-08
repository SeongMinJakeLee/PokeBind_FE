# 🚀 프론트엔드 최종 설정 가이드

## 현재 상태
✅ App.jsx - 모든 컴포넌트 완성
✅ App.css - 전체 스타일 완성
⏳ 남은 작업: 패키지 설치 및 서버 실행

---

## 📋 수행할 단계

### 1️⃣ Command Prompt 열기
```
Windows 시작 → "cmd" 검색 → Command Prompt 열기
```

### 2️⃣ 프로젝트 폴더로 이동
```cmd
cd C:\Users\jake3\jake\pokemon-tcg-dex\frontend
```

### 2-1️⃣ components 폴더 생성 (신규)
```cmd
mkdir src\components
```

### 3️⃣ App_new.css 삭제 (필요시)
```cmd
del src\App_new.css
```

### 4️⃣ Supabase 라이브러리 설치
```cmd
npm install @supabase/supabase-js
```
소요 시간: 약 30-60초

### 5️⃣ 개발 서버 실행
```cmd
npm run dev
```

**출력 예시:**
```
  VITE v8.0.4  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Press h to show help
```

---

## 🌐 브라우저에서 접속

출력된 URL로 접속 (보통 **http://localhost:5173/**)

### 테스트 순서:
1. ✅ 로그인 페이지 보이기
2. ✅ 회원가입 테스트
3. ✅ 로그인 테스트
4. ✅ 카드 목록 로드
5. ✅ 검색/필터 기능
6. ✅ 카드 상세 정보
7. ✅ 보유 카드 추가/제거
8. ✅ 찜하기/찜해제

---

## ⚠️ 문제 해결

### 포트 5173이 이미 사용 중인 경우:
```cmd
npm run dev -- --port 3000
```

### 모듈을 찾을 수 없는 경우:
```cmd
npm install
npm run dev
```

### Supabase 연결 오류:
1. `.env.local` 파일 확인
2. VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY 설정 확인
3. Supabase 대시보드에서 키 재확인

---

## 🎯 완료!

모든 준비가 완료되었습니다. 명령어를 실행하면 서버가 시작됩니다! 🚀
