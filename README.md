<p align="center">
  <strong>한국어</strong> ·
  <a href="./README.en.md">English</a> ·
  <a href="./README.zh-CN.md">简体中文</a>
</p>

<p align="center">
  <img src="./public/icons/icon-192.png" width="112" height="112" alt="Screenshot Shield 방패 로고" />
</p>

<h1 align="center">Screenshot Shield</h1>

<p align="center">
  <strong>공유하기 전에, 먼저 가리세요.</strong><br />
  스크린샷을 서버에 올리지 않고 브라우저 안에서 직접 검토하고 가리는<br />
  한국어 우선 · 다국어 · 로컬 전용 프라이버시 편집기
</p>

<p align="center">
  <a href="https://github.com/YoungsPlace/screenshot-shield/actions/workflows/ci.yml">
    <img src="https://github.com/YoungsPlace/screenshot-shield/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI 상태" />
  </a>
  <a href="https://github.com/YoungsPlace/screenshot-shield/actions/workflows/deploy.yml">
    <img src="https://github.com/YoungsPlace/screenshot-shield/actions/workflows/deploy.yml/badge.svg?branch=main" alt="GitHub Pages 배포 상태" />
  </a>
  <br />
  <strong>로컬 전용 소스 · 한국어 / 영어 / 중국어 간체</strong>
</p>

<p align="center">
  <a href="https://youngsplace.github.io/screenshot-shield/?view=editor&lang=ko"><strong>로컬 편집기 열기</strong></a>
  ·
  <a href="https://youngsplace.github.io/screenshot-shield/?lang=ko"><strong>출시 스토리 보기</strong></a>
  ·
  <a href="https://youngsplace.github.io/screenshot-shield/privacy.html?lang=ko">프라이버시</a>
  ·
  <a href="https://youngsplace.github.io/screenshot-shield/support.html?lang=ko">지원</a>
</p>

<p align="center">
  <a href="https://youngsplace.github.io/screenshot-shield/?lang=ko">
    <img src="./public/social-card.png" width="960" alt="Screenshot Shield — 공유 전에 가리기" />
  </a>
</p>

## 왜 Screenshot Shield인가요?

- **이미지는 로컬에서만 처리됩니다.** 업로드 엔드포인트, 계정, 광고, 분석, 추적 또는 원격 OCR이 없습니다.
- **원본 대신 새 결과물을 만듭니다.** 검토가 끝난 화면을 새 캔버스에 렌더링해 PNG 또는 JPEG로 준비합니다.
- **자동 제안에 의존하지 않습니다.** OCR을 사용할 수 없거나 놓친 항목이 있어도 수동 가리기·이동·크기 조절·삭제를 계속 사용할 수 있습니다.
- **공유는 별도의 명시적 동작입니다.** 준비된 새 결과물만 사용자가 선택한 다운로드/저장 또는 공유 흐름으로 전달됩니다.

## 합성 주민등록증 데모

아래 카드는 **실제 주민등록증의 복제물이 아니라**, 민감정보 가리기 흐름을 설명하기 위해 만든 명백한 합성 프로필입니다. 캐릭터 이름 `김빵주`, 의도적으로 무효인 예시번호 `940913-1234567`, 가상 세대 `서울 올림픽파크포레온 999동 999호`는 모두 테스트 전용이며 실제 인물을 나타내지 않습니다.

<p align="center">
  <img src="./docs/assets/synthetic-id-redaction-demo.svg" width="960" alt="합성 프로필 김빵주의 이름, 무효 주민등록번호 예시와 가상 주소를 가리기 전후로 비교한 Screenshot Shield 데모" />
</p>

이 예시는 이름·식별번호·주소·캐릭터 얼굴을 직접 검토하여 가린 뒤, 원본이 아닌 **새로 렌더링된 결과물**만 준비하는 제품 경계를 보여줍니다. 실제 민감정보가 포함된 이미지를 저장소·이슈·테스트 자료에 올리지 마세요.

## 바로 사용하기

