@echo off
echo ========================================
echo 교육 과정 시간표 생성 시스템 설치
echo ========================================
echo.

echo [1/4] 백엔드 의존성 설치 중...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo 백엔드 설치 실패!
    exit /b %errorlevel%
)
echo 백엔드 의존성 설치 완료!
echo.

echo [2/4] 백엔드 환경변수 설정...
if not exist .env (
    copy .env.example .env
    echo .env 파일이 생성되었습니다.
) else (
    echo .env 파일이 이미 존재합니다.
)
echo.

echo [3/4] 프론트엔드 의존성 설치 중...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo 프론트엔드 설치 실패!
    exit /b %errorlevel%
)
echo 프론트엔드 의존성 설치 완료!
echo.

echo [4/4] 프론트엔드 환경변수 설정...
if not exist .env (
    copy .env.example .env
    echo .env 파일이 생성되었습니다.
) else (
    echo .env 파일이 이미 존재합니다.
)
echo.

cd ..
echo ========================================
echo 설치가 완료되었습니다!
echo ========================================
echo.
echo 다음 단계:
echo 1. 백엔드 데이터베이스 초기화: cd backend ^& npm run init-db
echo 2. 백엔드 서버 실행: cd backend ^& npm run dev
echo 3. 프론트엔드 서버 실행: cd frontend ^& npm run dev
echo.
pause
