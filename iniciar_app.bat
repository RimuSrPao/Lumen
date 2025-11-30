@echo off
title AppTeste Launcher
echo ==========================================
echo           Iniciando AppTeste
echo ==========================================
echo.

:: Verifica se o Node.js está instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado!
    echo Por favor, instale o Node.js em https://nodejs.org/
    pause
    exit
)

:: Verifica se as dependências já foram instaladas
if not exist node_modules (
    echo [INFO] Instalando dependencias pela primeira vez...
    echo Isso pode levar alguns minutos.
    call npm install
    if %errorlevel% neq 0 (
        echo [ERRO] Falha na instalacao das dependencias.
        pause
        exit
    )
)

echo.
echo [INFO] Iniciando aplicacao...
echo Pressione Ctrl+C para encerrar.
echo.

call npm run electron:dev

if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Ocorreu um erro ao executar a aplicacao.
    echo.
    echo -------------------------------------------------------------
    echo DICA: Se voce trocou de computador ou esta rodando pela primeira vez aqui:
    echo Tente rodar o arquivo 'reinstalar_dependencias.bat' para corrigir.
    echo -------------------------------------------------------------
    echo.
    pause
)
