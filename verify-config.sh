#!/bin/bash

# Script de verificación de configuración para despliegue
# Verifica que todo esté correctamente configurado antes del deploy

echo "🔍 Verificando configuración de despliegue..."
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

errors=0
warnings=0

# 1. Verificar archivos de entorno
echo "📁 Verificando archivos de entorno..."

if [ -f "src/app/environments/environment.ts" ]; then
    echo -e "${GREEN}✓${NC} environment.ts existe"
else
    echo -e "${RED}✗${NC} environment.ts NO encontrado"
    ((errors++))
fi

if [ -f "src/app/environments/environment.prod.ts" ]; then
    echo -e "${GREEN}✓${NC} environment.prod.ts existe"
else
    echo -e "${RED}✗${NC} environment.prod.ts NO encontrado"
    ((errors++))
fi

# 2. Verificar contenido de environment.prod.ts
echo ""
echo "🔗 Verificando URLs de producción..."

if grep -q "https://avaltrustback-production.up.railway.app" "src/app/environments/environment.prod.ts"; then
    echo -e "${GREEN}✓${NC} URL de Railway configurada correctamente"
else
    echo -e "${RED}✗${NC} URL de Railway NO encontrada en environment.prod.ts"
    ((errors++))
fi

# 3. Verificar angular.json
echo ""
echo "⚙️  Verificando angular.json..."

if grep -q "fileReplacements" "angular.json"; then
    echo -e "${GREEN}✓${NC} fileReplacements configurado en angular.json"
else
    echo -e "${RED}✗${NC} fileReplacements NO configurado en angular.json"
    ((errors++))
fi

# 4. Verificar package.json
echo ""
echo "📦 Verificando package.json..."

if grep -q "\"build\": \"ng build --configuration production\"" "package.json"; then
    echo -e "${GREEN}✓${NC} Script de build configurado para producción"
else
    echo -e "${YELLOW}⚠${NC} Script de build podría no usar configuración de producción"
    ((warnings++))
fi

# 5. Verificar que auth.service.ts use environment
echo ""
echo "🔐 Verificando auth.service.ts..."

if grep -q "import.*environment.*from.*environments/environment" "src/app/auth/auth.service.ts"; then
    echo -e "${GREEN}✓${NC} auth.service.ts importa environment"
else
    echo -e "${RED}✗${NC} auth.service.ts NO importa environment"
    ((errors++))
fi

if grep -q "environment.apiUrl" "src/app/auth/auth.service.ts"; then
    echo -e "${GREEN}✓${NC} auth.service.ts usa environment.apiUrl"
else
    echo -e "${RED}✗${NC} auth.service.ts NO usa environment.apiUrl"
    ((errors++))
fi

# 6. Verificar que no haya URLs hardcodeadas
echo ""
echo "🔎 Buscando URLs hardcodeadas..."

hardcoded=$(grep -r "http://localhost:8080" src/app/**/*.ts 2>/dev/null | grep -v "environment.ts" | wc -l)

if [ "$hardcoded" -eq 0 ]; then
    echo -e "${GREEN}✓${NC} No se encontraron URLs hardcodeadas"
else
    echo -e "${YELLOW}⚠${NC} Se encontraron $hardcoded URLs hardcodeadas (localhost:8080)"
    echo "   Archivos:"
    grep -r "http://localhost:8080" src/app/**/*.ts 2>/dev/null | grep -v "environment.ts" | cut -d: -f1 | sort -u
    ((warnings++))
fi

# Resumen
echo ""
echo "================================"
echo "📊 RESUMEN"
echo "================================"

if [ $errors -eq 0 ]; then
    echo -e "${GREEN}✓ Configuración correcta - Listo para deploy${NC}"
else
    echo -e "${RED}✗ $errors error(es) encontrado(s) - Revisar antes de deploy${NC}"
fi

if [ $warnings -gt 0 ]; then
    echo -e "${YELLOW}⚠ $warnings advertencia(s)${NC}"
fi

echo ""
echo "🚀 Siguiente paso:"
echo "   npm run build"
echo "   git add ."
echo "   git commit -m 'fix: configurar URLs de producción'"
echo "   git push"
echo ""

exit $errors
