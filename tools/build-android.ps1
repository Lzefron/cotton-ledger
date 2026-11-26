param(
    [string]$Sdk = 'E:\Android tools\Sdk',
    [string]$Jdk = 'C:\Program Files\Microsoft\jdk-25.0.1.8-hotspot'
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$env:JAVA_HOME = $Jdk
$env:TEMP = Join-Path $projectRoot 'build\temp'
$env:TMP = $env:TEMP
$env:PATH = (Join-Path $Jdk 'bin') + ';' + $env:PATH
$build = Join-Path $projectRoot 'build'
$classes = Join-Path $build 'classes'
$dex = Join-Path $build 'dex'
$output = Join-Path $projectRoot 'releases'
$signing = Join-Path $projectRoot 'signing'
New-Item -ItemType Directory -Force -Path $build,$classes,$dex,$output,$signing,$env:TEMP | Out-Null
$buildTools = Join-Path $Sdk 'build-tools\36.0.0'
$androidJar = Join-Path $Sdk 'platforms\android-35\android.jar'
function Run-Step([string]$exe, [string[]]$arguments) {
    & $exe @arguments
    if ($LASTEXITCODE -ne 0) { throw "Build failed: $exe ($LASTEXITCODE)" }
}
Run-Step (Join-Path $buildTools 'aapt2.exe') @('compile','--dir',(Join-Path $projectRoot 'android\res'),'-o',(Join-Path $build 'resources.zip'))
Run-Step (Join-Path $buildTools 'aapt2.exe') @('link','-o',(Join-Path $build 'unsigned.apk'),'--manifest',(Join-Path $projectRoot 'android\AndroidManifest.xml'),'-I',$androidJar,'--min-sdk-version','26','--target-sdk-version','35','--version-code','1','--version-name','1.0.0','-A',(Join-Path $projectRoot 'web'),(Join-Path $build 'resources.zip'))
$javaSources = @(Get-ChildItem (Join-Path $projectRoot 'android\src') -Filter '*.java' -Recurse | ForEach-Object { $_.FullName })
Run-Step (Join-Path $Jdk 'bin\javac.exe') (@('--release','8','-encoding','UTF-8','-classpath',$androidJar,'-d',$classes) + $javaSources)
$classFiles = @(Get-ChildItem $classes -Filter '*.class' -Recurse | ForEach-Object { $_.FullName })
Run-Step (Join-Path $buildTools 'd8.bat') (@('--lib',$androidJar,'--min-api','26','--output',$dex) + $classFiles)
Run-Step (Join-Path $Jdk 'bin\jar.exe') @('uf',(Join-Path $build 'unsigned.apk'),'-C',$dex,'classes.dex')
Run-Step (Join-Path $buildTools 'zipalign.exe') @('-f','-p','4',(Join-Path $build 'unsigned.apk'),(Join-Path $build 'aligned.apk'))
$key = Join-Path $signing 'cotton-ledger-local.jks'
if (!(Test-Path -LiteralPath $key)) {
    Run-Step (Join-Path $Jdk 'bin\keytool.exe') @('-genkeypair','-keystore',$key,'-storepass','android','-keypass','android','-alias','cottonledger','-dname','CN=Cotton Ledger Local Build','-keyalg','RSA','-keysize','2048','-validity','10000')
}
Run-Step (Join-Path $buildTools 'apksigner.bat') @('sign','--ks',$key,'--ks-key-alias','cottonledger','--ks-pass','pass:android','--key-pass','pass:android','--out',(Join-Path $output 'Cotton-Ledger.apk'),(Join-Path $build 'aligned.apk'))
Run-Step (Join-Path $buildTools 'apksigner.bat') @('verify','--verbose',(Join-Path $output 'Cotton-Ledger.apk'))
Write-Output "Built: $(Join-Path $output 'Cotton-Ledger.apk')"
