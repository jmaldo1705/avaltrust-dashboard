# 🚀 Resumen de Cambios - Configuración CORS y Deploy

## ✅ Archivos Creados

### Frontend
```
✅ src/app/environments/environment.prod.ts
✅ verify-config.ps1
✅ verify-config.sh
✅ DESPLIEGUE_CORS.md
✅ SOLUCION_CORS.md
```

---

## ✏️ Archivos Modificados

### Frontend
```
✅ src/app/environments/environment.ts
✅ src/app/auth/auth.service.ts
✅ angular.json
✅ package.json
```

### Backend
```
✅ src/main/resources/application-railway.properties
```

---

## 🎯 Cambios Principales

### 1. Frontend - Configuración de Entornos

**environment.ts (Desarrollo)**
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080'
};
```

**environment.prod.ts (Producción) - NUEVO**
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://avaltrustback-production.up.railway.app'
};
```

### 2. Frontend - AuthService

**ANTES:**
```typescript
private readonly API_URL = 'http://localhost:8080/api/auth';
private readonly USER_API_URL = 'http://localhost:8080/api/user';
```

**DESPUÉS:**
```typescript
import { environment } from '../environments/environment';
...
private readonly API_URL = `${environment.apiUrl}/api/auth`;
private readonly USER_API_URL = `${environment.apiUrl}/api/user`;
```

### 3. Frontend - angular.json

**Agregado en production configuration:**
```json
"fileReplacements": [
  {
    "replace": "src/app/environments/environment.ts",
    "with": "src/app/environments/environment.prod.ts"
  }
]
```

### 4. Frontend - package.json

**ANTES:**
```json
"build": "ng build"
```

**DESPUÉS:**
```json
"build": "ng build --configuration production",
"build:dev": "ng build --configuration development"
```

### 5. Backend - application-railway.properties

**ANTES:**
```properties
app.cors.allowed-origins=${FRONTEND_URL:http://localhost:4200, https://avaltrust.co, https://app.avaltrust.co}
```

**DESPUÉS:**
```properties
app.cors.allowed-origins=http://localhost:4200,https://avaltrust.co,https://app.avaltrust.co,https://*.vercel.app
```

---

## 📋 Pasos para Desplegar

### Opción A: Deploy Completo (Recomendada)

```bash
# 1. Verificar que todo esté correcto
cd avaltrust-dashboard
npm run build

# 2. Si el build es exitoso, commit y push
git add .
git commit -m "fix: configurar URLs de producción y solucionar CORS"
git push origin master

# 3. Vercel y Railway harán deploy automáticamente
```

### Opción B: Deploy Solo Backend (Si ya deployaste el frontend)

```bash
cd AvalTrustBack
git add .
git commit -m "fix: actualizar CORS para permitir Vercel"
git push
```

### Opción C: Deploy Solo Frontend (Si ya deployaste el backend)

```bash
cd avaltrust-dashboard
git add .
git commit -m "fix: configurar URLs de producción para Railway"
git push
```

---

## 🔍 Verificación Post-Deploy

### 1. Verificar Railway (Backend)

```bash
# Test manual de CORS
curl -i -X OPTIONS \
  -H "Origin: https://app.avaltrust.co" \
  -H "Access-Control-Request-Method: POST" \
  https://avaltrustback-production.up.railway.app/api/auth/login
```

**Debe incluir en la respuesta:**
```
access-control-allow-origin: https://app.avaltrust.co
access-control-allow-methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
access-control-allow-credentials: true
```

### 2. Verificar Railway - Variables de Entorno

1. Ve a Railway Dashboard
2. Selecciona tu proyecto
3. Ve a **Variables**
4. Verifica que exista:
   ```
   SPRING_PROFILES_ACTIVE=railway
   ```
5. Si no existe, agrégala y redeploy

### 3. Verificar Railway - Logs

1. Ve a **Deployments**
2. Click en el último deployment
3. Busca en logs:
   ```
   The following profiles are active: railway
   ```

### 4. Verificar Vercel (Frontend)

1. Ve a Vercel Dashboard
2. Ve a **Deployments**
3. Click en el último deployment
4. Verifica en Build Logs:
   ```
   Building with configuration production
   ```

### 5. Verificar en Browser

