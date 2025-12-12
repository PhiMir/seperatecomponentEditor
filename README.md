# 🎮 Game Asset Extractor

게임 에셋 추출 툴 - 이미지에서 개별 오브젝트를 추출하고 배경을 제거한 뒤 화질을 향상시켜 게임 제작용 에셋으로 변환합니다.

![Game Asset Extractor](https://img.shields.io/badge/React-19.2.0-blue) ![Vite](https://img.shields.io/badge/Vite-7.2.4-purple) ![Tailwind](https://img.shields.io/badge/Tailwind-4.1.18-cyan)

## ✨ 주요 기능

- **🖱️ 영역 선택**: 마우스 드래그로 간편하게 오브젝트 영역 선택
- **🎨 배경 제거**: 자동으로 배경을 제거하여 투명 PNG 생성
- **📈 AI 화질 향상**: 2배/4배 업스케일링으로 화질 개선
- **💾 일괄 다운로드**: 개별 다운로드 또는 ZIP 파일로 일괄 다운로드
- **🎯 픽셀 퍼펙트**: 픽셀 아트에 최적화된 렌더링

## 🚀 시작하기

### 설치

```bash
# 저장소 클론
git clone https://github.com/yourusername/game-asset-extractor.git
cd game-asset-extractor

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 빌드 및 배포

```bash
# 프로덕션 빌드
npm run build

# 미리보기
npm run preview
```

## 📖 사용 방법

1. **이미지 업로드**: 방 레이아웃이나 스프라이트 시트 이미지를 업로드합니다
2. **영역 선택**: 마우스로 드래그하여 추출하고 싶은 오브젝트 영역을 선택합니다
3. **옵션 설정**: 업스케일 배율을 선택합니다 (1x, 2x, 4x)
4. **처리 실행**: "에셋 처리" 버튼을 클릭하여 배경 제거 및 화질 향상을 실행합니다
5. **다운로드**: 개별 에셋을 다운로드하거나 ZIP 파일로 일괄 다운로드합니다

## 🛠️ 기술 스택

- **React 19.2.0** - UI 라이브러리
- **Vite 7.2.4** - 빌드 도구
- **Tailwind CSS 4.1.18** - 스타일링
- **Lucide React** - 아이콘
- **JSZip** - ZIP 파일 생성
- **Canvas API** - 이미지 처리

## 🎯 활용 사례

- 2D 게임 개발을 위한 에셋 추출
- 스프라이트 시트에서 개별 스프라이트 분리
- 픽셀 아트 게임용 오브젝트 준비
- 게임 프로토타입 제작

## 📝 Todo

- [ ] 실제 AI 배경 제거 API 통합 (Remove.bg 또는 Hugging Face)
- [ ] 실제 AI 업스케일링 API 통합
- [ ] 자동 오브젝트 감지 기능
- [ ] 격자 기반 자동 선택
- [ ] 에셋 미리보기 및 편집
- [ ] 에셋 이름 커스터마이징

## 📄 라이센스

MIT License

## 👤 개발자

노나다 - 고등학교 2학년 프로그래머

## 🙏 감사의 말

이 프로젝트는 수학 및 게임 개발 교육을 목적으로 만들어졌습니다.
