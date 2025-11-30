@echo off
title Reinstalar Dependencias - AppTeste
echo ==========================================
echo      REINSTALANDO DEPENDENCIAS
echo ==========================================
echo.
echo [AVISO] Isso vai apagar a pasta node_modules e reinstalar tudo.
echo Use isso se o app nao estiver abrindo em um novo computador.
echo.
pause

echo.
echo [1/3] Removendo node_modules antiga...
if exist node_modules (
    rmdir /s /q node_modules
    echo Pasta node_modules removida.
) else (
    echo Pasta node_modules nao existia.
)

echo.
echo [2/3] Limpando cache do NPM (opcional)...
call npm cache clean --force

echo.
echo [3/3] Instalando dependencias...
call npm install

if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Houve um problema na instalacao.
    echo Verifique sua conexao com a internet.
    pause
    exit /b
)

echo.
echo [SUCESSO] Dependencias reinstaladas!
echo Voce ja pode tentar abrir o app novamente.
echo.
pause
