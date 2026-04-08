# 포켓몬 TCG 도감 - 프론트엔드

React + Vite 기반의 포켓몬 카드 컬렉션 관리 애플리케이션

## 🚀 설정 및 실행

### 1단계: 필수 디렉토리 생성
Command Prompt에서 다음 명령어를 실행하세요:

```cmd
cd C:\Users\jake3\jake\pokemon-tcg-dex\frontend
mkdir src\components
```

### 2단계: 패키지 설치 및 서버 실행

setup.bat 파일을 실행하거나, 다음 명령어를 수동으로 실행하세요:

```cmd
npm install @supabase/supabase-js
npm run dev
```

### 3단계: 브라우저에서 접속

http://localhost:5173 에 접속하여 애플리케이션을 이용하세요.

## 📁 프로젝트 구조

```
src/
├── App.jsx              # 메인 라우팅 컴포넌트
├── App.css              # 전체 스타일
├── components/
│   ├── LoginModal.jsx   # 로그인/회원가입 모달
│   ├── HomePage.jsx     # 로그인 전 홈페이지
│   ├── CardListPage.jsx # 카드 목록 페이지
│   └── CardDetailPage.jsx # 카드 상세 정보
├── supabase.js          # Supabase 클라이언트
└── main.jsx             # 진입점
```

## 📚 주요 기능

- ✅ 로그인/회원가입
- ✅ 카드 목록 조회
- ✅ 카드 검색 및 필터링
- ✅ 카드 상세 정보
- ✅ 보유 카드 추가/제거
- ✅ 찜하기/찜해제

## ⚙️ 기술 스택

- React 19
- Vite 8
- Supabase 2
- ESLint 9

## 🔧 개발 명령어

```cmd
npm run dev      # 개발 서버 실행
npm run build    # 프로덕션 빌드
npm run lint     # ESLint 실행
npm run preview  # 빌드 결과 미리보기
```

## 📝 환경 설정

`.env.local` 파일에 다음 항목을 설정하세요:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

## 🐛 문제 해결

- **포트 5173이 이미 사용 중**: `npm run dev -- --port 3000`
- **모듈을 찾을 수 없음**: `npm install` 재실행
- **Supabase 연결 오류**: `.env.local` 파일 확인
