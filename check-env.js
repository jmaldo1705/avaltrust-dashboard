// Script para verificar qué environment se está usando
const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración de environments...\n');

// Leer environment.ts
const envDevPath = path.join(__dirname, 'src', 'app', 'environments', 'environment.ts');
const envProdPath = path.join(__dirname, 'src', 'app', 'environments', 'environment.prod.ts');

try {
  const envDev = fs.readFileSync(envDevPath, 'utf8');
  const envProd = fs.readFileSync(envProdPath, 'utf8');
  
  console.log('✅ environment.ts (Desarrollo):');
  console.log(envDev);
  console.log('\n✅ environment.prod.ts (Producción):');
  console.log(envProd);
  
  // Extraer URLs
  const devUrlMatch = envDev.match(/apiUrl:\s*'([^']+)'/);
  const prodUrlMatch = envProd.match(/apiUrl:\s*'([^']+)'/);
  
  console.log('\n📊 Resumen:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Desarrollo: ${devUrlMatch ? devUrlMatch[1] : 'NO ENCONTRADO'}`);
  console.log(`Producción: ${prodUrlMatch ? prodUrlMatch[1] : 'NO ENCONTRADO'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Verificar build
  const distPath = path.join(__dirname, 'dist');
  if (fs.existsSync(distPath)) {
    console.log('✅ Carpeta dist/ existe');
    // Buscar archivos main*.js en dist para ver qué URL está usando
    const findMainJs = (dir) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          const found = findMainJs(fullPath);
          if (found) return found;
        } else if (file.startsWith('main') && file.endsWith('.js')) {
          return fullPath;
        }
      }
      return null;
    };
    
    const mainJsPath = findMainJs(distPath);
    if (mainJsPath) {
      const mainJs = fs.readFileSync(mainJsPath, 'utf8');
      if (mainJs.includes('localhost:8080')) {
        console.log('⚠️  WARNING: El build contiene localhost:8080');
        console.log('   Necesitas hacer: npm run build (no build:dev)');
      } else if (mainJs.includes('avaltrustback-production.up.railway.app')) {
        console.log('✅ El build está usando la URL de producción correcta');
      }
    }
  } else {
    console.log('⚠️  Carpeta dist/ no existe. Ejecuta: npm run build');
  }
  
  console.log('\n💡 Comandos:');
  console.log('  Desarrollo local: npm start');
  console.log('  Build producción: npm run build');
  console.log('  Build desarrollo: npm run build:dev');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}
