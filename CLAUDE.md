# CLAUDE.md — v6.0

> React Native + Expo + TypeScript | Claude Code 전용

## 1. 역할 & 모델

실행형 개발 에이전트. 물어보기 전에 만들어라.

```
모델:    opusplan
설계:    Opus 4.6 (Plan 모드) — 아키텍처, 디버깅, 에러 분석
실행:    Sonnet 4.6 (Execute 모드) — 코드 작성, 파일 수정, 명령 실행
권한:    auto (AI 분류기가 안전한 작업 자동 승인, 위험한 작업만 차단)
전환:    Shift+Tab (default → acceptEdits → plan → auto)
```

**설정** (`~/.claude/settings.json`):
```json
{
  "model": "opusplan",
  "defaultMode": "auto"
}
```

**최초 활성화** (1회만):
```bash
claude --enable-auto-mode
```

---

## 2. 기술 스택

```
TypeScript (strict) · React Native + Expo SDK 54 · NativeWind · Zustand · Expo Router
```

**폴더:** `app/`(화면) · `components/` · `stores/` · `services/` · `hooks/` · `constants/` · `assets/`

**코딩 규칙:**
- `any` 금지 → interface/type 필수
- 인라인 스타일 금지 → `StyleSheet.create()`
- 하드코딩 문자열 금지 → `constants/`
- 컴포넌트 1파일 1export default
- `app/` 파일명 = 라우트 경로

**NativeWind 주의:** `darkMode: 'class'` 필수 · 다크모드는 `nativewind`의 `useColorScheme`만 사용 · `LinearGradient` 등은 `style` prop으로 레이아웃 지정

**명령어:** `npx expo start` · `npx tsc --noEmit` · `npx expo run:android` · `npx expo run:ios` · `npx expo install {pkg}`

---

## 3. 작업 흐름

```
[지시] → [에러로그 확인] → [기존코드 확인] → [환경점검] → [구현] → [검증] → [보고]
```

복잡한 작업은 Plan 먼저: `Opus 설계 → Sonnet 구현 → QA → 보고`

**규칙:**
1. 섹션 6 에러 로그를 먼저 읽고 동일 실수 사전 회피
2. 유사 컴포넌트/훅 있으면 재사용
3. 패키지 없으면 `npx expo install` 자동 설치
4. 작성 후 `npx tsc --noEmit` 필수
5. 에러 수정 시 → **섹션 5 학습 절차 즉시 실행**

---

## 4. 자율 실행 권한 (Auto Mode)

> Auto mode가 활성화되어 있으므로 대부분의 작업은 승인 없이 자동 진행된다.
> AI 분류기가 위험도를 판단하여 안전한 행동은 즉시 실행, 위험한 행동만 차단한다.

**✅ 자동 승인 (분류기 통과):** 파일 생성/수정 · 패키지 설치 · 빌드/린트/타입체크 · 에러 자동 수정 · 에러 로그 기록(섹션 6) · `mkdir` · `git add/commit` · 일반 셸 명령

**🛡️ 분류기가 차단할 수 있음:** 대량 파일 삭제 · 민감 데이터 외부 전송 · 알 수 없는 네트워크 요청 → 차단 시 Claude가 더 안전한 방법으로 자동 우회

**❌ 차단 + 사용자 확인 필요 (CLAUDE.md 규칙):** EAS Build/스토어 배포(비용) · `app.json`/`eas.json` 수정(앱 전체 영향) · 외부 API 대량 쓰기(10건+)

**🚫 절대 수정 금지 영역:**
- **분석 결과 전체:** 사용자가 수동으로 작성/수정한 분석 결과(데이터, UI, 로직)는 절대 수정하지 않는다. 읽기 전용으로만 취급.

---

## 5. 에러 복구 & 자동 학습

**즉시 대응:** TS타입에러→타입수정 · Metro에러→`expo start -c` · Module not found→`npm install` · SDK호환→`expo install` · Android빌드→`gradlew clean` · iOS빌드→`pod install` · 2회 실패→Plan모드 전환, Opus 분석

**에러 수정 후 필수 절차 (스킵 금지):**
1. **분류:** 반복 가능한 에러인가? → 오타/일회성이면 종료
2. **중복확인:** 섹션 6에 같은 원인 있으면 날짜만 추가
3. **기록:** 새 패턴이면 섹션 6에 즉시 추가 (형식은 아래)
4. **승격:** 3회 이상 반복되면 섹션 2 코딩 규칙으로 승격

```
### ERR-{번호}: {한 줄 요약}
- **날짜:** YYYY-MM-DD
- **상황/원인/해결/예방:** 각 1~2줄
```

---

## 6. 에러 학습 로그

> 에이전트가 자동 관리. 코드 작성 전 반드시 읽는다. 최대 20개, 초과 시 오래된 항목 삭제.

### ERR-001: NativeWind darkMode: 'class' 미설정 시 setColorScheme 무효
- **날짜:** 2026-04-12
- **상황:** 다크모드 토글 시 UI 미반영
- **원인:** `tailwind.config.js`에 `darkMode: 'class'` 누락
- **해결:** `darkMode: 'class'` 추가
- **예방:** 다크모드 작업 전 config 먼저 확인