1. Abre `https://app.avaltrust.co`
2. Abre DevTools (F12)
3. Ve a **Console**
4. Haz login
5. ✅ NO debe haber errores de CORS
6. Ve a **Network** tab
7. Filtra por `api/auth/login`
8. Verifica la URL:
   ```
   Request URL: https://avaltrustback-production.up.railway.app/api/auth/login
   ```
9. Verifica Response Headers:
   ```
   access-control-allow-origin: https://app.avaltrust.co
   ```

---

## ✅ Checklist Final

### Backend (Railway)
- [ ] `application-railway.properties` actualizado con CORS
- [ ] Variable `SPRING_PROFILES_ACTIVE=railway` configurada
- [ ] Código pusheado a Git
- [ ] Railway deployó correctamente
- [ ] Logs muestran profile "railway" activo
- [ ] Endpoint `/actuator/health` responde

### Frontend (Vercel)
- [ ] `environment.prod.ts` creado con URL de Railway
- [ ] `auth.service.ts` usa `environment.apiUrl`
- [ ] `angular.json` tiene `fileReplacements`
- [ ] `package.json` script build usa `--configuration production`
- [ ] Build local (`npm run build`) funciona sin errores
- [ ] Código pusheado a Git
- [ ] Vercel deployó correctamente
- [ ] Build logs muestran "production" configuration

### Funcionalidad
- [ ] `https://app.avaltrust.co` carga correctamente
- [ ] Login funciona
- [ ] NO hay errores CORS en console
- [ ] Requests van a Railway (no a localhost)
- [ ] Sesión se mantiene después de login
- [ ] Navegación funciona correctamente
- [ ] Todas las features funcionan como esperado

---

## 🎉 Estado Final Esperado

```
┌──────────────────────────────────────────────────────────┐
│                    DESARROLLO                            │
├──────────────────────────────────────────────────────────┤
│ Frontend:  http://localhost:4200                         │
│ Backend:   http://localhost:8080                         │
│ CORS:      localhost permitido                           │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                    PRODUCCIÓN                            │
├──────────────────────────────────────────────────────────┤
│ Frontend:  https://app.avaltrust.co                      │
│ Backend:   https://avaltrustback-production.up.railway... │
│ CORS:      app.avaltrust.co permitido ✓                 │
│            *.vercel.app permitido ✓                      │
└──────────────────────────────────────────────────────────┘
```

---

## 📚 Documentación Adicional

Para más detalles, consulta:

- **DESPLIEGUE_CORS.md** - Guía completa de despliegue
- **SOLUCION_CORS.md** - Explicación detallada de la solución
- **verify-config.ps1** - Script de verificación (PowerShell)
- **verify-config.sh** - Script de verificación (Bash)

---

## 🐛 Si Algo Sale Mal

### Problema: Vercel sigue usando localhost

**Solución:**
1. En Vercel → Settings → General
2. Verifica que Build Command sea: `npm run build`
3. Ve a Deployments
4. Click en **...** → **Redeploy**
5. Marca **Clear build cache and redeploy**

### Problema: Railway no permite el origen

**Solución:**
1. Verifica logs de Railway
2. Asegúrate de que use profile "railway"
3. Verifica `application-railway.properties`
4. Si es necesario, agrega la URL específica sin wildcard:
   ```properties
   app.cors.allowed-origins=https://app.avaltrust.co,https://avaltrust-dashboard.vercel.app
   ```

### Problema: Token expira muy rápido

**Solución:**
El sistema de gestión de sesión implementado anteriormente debería manejar esto. Verifica:
1. Session warning aparece 1 min antes de expirar
2. Keep-alive funciona (requests cada 4 min)
3. Token se refresca automáticamente

---

## 📞 Soporte

Si necesitas más ayuda:
1. Revisa los logs de Railway y Vercel
2. Usa las herramientas de DevTools
3. Prueba con Postman para aislar problemas
4. Consulta la documentación creada

---

## 🎊 ¡Listo!

Con estos cambios, tu aplicación debería funcionar correctamente en producción sin errores de CORS.

**Next Steps:**
1. Hacer los commits necesarios
2. Push a los repositorios
3. Esperar a que Railway y Vercel deplieguen
4. Probar en `https://app.avaltrust.co`
5. ¡Disfrutar de tu aplicación funcionando! 🚀
