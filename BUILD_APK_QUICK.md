# 🚀 CheckKit APK 빠르게 만들기 (Bubblewrap)

## 사전 준비 (10분)

### 1. Java JDK 설치
```bash
# Java 11 이상 필요
# https://adoptium.net/ 에서 다운로드
# 또는
choco install openjdk11  # Windows (Chocolatey)
```

### 2. Android SDK 설치 
```bash
# Android Studio 설치 (SDK 포함)
# https://developer.android.com/studio
# 또는 Command Line Tools만 설치
# https://developer.android.com/studio#command-tools
```

### 3. Bubblewrap 설치
```bash
npm install -g @bubblewrap/cli
```

---

## APK 생성 (15분)

### 1. 먼저 앱을 온라인에 배포
```bash
# Vercel에 배포 (무료, 5분)
npm run build
npx vercel --prod

# 배포된 URL 확인 (예: https://checkkit-pwa.vercel.app)
```

### 2. APK 프로젝트 생성
```bash
# 새 폴더 생성
mkdir checkkit-apk
cd checkkit-apk

# Bubblewrap 초기화
bubblewrap init --manifest https://checkkit-pwa.vercel.app/manifest.json
```

### 3. 설정 입력
```
? Domain being opened in the TWA: checkkit-pwa.vercel.app
? Name of the application: CheckKit
? Short name of the application: CheckKit  
? Application theme color: #3b82f6
? Application background color: #ffffff
? Display mode: standalone
? Orientation: portrait
? Application ID: com.checkkit.app
? Starting URL: /
? Splash screen color: #3b82f6
? File location of icon: (Enter 건너뛰기)
? Monochrome icon: (Enter 건너뛰기)
? Shortcuts: (Enter 건너뛰기)
? Key store location: (Enter - 새로 생성)
? Key name: android
? Password for the Key Store: (비밀번호 입력)
? Password for the Key: (같은 비밀번호)
```

### 4. APK 빌드
```bash
# 디버그 APK 생성 (서명 없음, 테스트용)
bubblewrap build

# APK 위치: ./app-release-unsigned.apk
```

---

## 휴대폰에 설치 (5분)

### 방법 1: USB 케이블로 직접 설치
```bash
# 휴대폰 개발자 모드 & USB 디버깅 활성화
# USB로 PC 연결

# ADB로 설치
bubblewrap install

# 또는
adb install app-release-unsigned.apk
```

### 방법 2: APK 파일 전송
1. APK 파일을 휴대폰으로 전송
   - Google Drive 업로드 → 휴대폰에서 다운로드
   - 이메일 첨부
   - 카카오톡 나에게 보내기
   - USB 복사

2. 휴대폰 설정
   ```
   설정 → 보안 → 출처를 알 수 없는 앱 설치 허용
   (또는 설정 → 앱 → 특별한 액세스 → 알 수 없는 앱 설치)
   ```

3. 파일 관리자에서 APK 실행 → 설치

---

## 🎯 더 간단한 온라인 도구

### PWA2APK (브라우저에서 바로 생성)
https://pwa2apk.com/

1. URL 입력: `https://checkkit-pwa.vercel.app`
2. 설정:
   - App Name: CheckKit
   - Package: com.checkkit.app
   - Theme Color: #3b82f6
3. "Generate APK" 클릭
4. APK 다운로드 (2분)

---

## ⚡ 로컬 서버로 APK 만들기 (인터넷 없이)

### 1. manifest.json 수정
```json
{
  "start_url": "http://192.168.0.10:3000/",
  "scope": "http://192.168.0.10:3000/"
}
```

### 2. twa-manifest.json 생성
```json
{
  "host": "192.168.0.10:3000",
  "protocol": "http",
  "name": "CheckKit",
  "launcherName": "CheckKit",
  "display": "standalone",
  "themeColor": "#3b82f6",
  "backgroundColor": "#ffffff",
  "enableNotifications": true,
  "startUrl": "/",
  "iconUrl": "http://192.168.0.10:3000/icons/icon-512x512.png",
  "splashScreenFadeOutDuration": 300,
  "enableSiteSettingsShortcut": true,
  "isChromeOSOnly": false
}
```

### 3. Bubblewrap 빌드
```bash
bubblewrap init --manifest ./twa-manifest.json
bubblewrap build
```

---

## 📱 설치 후 확인

- 앱 서랍에 CheckKit 아이콘 생성
- 전체 화면으로 실행 (주소창 없음)
- 오프라인 작동 확인
- 알림 권한 요청 확인

---

## 🔧 문제 해결

### "앱이 설치되지 않았습니다" 오류
```bash
# 기존 앱 삭제 후 재설치
adb uninstall com.checkkit.app

# 또는 휴대폰 설정
설정 → 앱 → CheckKit → 제거
```

### INSTALL_FAILED_USER_RESTRICTED
```
설정 → 보안 → 출처를 알 수 없는 앱
→ Chrome 또는 파일 관리자 허용
```

### 서명 문제
```bash
# 디버그 서명으로 빌드
bubblewrap build --skipSigning
```

---

## 💡 팁

### 아이콘 변경
```bash
# 512x512 PNG 준비
# ./icon-512.png로 저장
bubblewrap init --manifest https://your-url/manifest.json
# Icon 경로 물으면 ./icon-512.png 입력
```

### 앱 이름 변경
```bash
# twa-manifest.json 수정
"name": "새 이름",
"launcherName": "새 이름"

# 다시 빌드
bubblewrap build
```

### 자동 업데이트
- PWA 특성상 서버 코드 수정하면 앱도 자동 업데이트
- APK 재설치 불필요

---

## 🚀 최종 정리

**가장 빠른 방법:**
1. Vercel 배포 (5분)
2. PWA2APK.com에서 APK 생성 (2분)
3. 휴대폰에 설치 (3분)

**총 10분이면 완료!**