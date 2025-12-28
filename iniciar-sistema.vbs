Set WshShell = CreateObject("WScript.Shell")

' 1. Iniciar Backend Escondido (Flag 0 = Escondido)
WshShell.Run "cmd /c cd backend && npx ts-node src/server.ts", 0

' 2. Iniciar Frontend Escondido
WshShell.Run "cmd /c cd frontend && npm run dev", 0

' 3. Esperar 5 segundos para tudo carregar
WScript.Sleep 5000

' 4. Abrir o Navegador
WshShell.Run "http://localhost:5173"