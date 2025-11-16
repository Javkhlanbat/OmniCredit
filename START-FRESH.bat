@echo off
echo ================================
echo   OmniCredit - Fresh Start
echo ================================
echo.

echo [1/3] Killing any running backend servers...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

echo [2/3] Starting backend server...
cd backend
start "OmniCredit Backend" cmd /k "npm start"
timeout /t 5 >nul

echo [3/3] Opening admin test page...
cd ..
start "" "test-admin-frontend.html"

echo.
echo ================================
echo   Setup Complete!
echo ================================
echo.
echo Next steps:
echo 1. Wait for backend to load (5-10 seconds)
echo 2. In the test page, click "Login"
echo 3. Then click "Get Users"
echo 4. You should see 5 users
echo.
echo Backend is running at: http://localhost:5000
echo.
pause