### ERR-002: expo-linear-gradient className 패딩 미적용
- **날짜:** 2026-04-12
- **상황:** `className="p-4"` 패딩 무시됨
- **원인:** 서드파티 네이티브 컴포넌트는 NativeWind className 레이아웃 미지원
- **해결:** `style={{ padding: 16 }}` 사용
- **예방:** `LinearGradient` 등 서드파티는 `style` prop 사용

### ERR-003: Appearance.setColorScheme iOS 무효
- **날짜:** 2026-04-12
- **상황:** RN 내장 `Appearance.setColorScheme` iOS 미작동
- **원인:** NativeWind는 자체 API 필요
- **해결:** `import { useColorScheme } from 'nativewind'` 사용
- **예방:** NativeWind 프로젝트에서 RN `Appearance` API 혼용 금지

### ERR-004: react-native-webview 컨테이너에 NativeWind className 사용 시 WebView 미표시
- **날짜:** 2026-04-15
- **상황:** WingWebView 로딩 완료(`loading: false`) 후에도 페이지가 화면에 보이지 않고 디버그 바만 표시됨
- **원인:** `<View className="flex-1">`로 감싼 WebView는 ERR-002와 동일하게 NativeWind 레이아웃이 네이티브 컴포넌트에 전파되지 않아 dimension 미확보. 추가로 `top-1/2 -translate-x-1/2`류 퍼센트 transform은 RN에서 동작 불안정
- **해결:** `StyleSheet.create()` + `style={{ flex: 1 }}`로 전환, 오버레이는 `StyleSheet.absoluteFillObject` + flex 중앙 정렬 사용
- **예방:** WebView/LinearGradient 등 네이티브 컴포넌트 및 그 부모 컨테이너는 className이 아닌 style prop 사용. 오버레이 중앙 정렬은 퍼센트 transform 대신 `absoluteFillObject` + `justifyContent/alignItems: 'center'`

### ERR-005: "비검색 영역"이 "검색 영역"으로 오분류 (substring 함정)
- **날짜:** 2026-04-15
- **상황:** 지면 성과 분석에서 비검색 영역 데이터가 항상 0으로 집계되어 "검색영역만 운영 중"으로 판정
- **원인:** `"비검색 영역".includes("검색")`은 `true`를 반환. `p.platform.includes('검색')` 필터가 비검색 영역까지 포함시켜 nonSearchData가 항상 빈 상태
- **해결:** `isSearchPlatform()` / `isNonSearchPlatform()` 헬퍼 함수로 분류 — 비검색 키워드를 먼저 배타적으로 체크한 뒤 검색 여부를 판정
- **예방:** 한글 키워드가 서로 포함관계에 있을 때 `.includes()` 필터 금지. 항상 배타적 키워드(비검색, 비-, non-)를 먼저 체크하는 헬퍼 함수 사용

### ERR-006: Akamai 보호 사이트에서 데스크톱 UA 스푸핑 시 봇 감지로 로그인 차단
- **날짜:** 2026-05-15
- **상황:** 쿠팡 WING의 모바일 다운로드 버튼 누락을 우회하려고 WebView `userAgent`를 데스크톱 Chrome UA로 교체 + `navigator.userAgent/platform/maxTouchPoints/screen.width` JS 오버라이드 → 로그인 시도 시 `errors.edgesuite.net` Access Denied (Akamai Edge 봇 감지 차단)
- **원인:** Akamai는 (1) TLS 핑거프린트(WKWebView ≠ Chrome) (2) HTTP 헤더 순서 (3) 클라이언트 사이드 JS 핑거프린트(WebGL/폰트/Canvas) 등으로 다층 봇 감지. UA만 데스크톱이라 주장하면 모순 감지 → `_abck` 쿠키 발급 거부 → 403
- **해결:** UA 스푸핑 포기. 모바일 UA 유지 + 모바일 페이지에 없는 기능(엑셀 다운로드 등)은 외부 Safari(`expo-web-browser`의 `openBrowserAsync`로 Safari View Controller 호출) + 파일 픽커(`expo-document-picker`로 다운로드된 파일 가져오기) 워크플로로 우회
- **예방:** Akamai/Cloudflare/Imperva 등 봇 보호가 적용된 사이트는 핑거프린트 우회 금지. WebView는 정직한 UA로 두고, 데스크톱 전용 기능은 시스템 브라우저(Safari/Chrome) + 파일 공유 워크플로로 분리. UA 스푸핑은 봇 보호 없는 자체 사이트에서만 의미 있음

---

## 7. QA (UI 개발 시)

UI 작업 완료마다 QA 수행. **상세 명령어는 `.claude/qa-guide.md`에 분리.**

**체크 요약:**
- **빌드:** tsc 통과 · Metro 에러 없음 · 크래시 없음
- **기능:** 버튼/입력/네비게이션/백버튼/키보드 가림 여부
- **UI:** 텍스트 잘림 · 한글깨짐 · 숫자포맷 · 다크모드 · SafeArea · 빈 상태
- **호환:** Android 해상도(FHD/QHD) · iOS 기기(SE/15Pro/15ProMax)
- **플랫폼:** Android 백버튼/회전 · iOS SafeArea/제스처/접근성폰트

**결과 처리:** 통과→보고 · 타입에러→수정 · 빌드실패→수정(3회) · UI문제→스타일수정 · 기능미작동→로직수정 · 3회실패→사용자보고

**수정 후:** 재테스트 확인 + 섹션 5 학습 절차 실행
