# CheckKit PWA - 개인 루틴·점검 앱

CheckKit은 성경 읽기, 운동, 일상 점검 등 개인의 주기적 활동을 관리하는 오프라인 전용 PWA입니다.

## 🌟 주요 특징

- **완전 오프라인 동작**: 네트워크 없이도 모든 기능 사용 가능
- **데이터 프라이버시**: 모든 데이터는 기기 내 암호화 저장
- **자동 루틴 생성**: 설정한 반복 패턴에 따라 매일 자동 생성
- **마감 알림**: 마감 30분 전 알림
- **PDF 보고서**: 주간/월간 성취율 리포트 생성
- **데이터 백업**: 암호화된 파일로 내보내기/가져오기
- **앱 잠금**: PIN/생체인식 보안

## 🏗️ 기술 스택

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **PWA**: next-pwa + Service Worker
- **Storage**: IndexedDB (Dexie.js) + AES-256 암호화
- **PDF**: jsPDF + html2canvas
- **Icons**: Lucide React
- **Date**: date-fns

## 📱 화면 구조

### 1. Today (오늘) - `/`
- 오늘의 루틴 목록 및 진행률
- 체크/기록/사진 입력
- 마감 타이머 및 알림

### 2. Routines (루틴 관리) - `/routines`
- 루틴 생성/편집/삭제
- 반복 주기 설정 (일간/주간/월간)
- 입력 타입 설정 (체크/숫자/텍스트/사진)

### 3. History (이력) - `/history`
- 날짜별 완료/미완료 기록 확인
- 주간/월간 이력 조회
- 완료율 및 성취도 표시

### 4. Reports (보고서) - `/reports`
- 주간/월간 PDF 보고서 생성
- 루틴별 성과 분석
- 일별 성취율 차트

### 5. Settings (설정) - `/settings`
- PIN/생체인식 잠금 설정
- 알림 on/off
- 데이터 내보내기/가져오기

## 🚀 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

## 💾 데이터 구조

### Routine (루틴)
```typescript
interface Routine {
  id?: number
  name: string              // 루틴 이름
  description?: string      // 설명
  repeatPattern: 'daily' | 'weekly' | 'monthly'
  repeatDays?: number[]     // 반복 요일/날짜
  deadline?: string         // 마감 시간 (HH:MM)
  itemType: 'boolean' | 'number' | 'text' | 'photo'
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

### RoutineInstance (루틴 인스턴스)
```typescript
interface RoutineInstance {
  id?: number
  routineId: number
  date: string              // YYYY-MM-DD
  completed: boolean
  value?: string | number | boolean
  photos?: string[]         // 암호화된 base64 사진들
  notes?: string
  completedAt?: Date
  createdAt: Date
}
```

## 🔒 보안 기능

- **AES-256 암호화**: 모든 저장 데이터 암호화
- **PIN 잠금**: 4자리 숫자 PIN
- **생체인식**: 지문/얼굴 인식 (WebAuthn API)
- **로컬 저장소**: 서버 전송 없음

## 📊 알림 시스템

- **마감 알림**: 마감 30분 전 브라우저 알림
- **놓친 알림**: 앱 실행시 미완료 루틴 확인
- **Service Worker**: 백그라운드 알림 지원

## 📈 리포트 기능

### 주간/월간 리포트 포함 내용
- 전체 성취율
- 루틴별 완료율 및 순위
- 일별 성취도 차트
- PDF 다운로드 지원

## 🔄 데이터 백업

### 내보내기
- 모든 데이터를 암호화하여 `.checkkit` 파일로 저장
- 루틴, 인스턴스, 설정 포함

### 가져오기
- `.checkkit` 파일에서 데이터 복원
- 기존 데이터는 완전 대체

## 🌐 PWA 기능

- **오프라인 동작**: Service Worker 캐싱
- **설치 가능**: 홈 화면에 추가
- **반응형**: 모바일 우선 디자인
- **앱스토어 준비**: 메타데이터 및 아이콘 완비

## 🔧 개발 가이드

### 프로젝트 구조
```
src/
├── app/                 # Next.js App Router
├── components/          # React 컴포넌트
│   ├── screens/        # 화면별 컴포넌트
│   └── Navigation.tsx  # 하단 네비게이션
├── lib/                # 유틸리티
│   ├── database.ts     # Dexie DB 설정
│   └── notifications.ts # 알림 서비스
└── hooks/              # React 훅스
```

### 새 루틴 타입 추가
1. `database.ts`에서 `itemType` 확장
2. `TodayScreen.tsx`에서 입력 컴포넌트 추가
3. `RoutinesScreen.tsx`에서 옵션 추가

## 📝 라이센스

MIT License - 개인 및 상업적 용도 자유롭게 사용 가능

## 🤝 기여

이슈 리포트 및 기능 제안은 GitHub Issues를 통해 해주세요.
