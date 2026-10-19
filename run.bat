@echo off
setlocal
cd /d "%~dp0"
if defined JAVA_HOME set "PATH=%JAVA_HOME%\bin;%PATH%"
if not exist build\classes mkdir build\classes
javac --release 21 -encoding UTF-8 -d build\classes src\main\java\br\com\rancing\*.java
if errorlevel 1 exit /b 1
java -cp build\classes br.com.rancing.App
