@echo off
cd /d "%~dp0"

echo INICIANDO O BACKEND...
start "SERVIDOR (NAO FECHE)" cmd /k "cd backend && npx ts-node src/server.ts"

echo INICIANDO O FRONTEND...
start "SITE (NAO FECHE)" cmd /k "cd frontend && npm run dev"

echo ABRINDO O NAVEGADOR EM 5 SEGUNDOS...
timeout /t 5
start http://localhost:5173

exit