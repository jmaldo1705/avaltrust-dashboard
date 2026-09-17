# Script de verificación de configuración para despliegue
# Verifica que todo esté correctamente configurado antes del deploy

Write-Host "🔍 Verificando configuración de despliegue..." -ForegroundColor Cyan
Write-Host ""

$errors = 0
$warnings = 0

# 1. Verificar archivos de entorno
Write-Host "📁 Verificando archivos de entorno..." -ForegroundColor Yellow

if (Test-Path "projects/dashboard/src/app/environments/environment.ts") {
    Write-Host "✓ environment.ts existe" -ForegroundColor Green
} else {
    Write-Host "✗ environment.ts NO encontrado" -ForegroundColor Red
    $errors++
}

if (Test-Path "projects/dashboard/src/app/environments/environment.prod.ts") {
    Write-Host "✓ environment.prod.ts existe" -ForegroundColor Green
} else {
    Write-Host "✗ environment.prod.ts NO encontrado" -ForegroundColor Red
    $errors++
}

# 2. Verificar contenido de environment.prod.ts
Write-Host ""
Write-Host "🔗 Verificando URLs de producción..." -ForegroundColor Yellow

$prodContent = Get-Content "projects/dashboard/src/app/environments/environment.prod.ts" -Raw -ErrorAction SilentlyContinue
if ($prodContent -match "https://avaltrustback-production.up.railway.app") {
    Write-Host "✓ URL de Railway configurada correctamente" -ForegroundColor Green
} else {
    Write-Host "✗ URL de Railway NO encontrada en environment.prod.ts" -ForegroundColor Red
    $errors++
}

# 3. Verificar angular.json
Write-Host ""
Write-Host "⚙️  Verificando angular.json..." -ForegroundColor Yellow

$angularJson = Get-Content "angular.json" -Raw -ErrorAction SilentlyContinue
if ($angularJson -match "fileReplacements") {
    Write-Host "✓ fileReplacements configurado en angular.json" -ForegroundColor Green
} else {
    Write-Host "✗ fileReplacements NO configurado en angular.json" -ForegroundColor Red
    $errors++
}

# 4. Verificar package.json
Write-Host ""
Write-Host "📦 Verificando package.json..." -ForegroundColor Yellow

$packageJson = Get-Content "package.json" -Raw -ErrorAction SilentlyContinue
if ($packageJson -match '"build":\s*"ng build --configuration production"') {
    Write-Host "✓ Script de build configurado para producción" -ForegroundColor Green
} else {
    Write-Host "⚠ Script de build podría no usar configuración de producción" -ForegroundColor Yellow
    $warnings++
}

# 5. Verificar que auth.service.ts use environment
Write-Host ""
Write-Host "🔐 Verificando auth.service.ts..." -ForegroundColor Yellow

$authService = Get-Content "projects/dashboard/src/app/auth/auth.service.ts" -Raw -ErrorAction SilentlyContinue

if ($authService -match "import.*environment.*from.*environments/environment") {
    Write-Host "✓ auth.service.ts importa environment" -ForegroundColor Green
} else {
    Write-Host "✗ auth.service.ts NO importa environment" -ForegroundColor Red
    $errors++
}

if ($authService -match "environment\.apiUrl") {
    Write-Host "✓ auth.service.ts usa environment.apiUrl" -ForegroundColor Green
} else {
    Write-Host "✗ auth.service.ts NO usa environment.apiUrl" -ForegroundColor Red
    $errors++
}

# 6. Verificar que no haya URLs hardcodeadas (excluyendo environment.ts)
Write-Host ""
Write-Host "🔎 Buscando URLs hardcodeadas..." -ForegroundColor Yellow

$hardcodedFiles = Get-ChildItem -Path "projects/dashboard/src/app" -Filter "*.ts" -Recurse | 
    Where-Object { $_.Name -ne "environment.ts" } |
    Where-Object { (Get-Content $_.FullName -Raw) -match "http://localhost:8080" }

if ($hardcodedFiles.Count -eq 0) {
    Write-Host "✓ No se encontraron URLs hardcodeadas" -ForegroundColor Green
} else {
    Write-Host "⚠ Se encontraron $($hardcodedFiles.Count) archivo(s) con URLs hardcodeadas" -ForegroundColor Yellow
    Write-Host "   Archivos:" -ForegroundColor Yellow
    $hardcodedFiles | ForEach-Object { Write-Host "   - $($_.FullName)" -ForegroundColor Yellow }
    $warnings++
}

# Resumen
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "📊 RESUMEN" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

if ($errors -eq 0) {
    Write-Host "✓ Configuración correcta - Listo para deploy" -ForegroundColor Green
} else {
    Write-Host "✗ $errors error(es) encontrado(s) - Revisar antes de deploy" -ForegroundColor Red
}

if ($warnings -gt 0) {
    Write-Host "⚠ $warnings advertencia(s)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 Siguiente paso:" -ForegroundColor Cyan
Write-Host "   npm run build" -ForegroundColor White
Write-Host "   git add ." -ForegroundColor White
Write-Host "   git commit -m 'fix: configurar URLs de producción'" -ForegroundColor White
Write-Host "   git push" -ForegroundColor White
Write-Host ""

if ($errors -gt 0) {
    exit 1
} else {
    exit 0
}
