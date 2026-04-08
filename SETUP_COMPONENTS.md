# 🚀 컴포넌트 분리 설정 가이드

App.jsx 파일이 4개의 컴포넌트로 분리되었습니다. 이 가이드를 따라 각 파일을 생성하세요.

## 📋 사전 요구사항

먼저 이 명령어를 실행하여 필요한 디렉토리를 생성하세요:

```cmd
mkdir src\components
```

## 📁 생성할 파일

다음 4개의 파일을 `src\components\` 폴더에 생성해야 합니다:

1. **LoginModal.jsx** - 로그인/회원가입 모달 컴포넌트
2. **HomePage.jsx** - 로그인 전 홈페이지 컴포넌트
3. **CardListPage.jsx** - 카드 목록 페이지 컴포넌트
4. **CardDetailPage.jsx** - 카드 상세 정보 페이지 컴포넌트

## 🔧 파일 생성 방법

### 방법 1: VS Code에서 수동 생성
1. VS Code에서 `src/components` 폴더 우클릭
2. "New File" 선택
3. 파일명 입력 (예: LoginModal.jsx)
4. 아래 코드 섹션에서 해당 코드를 복사하여 붙여넣기

### 방법 2: 명령 프롬프트에서 생성

각 파일을 텍스트 에디터(메모장)로 생성할 수 있습니다.

```cmd
cd C:\Users\jake3\jake\pokemon-tcg-dex\frontend\src\components
```

## 📄 각 컴포넌트 코드

각 파일의 코드는 `COMPONENT_CODE_GUIDE.md`에 상세히 기록되어 있습니다.

**파일별 코드:**

### 1. LoginModal.jsx
- 로그인/회원가입 로직
- 이메일, 비밀번호 입력
- Supabase 인증 연동

### 2. HomePage.jsx
- 로그인 전 홈페이지
- 검색창 및 네비게이션
- 로그인 모달 호출

### 3. CardListPage.jsx  
- 카드 목록 표시
- 검색, 필터링, 정렬 기능
- 페이지네이션

### 4. CardDetailPage.jsx
- 선택한 카드의 상세 정보
- 보유 카드 추가/제거
- 찜하기/찜해제

## ✅ 검증

모든 파일을 생성한 후 다음 명령어를 실행하여 확인하세요:

```cmd
dir src\components
```

다음과 같이 4개 파일이 표시되어야 합니다:

```
LoginModal.jsx
HomePage.jsx
CardListPage.jsx
CardDetailPage.jsx
```

## 🚀 실행

파일 생성 후 다음 명령어를 실행하세요:

```cmd
npm run dev
```

## ⚠️ 주의사항

- **import 경로**: 각 파일의 import 문에서 상대 경로를 정확히 확인하세요
- **export default**: 각 파일의 마지막에 `export default [컴포넌트명];` 필수
- **폴더 구조**: 반드시 `src/components/` 폴더 안에 생성해야 합니다

## 🔗 파일 의존성

```
App.jsx (메인)
  ├── LoginModal.jsx (로그인 모달)
  ├── HomePage.jsx (홈페이지)
  │   └── LoginModal.jsx 사용
  ├── CardListPage.jsx (카드 목록)
  └── CardDetailPage.jsx (카드 상세)
```

## 💡 팁

- 코드 복사 시 들여쓰기(indentation)가 제대로 유지되도록 주의하세요
- 파일의 마지막에 빈 줄이 있는지 확인하세요
- 각 import 문이 올바른지 다시 한 번 확인하세요

---

**더 자세한 코드는 `COMPONENT_CODE_GUIDE.md`를 참고하세요.**
