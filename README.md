# BRFTA Order Hub v1.0

구조:
- `/index.html` : 주문 메인페이지
- `/multi/` : 기존 고객 주문페이지 v1.9.1 (원본 그대로 복사)
- `/downloads/로젠택배_다배송_FORM.xlsx` : 고객용 로젠택배 다배송 Excel 양식

연결:
1. 다중배송 입력 시스템 -> `./multi/`
2. 네이버 스마트스토어 -> `https://smartstore.naver.com/brfta`
3. 로젠택배 Excel -> `./downloads/로젠택배_다배송_FORM.xlsx`
4. 주문관리 시스템 -> `https://brfta-order-admin.brfrescofruta.workers.dev/`

주의: 관리자 v1.3 Worker 코드는 이 패키지에서 수정하지 않습니다.
