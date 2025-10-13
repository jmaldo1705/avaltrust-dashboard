# 🚀 Comandos Rápidos - Deploy y CORS

## Deploy Completo (Frontend + Backend)

### Frontend
```bash
cd avaltrust-dashboard
npm run build                # Verificar que compile
git add .
git commit -m "fix: configurar URLs de producción y solucionar CORS"
git push origin master
```

### Backend
```bash
cd ../AvalTrustBack
git add .
git commit -m "fix: actualizar CORS para permitir Vercel"
git push
```

---

## Verificar Build Local

```bash
cd avaltrust-dashboard
npm run build
```

**Salida esperada:**
```
✔ Building...
✔ Generating browser application bundles (phase: building)...
✔ Copying assets...
✔ Generating browser application bundles (phase: emitting)...
✔ Complete.
```

---

## Test Manual de CORS

### Windows (PowerShell)
```powershell
Invoke-WebRequest -Method OPTIONS `
  -Uri "https://avaltrustback-production.up.railway.app/api/auth/login" `
  -Headers @{
    "Origin" = "https://app.avaltrust.co"
    "Access-Control-Request-Method" = "POST"
    "Access-Control-Request-Headers" = "Content-Type, Authorization"
  } | Select-Object -ExpandProperty Headers
```

### Linux/Mac (curl)
```bash
curl -i -X OPTIONS \
  -H "Origin: https://app.avaltrust.co" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization" \
  https://avaltrustback-production.up.railway.app/api/auth/login
```

**Respuesta esperada:**
```
access-control-allow-origin: https://app.avaltrust.co
access-control-allow-methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
access-control-allow-credentials: true
```

---

## Limpiar y Rebuilder (Si hay problemas)

### Frontend
```bash
cd avaltrust-dashboard
rm -rf dist node_modules
npm install
npm run build
```

### Backend
```bash
cd AvalTrustBack
./gradlew clean build
```

---

## Verificar Estado de Servicios

### Health Check - Backend
```bash
curl https://avaltrustback-production.up.railway.app/actuator/health
```

**Respuesta esperada:**
```json
{"status":"UP"}
```

### Health Check - Frontend
```bash
curl https://app.avaltrust.co
```

Debe devolver el HTML de tu aplicación.

---

## Logs en Railway

### Ver logs en tiempo real
1. Ve a Railway Dashboard
2. Selecciona tu proyecto
3. Click en "View Logs"

### Buscar errores de CORS
Busca en logs:
```
CORS
Access-Control-Allow-Origin
Invalid CORS request
```

---

## Logs en Vercel

### Ver logs de build
1. Ve a Vercel Dashboard
2. Click en tu proyecto
3. Click en "Deployments"
4. Click en el deployment más reciente
5. Click en "View Build Logs"

### Buscar configuración de producción
Busca en logs:
```
Building with configuration production
```

---

## Rollback (Si algo sale mal)

### Vercel
1. Ve a Deployments
2. Encuentra el último deployment funcional
3. Click en "..." → "Promote to Production"

### Railway
1. Ve a Deployments
2. Click en el deployment anterior
3. Click en "Redeploy"

---

## Variables de Entorno

### Railway - Verificar/Agregar
```
SPRING_PROFILES_ACTIVE=railway
JWT_SECRET=<tu-secret>
SENDGRID_API_KEY=<tu-key>
PGPASSWORD=<tu-password>
```

### Vercel - Si necesitas configurar
```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://avaltrustback-production.up.railway.app
```

*(Nota: Angular no necesita variables de entorno en Vercel, usa file replacements)*

---

## Test Completo de Login

### Con curl
```bash
curl -X POST https://avaltrustback-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://app.avaltrust.co" \
  -d '{"username":"admin","password":"tu-password"}'
```

### Con PowerShell
```powershell
$body = @{
    username = "admin"
    password = "tu-password"
} | ConvertTo-Json

Invoke-RestMethod -Method POST `
  -Uri "https://avaltrustback-production.up.railway.app/api/auth/login" `
  -ContentType "application/json" `
  -Headers @{"Origin" = "https://app.avaltrust.co"} `
  -Body $body
```

---

## Browser DevTools - Verificaciones

### 1. Console
```javascript
// Verificar URL de API
console.log(window.location.origin);
// Debe ser: https://app.avaltrust.co
```

### 2. Network Tab
- Filtra por: `api/auth`
- Verifica Request URL: debe ser `https://avaltrustback-production.up.railway.app/...`
- Verifica Response Headers: debe incluir `access-control-allow-origin`

### 3. Application Tab → Local Storage
- Key: `avaltrust.auth`
- Debe contener: `accessToken`, `refreshToken`, `username`, etc.

---

## Git Status Rápido

```bash
# Ver archivos modificados
git status

# Ver diferencias
git diff

# Ver último commit
git log -1

# Ver commits pendientes de push
git log origin/master..HEAD
```

---

## NPM Scripts Disponibles

```bash
npm start              # Servidor de desarrollo (localhost:4200)
npm run build          # Build de producción
npm run build:dev      # Build de desarrollo
npm test               # Correr tests
npm run watch          # Build en modo watch
```

---

## Gradle Tasks (Backend)

```bash
./gradlew build           # Compilar y generar JAR
./gradlew clean           # Limpiar build
./gradlew bootRun         # Correr localmente
./gradlew test            # Correr tests
```

---

## Atajos Útiles

### Abrir en browser
```bash
# Windows
start https://app.avaltrust.co

# Linux
xdg-open https://app.avaltrust.co

# Mac
open https://app.avaltrust.co
```

### Limpiar cache de npm
```bash
npm cache clean --force
```

### Ver versión de Node y npm
```bash
node --version
npm --version
```

---

## URLs Importantes

```
Frontend (Prod):    https://app.avaltrust.co
Backend (Prod):     https://avaltrustback-production.up.railway.app
Backend Health:     https://avaltrustback-production.up.railway.app/actuator/health
Backend API Docs:   https://avaltrustback-production.up.railway.app/swagger-ui.html

Frontend (Dev):     http://localhost:4200
Backend (Dev):      http://localhost:8080
```

---

## Checklist Rápido

```bash
# 1. Build funciona?
npm run build                ✓

# 2. Archivos listos?
git status                   ✓

# 3. Commit y push
git add .                    ✓
git commit -m "fix: CORS"    ✓
git push                     ✓

# 4. Deploy automático
# Railway y Vercel →         ✓

# 5. Funciona?
# Abre app.avaltrust.co →    ✓
```

---

**¡Listo para deploy! 🚀**
