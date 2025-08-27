# 🚀 CheckKit Bubblewrap APK 생성 가이드

## 현재 상황
- ✅ Bubblewrap CLI 설치 완료
- ✅ Java 11 설치 확인 완료
- ✅ Next.js 앱 빌드 완료
- ⚠️ 아이콘 파일 필요 (PNG 형식)

## 지금 해야 할 일

### 1단계: 아이콘 생성 (2가지 방법)

#### 방법 A: 브라우저에서 생성 (가장 쉬움)
```bash
# 1. 브라우저에서 다음 파일 열기
start create-simple-icon.html

# 2. "Download Icon" 버튼 클릭
# 3. 다운로드된 icon-512x512.png를 public/icons/ 폴더로 이동
```

#### 방법 B: 온라인 도구 사용
1. [Favicon Generator](https://favicon.io/favicon-generator/) 접속
2. 텍스트: "C" 또는 "✓"
3. 배경색: #3b82f6 (파란색)
4. 글자색: #ffffff (흰색)
5. 512x512 PNG 다운로드 → `public/icons/icon-512x512.png`로 저장

### 2단계: 다른 크기 아이콘 생성 (선택사항)
```bash
# 필요한 크기들: 72, 96, 128, 144, 152, 192, 384, 512
# 온라인 이미지 리사이저 사용:
# https://imageresizer.com/
# 또는
# https://www.iloveimg.com/resize-image
```

### 3단계: 온라인 배포 (PWA2APK 사용)

#### 간단한 방법: PWA2APK
1. [PWA2APK](https://pwa2apk.com) 접속
2. 먼저 Vercel에 배포:
   ```bash
   npx vercel --prod
   # GitHub 계정으로 로그인 후 배포
   ```
3. 배포된 URL을 PWA2APK에 입력
4. APK 다운로드

### 4단계: 로컬 서버로 APK 생성

만약 온라인 배포 없이 하려면:

```bash
# 1. manifest.json에 로컬 IP 설정
# manifest.json 파일을 수정해야 함

# 2. 로컬 IP 확인
ipconfig
# 예: 192.168.0.10

# 3. 개발 서버 실행
npm run dev

# 4. Bubblewrap 프로젝트 생성
mkdir checkkit-apk
cd checkkit-apk
bubblewrap init --manifest http://192.168.0.10:3000/manifest.json

# 5. 설정 입력:
# Domain: 192.168.0.10:3000
# Name: CheckKit
# Package: com.checkkit.app
# 나머지는 기본값

# 6. APK 빌드
bubblewrap build

# 7. APK 설치
# app-release-unsigned.apk를 휴대폰으로 전송하여 설치
```

## ⚠️ 현재 문제와 해결책

### 문제: PNG 아이콘 필요
**해결**: create-simple-icon.html을 브라우저에서 열고 아이콘 다운로드

### 문제: HTTPS 필요 (Bubblewrap의 경우)
**해결**: Vercel 무료 배포 또는 ngrok 사용

### 문제: Android SDK 필요
**해결**: PWA2APK 온라인 도구 사용하면 불필요

## 🎯 권장 진행 순서

### 가장 빠른 방법 (5분):
1. 아이콘 생성 (create-simple-icon.html)
2. Vercel 배포 (GitHub 계정 필요)
3. PWA2APK에서 APK 생성
4. 휴대폰에 설치

### 완전 로컬 방법 (15분):
1. 아이콘 생성
2. manifest.json 로컬 IP로 수정
3. Bubblewrap으로 APK 생성
4. 휴대폰에 설치

## 📱 APK 설치 방법

1. APK를 휴대폰으로 전송 (Google Drive, 이메일 등)
2. 휴대폰 설정:
   ```
   설정 → 보안 → 출처를 알 수 없는 앱 설치 허용
   ```
3. 파일 관리자에서 APK 실행 → 설치

## 🚨 다음 스텝

**지금 바로 할 수 있는 것:**
1. `create-simple-icon.html`을 브라우저에서 열어서 아이콘 다운로드
2. 아이콘을 `public/icons/icon-512x512.png`로 저장
3. PWA2APK.com에서 APK 생성 (Vercel 배포 후)

**또는**
Bubblewrap 대신 더 간단한 방법을 원하면 알려주세요!