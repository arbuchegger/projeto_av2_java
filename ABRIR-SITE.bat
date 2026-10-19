@echo off
setlocal
cd /d "%~dp0"
if defined JAVA_HOME set "PATH=%JAVA_HOME%\bin;%PATH%"
where java >nul 2>nul
if errorlevel 1 (
  echo Instale o Java 21 ou superior e abra este arquivo novamente.
  echo Download: https://adoptium.net/temurin/releases/?version=21
  pause
  exit /b 1
)
if not exist dist\RancingExperience.jar (
  echo O arquivo dist\RancingExperience.jar nao foi encontrado.
  echo Baixe e extraia a versao completa do projeto.
  pause
  exit /b 1
)
if not defined DATA_DIR set "DATA_DIR=%~dp0data"
java -jar dist\RancingExperience.jar
if errorlevel 1 (
  echo.
  echo Confira se o Java e versao 21 ou superior e se a versao antiga do site foi encerrada.
  pause
)
