# Signs the CFA Pakistan APK with the release key.
# Run from PowerShell:  powershell -ExecutionPolicy Bypass -File D:\cfa-directory\android\sign.ps1
#
# First run: creates the signing key at D:\cfa-keys\cfa-release.keystore (it asks you for a password
# and your organisation details). KEEP THIS FILE AND PASSWORD SAFE FOREVER (USB + Google Drive):
# without them you can never publish an update to this app.

$ErrorActionPreference = "Stop"
$env:JAVA_HOME = "D:\android-tools\jdk"
$bt = "D:\android-tools\sdk\build-tools\36.1.0"
$keystore = "D:\cfa-keys\cfa-release.keystore"
$unsigned = Join-Path $PSScriptRoot "app\build\outputs\apk\release\app-release-unsigned.apk"
$out = Join-Path $PSScriptRoot "CFA-Pakistan.apk"

if (-not (Test-Path $unsigned)) { throw "Build the app first: $unsigned not found" }

if (-not (Test-Path $keystore)) {
  New-Item -ItemType Directory -Force (Split-Path $keystore) | Out-Null
  Write-Host "Creating the release key. Choose a strong password and write it down." -ForegroundColor Yellow
  & "$env:JAVA_HOME\bin\keytool.exe" -genkeypair -v -keystore $keystore -alias cfa -keyalg RSA -keysize 2048 -validity 10000
  if ($LASTEXITCODE -ne 0) { throw "Key was not created" }
}

Write-Host "Signing... (enter the key password)" -ForegroundColor Yellow
& "$bt\apksigner.bat" sign --ks $keystore --ks-key-alias cfa --out $out $unsigned
if ($LASTEXITCODE -ne 0) { throw "Signing failed" }

# The website offers this file for download; push the change to publish the new version.
$site = Join-Path $PSScriptRoot "..\public\download\CFA-Pakistan.apk"
New-Item -ItemType Directory -Force (Split-Path $site) | Out-Null
Copy-Item $out $site -Force

Write-Host ""
Write-Host "Signed APK: $out (also copied to public\download for the website)" -ForegroundColor Green
Write-Host "Send Claude the SHA-256 line below (it is public, not a secret):" -ForegroundColor Green
& "$bt\apksigner.bat" verify --print-certs $out | Select-String "SHA-256"