| 언어            | 출시 화면                                                                  | 편집기 바로 열기                                                                         |
| --------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **한국어**      | [출시 스토리](https://youngsplace.github.io/screenshot-shield/?lang=ko)    | [한국어 편집기](https://youngsplace.github.io/screenshot-shield/?view=editor&lang=ko)    |
| **영어**        | [출시 스토리](https://youngsplace.github.io/screenshot-shield/?lang=en)    | [영어 편집기](https://youngsplace.github.io/screenshot-shield/?view=editor&lang=en)      |
| **중국어 간체** | [출시 스토리](https://youngsplace.github.io/screenshot-shield/?lang=zh-CN) | [중국어 편집기](https://youngsplace.github.io/screenshot-shield/?view=editor&lang=zh-CN) |

Screenshot Shield는 브라우저 안에서 새로 가린 스크린샷을 준비하는 한국어 우선 다국어 모바일 웹 도구입니다. 이미지 업로드 서비스가 아닙니다.

[프라이버시 정책](https://youngsplace.github.io/screenshot-shield/privacy.html?lang=ko) ·
[지원](https://youngsplace.github.io/screenshot-shield/support.html?lang=ko) ·
[보안 제보 정책](./SECURITY.md)

## 모바일 사용 흐름

1. 위 언어 링크를 열고 **사진** 또는 **파일**에서 스크린샷을 선택합니다. 데스크톱에서는 붙여넣기와 끌어놓기도 사용할 수 있습니다.
2. 로컬 자동 제안을 검토한 다음 수동 가림 영역을 추가하고 선택·이동·크기 조절·삭제합니다. OCR을 사용할 수 없거나 항목을 놓쳐도 수동 가리기는 계속 사용할 수 있습니다.
3. 최종 미리보기를 검토하고 새 PNG 또는 JPEG를 준비합니다. 편집기는 원본 바이트나 메타데이터를 재사용하지 않고 새 캔버스에 결과를 그립니다.
4. 브라우저가 파일 공유를 지원하면 별도의 사용자 동작으로 공유하거나, 같은 준비된 파일을 다운로드·저장합니다.

선택한 공유 대상은 Screenshot Shield가 아니라 해당 대상의 정책에 따라 결과물을 저장하거나 업로드할 수 있습니다. 전달하기 전에 완성된 이미지를 직접 확인하세요.

## 편집기 우선 경로·언어·설치 동작

루트 서비스는 한국어 출시 화면입니다. 출시 화면을 건너뛰려면 다음 편집기 우선 주소를 사용하세요.

- `https://youngsplace.github.io/screenshot-shield/?view=editor&lang=ko`
- `https://youngsplace.github.io/screenshot-shield/?view=editor&lang=en`
- `https://youngsplace.github.io/screenshot-shield/?view=editor&lang=zh-CN`

공개 언어 태그는 정확히 `ko`, `en`, `zh-CN`입니다. `lang` 값이 없거나 유효하지 않거나 잘못 구성되거나 중복되면 브라우저 언어와 관계없이 한국어를 사용합니다. `lang=zh`는 앱에서 `zh-CN`으로 정규화합니다.

일반 화면에서 사용자가 명시적으로 선택한 언어만 `localStorage`의 `screenshot-shield.locale`에 저장할 수 있습니다. 홈 화면에서 설치된 앱을 시작하면 편집기 우선으로 열리고 렌더링 전에 이 설정 하나만 읽습니다. 저장소가 비워졌거나 사용할 수 없거나 값이 잘못되었거나 접근이 차단되면 한국어로 돌아갑니다. 일반 루트 주소는 이 설정을 읽지 않으며 항상 한국어입니다. 이미지·파일명·가림 영역·OCR 결과·준비된 출력·편집 이력은 저장하지 않습니다.

앱은 하나의 고정 웹 매니페스트와 하나의 모바일 웹 정체성을 사용합니다. 브라우저 설치는 브라우저가 제어합니다. iPhone 또는 iPad Safari에서는 **공유 → 홈 화면에 추가**, Android Chromium에서는 브라우저가 제공할 때만 **앱 설치** 또는 **홈 화면에 추가**를 사용하세요. 메뉴 이름과 제공 여부는 브라우저·운영체제·정책에 따라 달라집니다. 홈 화면에서 실행되더라도 모바일 웹 앱이며 네이티브 바이너리나 앱 스토어 등록을 의미하지 않습니다.

## 제공 상태와 경계

현재 제공한다고 주장하는 범위는 위 GitHub Pages 웹 서비스입니다. 저장소에는 브랜드가 적용된 Capacitor iOS/Android 0단계 프로젝트와 실패 차단형 정책 검사가 포함되어 있습니다. 그러나 정확한 도구 체인과 실제 기기의 시작 링크·이름 변경·타임스탬프·강제 종료 행렬 증거가 확인될 때까지 `npm run native:preflight`가 네이티브 런타임·공유 구현 확장을 차단합니다. 네이티브 제공 상태는 서명·코호트·심사·스토어 공개 증거가 확인될 때까지 추가로 차단됩니다. App Store 또는 Google Play 출시를 주장하지 않습니다.

웹 서비스 워커와 웹 오프라인 지원 주장은 없습니다. 브라우저가 자체 정책에 따라 리소스를 보관할 수는 있지만 Screenshot Shield는 오프라인 편집기나 오프라인 캐시 수명 주기를 제공하지 않습니다.

현재 웹 앱에는 애플리케이션 업로드 엔드포인트·백엔드·계정·광고·분석·원격 측정·추적·원격 OCR·외부 이미지 처리 API가 없습니다. 원본 이미지는 편집하는 동안 브라우저 메모리에만 있습니다. 의도된 유일한 이미지 반출은 사용자가 명시적으로 다운로드·저장 또는 공유한 새 가림 결과물입니다.

OCR과 자동 감지는 검토 보조 수단이며 보장이 아닙니다. OCR을 사용할 수 없거나 민감한 항목을 놓칠 수 있습니다. 얼굴 감지는 현재 범위 밖입니다. 브라우저 확장 프로그램, 손상된 기기·브라우저 또는 변조된 배포는 로컬 처리 경계를 무너뜨릴 수 있습니다.

계획된 네이티브 설계에서 명시적 공유는 새로 가린 결과물 하나만 제한된 비공개 캐시에 사용할 수 있습니다. 원본·백업·갤러리는 제외되며 일반 이미지 보관함이 아닙니다. 이 계획은 수신 앱의 열기·성공·취소·보관·삭제를 보장하지 않으며 현재 네이티브 앱이 제공된다는 증거도 아닙니다. 전체 구분은 [PRIVACY.md](./PRIVACY.md)를 확인하세요.

## 안전하게 문제 제보하기

일반적인 비민감 도움은 [공개 저장소](https://github.com/YoungsPlace/screenshot-shield)와 GitHub에 접근할 수 있을 때 [이슈](https://github.com/YoungsPlace/screenshot-shield/issues)를 사용하세요. 앱·배포 버전, 전체 주소와 언어, 기기, 운영체제·브라우저 버전, 재현 절차, 기대 결과와 실제 결과를 적고 이미 가렸거나 합성한 증거만 첨부하세요.

원본 스크린샷·자격 증명·실제 비밀·개인정보·공격 코드를 공개 이슈에 올리지 마세요. 예상하지 못한 네트워크 활동, 이미지 지속 저장, 출력·공유 경계 문제 또는 기타 취약점은 [보안 제보 정책](./SECURITY.md)을 사용하세요. 저장소 유지 관리는 실시간 응답이나 특정 응답 시간을 보장하지 않습니다.

## 향후 확장 경계

문서 스캔·원근 보정·대비 강화·PDF·추가 이미지 형식은 현재 출시 범위에 포함되지 않습니다. 향후에는 원본을 공유·다운로드 API에서 격리한 채 획득 → 비파괴 변환 → 가리기 → 검토 → 형식 인코딩 단계로 로컬 파이프라인을 확장해야 합니다. 새 인코더는 원본 파일이 아니라 검토가 끝난 렌더링 결과를 입력으로 사용해야 합니다.

광고나 다른 수익화 기능에는 별도로 승인된 프라이버시·동의·네트워크·콘텐츠 격리 설계가 필요합니다. 해당 기능은 원본 이미지·OCR 텍스트·가림 영역·준비된 파일·편집 동작에 접근할 수 없으며 추적 없는 로컬 편집기의 사용성을 약화해서는 안 됩니다.

## 기여와 로컬 개발

변경을 제안하기 전에 [CONTRIBUTING.md](./CONTRIBUTING.md)를 읽으세요. 브라우저 로컬 처리 경계, 기존 공개 경로, `?embed=editor`, 출시 화면과 GitHub Pages 하위 경로를 유지해야 합니다.

```bash
npm ci
npm run typecheck
npm run lint
npm run format:check
npm test
npm run native:policy
npm run store:verify
VITE_BASE_PATH=/screenshot-shield/ npm run build
VITE_BASE_PATH=/screenshot-shield/ PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173/screenshot-shield/ npm run e2e
```

`npm run build:native`와 `npm run cap:sync`는 모두 먼저 네이티브 사전 검사를 실행합니다. 검토된 전체 Xcode/JDK/Android SDK, 연결된 실제 iOS·Android 기기, 고정된 도구 체인·SPM 잠금, 서명된 실제 기기 게이트 증명이 없는 컴퓨터에서는 중단되는 것이 정상입니다. 이 중단을 우회하지 마세요. 자격 증명이 필요 없는 출시 준비 자료는 [`docs/native-release-runbook.md`](./docs/native-release-runbook.md), [`docs/rollback-and-observation.md`](./docs/rollback-and-observation.md), [`store/`](./store/)에 있습니다.

이 프로젝트는 Vite/React 정적 애플리케이션입니다. 테스트는 합성 이미지를 사용하며 외부 OCR 서비스가 아니라 실제 동작을 검증해야 합니다. 별도로 승인된 프라이버시·수명 주기 설계 없이 백엔드, 업로드 중계, 원격 측정, 원격 OCR, 서비스 워커, 웹 오프라인 지원 주장, 웹 공유 대상 또는 이미지 지속 저장을 추가하지 마세요.

## GitHub Pages 배포

GitHub Pages는 [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)을 통해 정적 `dist/` 결과물을 배포합니다. 저장소 설정에서 **Pages → Build and deployment → GitHub Actions**를 선택한 뒤 승인된 변경을 `main`에 병합합니다. 프로덕션 빌드는 Vite의 `/screenshot-shield/` 기본 경로를 유지해야 하며 로컬 개발은 `/`를 사용합니다.

이 배포는 네이티브 출시가 아닙니다. 독립적으로 승인된 서명·기기·스토어 심사·공개 제공 증거가 없으면 스토어 빌드가 제공된다고 표현하지 마세요.

## 라이선스

MIT. [LICENSE](./LICENSE)를 확인하세요.
