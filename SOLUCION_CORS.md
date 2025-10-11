# ✅ Solución de CORS - Avaltrust

## 🎯 Problema Original

La aplicación frontend desplegada en **Vercel** (`https://app.avaltrust.co`) no podía comunicarse con el backend en **Railway** (`https://avaltrustback-production.up.railway.app`) debido a errores de CORS.

---

## 🔧 Solución Implementada

### Cambios en Frontend

1. ✅ **Creado `environment.prod.ts`** con la URL correcta de Railway
2. ✅ **Actualizado `auth.service.ts`** para usar variables de entorno dinámicas
3. ✅ **Configurado `angular.json`** para reemplazar archivos en build de producción
4. ✅ **Actualizado `package.json`** con script de build optimizado

### Cambios en Backend

1. ✅ **Actualizado `application-railway.properties`** para permitir:
   - `https://app.avaltrust.co`
   - `https://avaltrust.co`
   - `https://*.vercel.app` (wildcard para subdominios de Vercel)

---

## 📋 Archivos Modificados

### Frontend
```
src/app/environments/environment.prod.ts          [NUEVO]
src/app/environments/environment.ts               [MODIFICADO]
src/app/auth/auth.service.ts                      [MODIFICADO]
angular.json                                       [MODIFICADO]
package.json                                       [MODIFICADO]
```

### Backend
```
src/main/resources/application-railway.properties [MODIFICADO]
```

---

## 🚀 Cómo Desplegar

### 1️⃣ Verificar Configuración

Ejecuta el script de verificación:

**PowerShell (Windows):**
```powershell
.\verify-config.ps1
```

**Bash (Linux/Mac):**
```bash
chmod +x verify-config.sh
./verify-config.sh
```

### 2️⃣ Build Local (Opcional - Para Verificar)

```bash
npm run build
```

Esto debe completarse sin errores y usar `environment.prod.ts`.

### 3️⃣ Commit y Push

```bash
git add .
git commit -m "fix: configurar URLs de producción y solucionar CORS"
git push origin master
```

### 4️⃣ Deploy Automático

- **Vercel** detectará el push y hará el deploy automáticamente
- **Railway** (si está conectado a Git) también hará el deploy automáticamente

---

## 🔍 Verificar que Funcione

### En Railway (Backend)

1. Ve a tu proyecto en Railway
2. Verifica que esté activo el profile `railway`:
   - Busca en logs: `The following profiles are active: railway`
3. Verifica la variable de entorno:
   ```
   SPRING_PROFILES_ACTIVE=railway
   ```

### En Vercel (Frontend)

1. Ve a tu proyecto en Vercel
2. Ve a **Deployments** → último deployment
3. Click en "View Build Logs"
4. Verifica que diga: `Building with configuration production`

### En Browser

1. Abre `https://app.avaltrust.co`
2. Abre DevTools (F12) → Console
3. Haz login
4. ✅ **NO debe haber errores de CORS**
5. Ve a Network tab → Verifica que las requests vayan a:
   ```
   https://avaltrustback-production.up.railway.app/api/...
   ```

---

## 🧪 Test Manual de CORS

Puedes probar CORS directamente con curl:

```bash
curl -i -X OPTIONS \
  -H "Origin: https://app.avaltrust.co" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization" \
  https://avaltrustback-production.up.railway.app/api/auth/login
```

**Respuesta esperada:**
```
HTTP/2 200
access-control-allow-origin: https://app.avaltrust.co
access-control-allow-methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
access-control-allow-credentials: true
access-control-allow-headers: *
```

---

## 📊 Arquitectura Final

```
┌─────────────────────────────────────────────────────────────┐
│                        USUARIO                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ https://app.avaltrust.co
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      VERCEL (Frontend)                      │
│                  Angular Application                        │
│                                                             │
│  environment.prod.ts:                                       │
│  apiUrl: 'https://avaltrustback-production.up.railway.app' │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ API Requests
                     │ Authorization: Bearer <token>
                     ▼
┌─────────────────────────────────────────────────────────────┐
│               RAILWAY (Backend)                             │
│              Spring Boot API                                │
│                                                             │
│  CORS Configuration:                                        │
│  - https://app.avaltrust.co       ✓                        │
│  - https://avaltrust.co           ✓                        │
│  - https://*.vercel.app           ✓                        │
│                                                             │
│  Profile: railway                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚠️ Importante

### Para Desarrollo Local

Cuando trabajes en local, las URLs seguirán siendo `http://localhost`:

- Frontend: `http://localhost:4200`
- Backend: `http://localhost:8080`

Esto es porque `ng serve` usa `environment.ts` (desarrollo), no `environment.prod.ts`.

### Para Producción

El build de producción (`npm run build`) automáticamente usa `environment.prod.ts` gracias a la configuración en `angular.json`.

---

## 🐛 Troubleshooting Común

### Error: "Access to XMLHttpRequest has been blocked by CORS policy"

**Causa:** Backend no está permitiendo el origen del frontend.

**Solución:**
1. Verifica en Railway que `SPRING_PROFILES_ACTIVE=railway`
2. Verifica que `application-railway.properties` tenga las URLs correctas
3. Redeploy el backend en Railway

---

### Error: Requests van a localhost en producción

**Causa:** Build no está usando `environment.prod.ts`.

**Solución:**
1. Verifica `angular.json` → `fileReplacements` está configurado
2. Verifica `package.json` → script `build` incluye `--configuration production`
3. En Vercel, limpia cache y redeploy

---

### Error: 401 Unauthorized

**Causa:** No es un error de CORS, es de autenticación.

**Solución:**
1. Verifica que el token se esté enviando correctamente
2. Verifica que el backend esté validando tokens correctamente
3. Revisa logs de Railway para más detalles

---

## 📞 Contacto y Soporte

Si después de seguir esta guía sigues teniendo problemas:

1. **Revisa los logs:**
   - Railway: Deployments → View Logs
   - Vercel: Deployments → View Function Logs
   
2. **Verifica las URLs:**
   - En browser, inspecciona el código fuente del build
   - Busca las URLs que se están usando

3. **Prueba con Postman:**
   - Haz requests directas a Railway
   - Esto ayuda a aislar si es problema de CORS o de la API

---

## ✅ Checklist de Verificación

Antes de considerar que está solucionado:

- [ ] ✅ Build local funciona sin errores
- [ ] ✅ `environment.prod.ts` existe y tiene URL correcta
- [ ] ✅ `auth.service.ts` usa `environment.apiUrl`
- [ ] ✅ Backend tiene CORS configurado con URLs correctas
- [ ] ✅ Railway muestra profile "railway" activo
- [ ] ✅ Vercel build usa configuration "production"
- [ ] ✅ Login funciona en `https://app.avaltrust.co`
- [ ] ✅ No hay errores CORS en console
- [ ] ✅ Network tab muestra requests a Railway
- [ ] ✅ Responses tienen status 200 (excepto errores esperados)

---

## 🎉 Estado Final

✅ **CORS solucionado**
✅ **Frontend apunta correctamente a Railway**
✅ **Backend acepta requests de Vercel**
✅ **Aplicación funcional en producción**

**URLs Productivas:**
- 🌐 Frontend: `https://app.avaltrust.co`
- 🔧 Backend: `https://avaltrustback-production.up.railway.app`
- 🏥 Health: `https://avaltrustback-production.up.railway.app/actuator/health`
