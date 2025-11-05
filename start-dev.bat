@echo off
echo ========================================
echo 개발 서버 시작
echo ========================================
echo.
echo 백엔드 서버: http://localhost:5000
echo 프론트엔드: http://localhost:3000
echo.
echo 두 개의 터미널 창이 열립니다.
echo 종료하려면 각 창에서 Ctrl+C를 누르세요.
echo.

start "Backend Server" cmd /k "cd backend && npm run dev"
timeout /t 2 /nobreak >nul
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo 서버가 시작되었습니다!
echo.
