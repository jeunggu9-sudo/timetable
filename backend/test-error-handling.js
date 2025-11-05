/**
 * 에러 처리 미들웨어 테스트 스크립트
 * 
 * 실행 방법:
 * 1. 백엔드 서버를 시작합니다: npm run dev
 * 2. 다른 터미널에서 이 스크립트를 실행합니다: node test-error-handling.js
 */

const BASE_URL = 'http://localhost:5000/api';

async function testErrorHandling() {
  console.log('=== 에러 처리 미들웨어 테스트 시작 ===\n');

  // 테스트 1: ValidationError - 필수 파라미터 누락
  console.log('테스트 1: ValidationError - 시작 날짜 누락');
  try {
    const response = await fetch(`${BASE_URL}/generate-schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await response.json();
    console.log(`상태 코드: ${response.status}`);
    console.log(`응답:`, data);
    console.log(`✓ ValidationError 처리 성공 (400 예상)\n`);
  } catch (error) {
    console.log(`✗ 테스트 실패:`, error.message, '\n');
  }

  // 테스트 2: ValidationError - 잘못된 날짜 형식
  console.log('테스트 2: ValidationError - 잘못된 날짜 형식');
  try {
    const response = await fetch(`${BASE_URL}/generate-schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: 'invalid-date' })
    });
    const data = await response.json();
    console.log(`상태 코드: ${response.status}`);
    console.log(`응답:`, data);
    console.log(`✓ ValidationError 처리 성공 (400 예상)\n`);
  } catch (error) {
    console.log(`✗ 테스트 실패:`, error.message, '\n');
  }

  // 테스트 3: NotFoundError - 존재하지 않는 일정 조회
  console.log('테스트 3: NotFoundError - 존재하지 않는 일정 삭제');
  try {
    const response = await fetch(`${BASE_URL}/schedules/99999`, {
      method: 'DELETE'
    });
    const data = await response.json();
    console.log(`상태 코드: ${response.status}`);
    console.log(`응답:`, data);
    console.log(`✓ NotFoundError 처리 성공 (404 예상)\n`);
  } catch (error) {
    console.log(`✗ 테스트 실패:`, error.message, '\n');
  }

  // 테스트 4: ValidationError - 선배정 필수 파라미터 누락
  console.log('테스트 4: ValidationError - 선배정 필수 파라미터 누락');
  try {
    const response = await fetch(`${BASE_URL}/schedules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId: 1 })
    });
    const data = await response.json();
    console.log(`상태 코드: ${response.status}`);
    console.log(`응답:`, data);
    console.log(`✓ ValidationError 처리 성공 (400 예상)\n`);
  } catch (error) {
    console.log(`✗ 테스트 실패:`, error.message, '\n');
  }

  // 테스트 5: ValidationError - 휴무일 추가 시 잘못된 타입
  console.log('테스트 5: ValidationError - 휴무일 추가 시 잘못된 instructorId 타입');
  try {
    const response = await fetch(`${BASE_URL}/off-days`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instructorId: 'invalid', date: '2025-01-01' })
    });
    const data = await response.json();
    console.log(`상태 코드: ${response.status}`);
    console.log(`응답:`, data);
    console.log(`✓ ValidationError 처리 성공 (400 예상)\n`);
  } catch (error) {
    console.log(`✗ 테스트 실패:`, error.message, '\n');
  }

  // 테스트 6: 정상 요청 - 교관 목록 조회
  console.log('테스트 6: 정상 요청 - 교관 목록 조회');
  try {
    const response = await fetch(`${BASE_URL}/instructors`);
    const data = await response.json();
    console.log(`상태 코드: ${response.status}`);
    console.log(`응답:`, data);
    console.log(`✓ 정상 요청 처리 성공 (200 예상)\n`);
  } catch (error) {
    console.log(`✗ 테스트 실패:`, error.message, '\n');
  }

  console.log('=== 에러 처리 미들웨어 테스트 완료 ===');
}

// 스크립트 실행
testErrorHandling().catch(error => {
  console.error('테스트 실행 중 오류 발생:', error);
  process.exit(1);
});
