# BRFTA 다중배송 주문 v1.9

실제 Cloudflare Worker + D1 주문 접수 연결 버전입니다.

업로드할 파일:
- index.html
- style.css
- config.js
- app.js

GitHub 저장소 루트의 동일 파일을 이 버전으로 교체하세요.

API:
https://brfta-order-api.brfrescofruta.workers.dev/orders

주요 변경:
- 받는 사람 입력란 정상 생성
- 우편번호 / 기본주소 분리 저장
- 실제 주문 접수 API 연결
- 주문 금액 / 배송비 전송
- 중복 주문 접수 방지
- 테스트 버전 안내문 제거
- 캐시 버전 v1.9.0 적용
