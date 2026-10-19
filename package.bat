@echo off
setlocal
cd /d "%~dp0"
if defined JAVA_HOME set "PATH=%JAVA_HOME%\bin;%PATH%"
if not exist build\classes mkdir build\classes
if not exist dist mkdir dist
javac --release 21 -encoding UTF-8 -d build\classes src\main\java\br\com\rancing\*.java
if errorlevel 1 exit /b 1
jar --create --file dist\RancingExperience.jar --main-class br.com.rancing.App -C build\classes . -C . index.html -C . app.js -C . style.css -C . assets -C . carros
