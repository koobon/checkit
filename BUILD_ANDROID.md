# CheckKit Android 앱 빌드 가이드

## 방법 1: PWA → APK (추천) - Bubblewrap 사용

### 1. 사전 준비
```bash
# Node.js 14 이상 필요
# Java JDK 8 이상 필요

# Bubblewrap CLI 설치
npm install -g @bubblewrap/cli
```

### 2. 프로덕션 빌드 및 배포
```bash
# Next.js 프로덕션 빌드
npm run build

# Vercel, Netlify 등에 배포하여 HTTPS URL 획득
# 예: https://checkkit.vercel.app
```

### 3. TWA (Trusted Web Activity) 프로젝트 생성
```bash
# 새 디렉토리 생성
mkdir checkkit-android
cd checkkit-android

# Bubblewrap 초기화
bubblewrap init --manifest https://checkkit.vercel.app/manifest.json
```

### 4. 설정 입력
```
Domain: checkkit.vercel.app
Application name: CheckKit
Short name: CheckKit
Theme color: #3b82f6
Background color: #ffffff
Display mode: standalone
Orientation: portrait
Application ID: com.yourcompany.checkkit
Starting URL: /
```

### 5. APK 빌드
```bash
# 디버그 APK 빌드
bubblewrap build

# 서명된 APK 빌드 (Play Store 배포용)
bubblewrap build --skipSigning false
```

### 6. 생성된 파일
- `app-release-signed.apk` - Play Store 업로드용
- `app-debug.apk` - 테스트용

---

## 방법 2: Capacitor 사용 (더 많은 네이티브 기능)

### 1. Capacitor 설치
```bash
npm install @capacitor/core @capacitor/android @capacitor/cli
```

### 2. Capacitor 초기화
```bash
npx cap init checkkit com.yourcompany.checkkit --web-dir=out
```

### 3. capacitor.config.json 수정
```json
{
  "appId": "com.yourcompany.checkkit",
  "appName": "CheckKit",
  "webDir": "out",
  "server": {
    "androidScheme": "https"
  },
  "plugins": {
    "LocalNotifications": {
      "smallIcon": "ic_stat_icon",
      "iconColor": "#3b82f6"
    }
  }
}
```

### 4. Next.js 설정 수정
```javascript
// next.config.js에 추가
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true
  }
}
```

### 5. Android 프로젝트 추가
```bash
# Static export 빌드
npm run build

# Android 플랫폼 추가
npx cap add android

# Android 프로젝트 동기화
npx cap sync android
```

### 6. Android Studio에서 빌드
```bash
# Android Studio 열기
npx cap open android

# Android Studio에서:
# 1. Build → Build Bundle(s) / APK(s) → Build APK(s)
# 2. 생성된 APK는 android/app/build/outputs/apk/ 에 위치
```

---

## 방법 3: PWA Builder (온라인 도구)

### 1. PWA Builder 사이트 접속
https://www.pwabuilder.com/

### 2. 앱 URL 입력
- 배포된 CheckKit URL 입력 (https://checkkit.vercel.app)
- "Start" 클릭

### 3. Android 패키지 생성
- "Store Package" → "Android" 선택
- 옵션 설정:
  - Package ID: com.yourcompany.checkkit
  - App name: CheckKit
  - Signing key: 새로 생성 또는 기존 키 사용

### 4. 다운로드
- APK 또는 AAB 파일 다운로드
- Play Store 업로드 가능

---

## 필수 체크리스트

### PWA 요구사항
✅ HTTPS 호스팅
✅ manifest.json 파일
✅ Service Worker 등록
✅ 아이콘 (512x512 필수)
✅ 오프라인 작동

### manifest.json 최적화
```json
{
  "name": "CheckKit - 나만의 일일 루틴·점검 도우미",
  "short_name": "CheckKit",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#3b82f6",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ]
}
```

### 아이콘 생성
```bash
# 512x512 아이콘이 필요합니다
# https://maskable.app 에서 maskable 아이콘 생성
# https://www.pwabuilder.com/imageGenerator 에서 모든 크기 생성
```

---

## Play Store 배포

### 1. Google Play Console 계정
- 개발자 등록 ($25 일회성)
- https://play.google.com/console

### 2. 앱 등록
- 앱 이름: CheckKit
- 카테고리: 생산성
- 언어: 한국어

### 3. 스토어 등록 정보
- 짧은 설명 (80자)
- 긴 설명 (4000자)
- 스크린샷 (최소 2개)
- 기능 그래픽 (1024x500)
- 아이콘 (512x512)

### 4. APK/AAB 업로드
- 프로덕션 트랙에 업로드
- 버전 코드 설정
- 릴리스 노트 작성

### 5. 콘텐츠 등급
- 설문 작성
- 전체 이용가 예상

### 6. 가격 및 배포
- 무료
- 대한민국 포함 국가 선택

---

## 테스트 방법

### 로컬 테스트
1. Android 기기에서 개발자 모드 활성화
2. USB 디버깅 활성화
3. APK 파일을 기기로 전송
4. 파일 관리자에서 APK 설치

### 내부 테스트
1. Play Console에서 내부 테스트 트랙 생성
2. 테스터 이메일 추가
3. 테스트 링크 공유

---

## 권장 사항

### 가장 빠른 방법: PWA Builder
- 온라인에서 바로 APK 생성
- 코드 수정 불필요
- 5분 내 완료

### 가장 유연한 방법: Capacitor
- 네이티브 기능 추가 가능
- 푸시 알림, 생체인증 등
- 더 많은 제어 가능

### Play Store 배포용: Bubblewrap
- Google 공식 도구
- TWA 기반 최적화
- 작은 APK 크기

---

## 문제 해결

### HTTPS 필수
- Vercel, Netlify, GitHub Pages 등 무료 호스팅 사용
- localhost는 Android 앱에서 작동 안함

### 아이콘 문제
- 512x512 아이콘 필수
- PNG 형식만 지원
- maskable 아이콘 권장

### Service Worker 문제
- next-pwa가 자동 생성
- 캐시 전략 확인 필요

---

## 예상 시간

- PWA Builder: 5-10분
- Bubblewrap: 30분-1시간  
- Capacitor: 1-2시간
- Play Store 배포: 2-48시간 (심사 대기)