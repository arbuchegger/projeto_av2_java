@echo off
setlocal
cd /d "%~dp0"
if defined JAVA_HOME set "PATH=%JAVA_HOME%\bin;%PATH%"
if not exist build\test-classes mkdir build\test-classes
javac --release 21 -encoding UTF-8 -d build\test-classes src\main\java\br\com\rancing\*.java src\test\java\br\com\rancing\*.java
if errorlevel 1 exit /b 1
java -cp build\test-classes br.com.rancing.ReservasTest
