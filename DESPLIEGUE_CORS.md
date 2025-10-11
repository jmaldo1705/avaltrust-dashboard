# Guía de Configuración CORS y Despliegue

## 🎯 Problema Resuelto

Se han solucionado los problemas de CORS entre el frontend desplegado en Vercel y el backend en Railway.

---

## ✅ Cambios Realizados

### Frontend (Angular)

#### 1. Archivos de Entorno Actualizados

**`src/app/environments/environment.ts`** (Desarrollo - Local)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080'
};
```

**`src/app/environments/environment.prod.ts`** (Producción - NUEVO)
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://avaltrustback-production.up.railway.app'
};
```

#### 2. AuthService Actualizado

- ✅ Ahora usa `environment.apiUrl` en lugar de URLs hardcodeadas
- ✅ Import agregado: `import { environment } from '../environments/environment';`
- ✅ URLs dinámicas:
  - `private readonly API_URL = ${environment.apiUrl}/api/auth;`
  - `private readonly USER_API_URL = ${environment.apiUrl}/api/user;`

#### 3. angular.json Configurado

- ✅ Agregado `fileReplacements` en configuración de producción
- ✅ En build de producción, `environment.ts` se reemplaza automáticamente por `environment.prod.ts`

#### 4. Otros Servicios (Ya estaban bien configurados)

- ✅ `ClaimsService` - usa `environment.apiUrl`
- ✅ `PortfolioService` - usa `environment.apiUrl`
- ✅ `DashboardService` - usa `environment.apiUrl`
- ✅ `ReportsService` - usa `environment.apiUrl`
- ✅ `UsersService` - usa `environment.apiUrl`

---

### Backend (Spring Boot)

#### application-railway.properties Actualizado

**ANTES:**
```properties
app.cors.allowed-origins=${FRONTEND_URL:http://localhost:4200, https://avaltrust.co, https://app.avaltrust.co}
```

**DESPUÉS:**
```properties
app.cors.allowed-origins=http://localhost:4200,https://avaltrust.co,https://app.avaltrust.co,https://*.vercel.app
```

**Cambios:**
- ✅ Agregado wildcard `https://*.vercel.app` para todos los subdominios de Vercel
- ✅ Removidos espacios que podían causar problemas
- ✅ Eliminada variable de entorno condicional para producción

---

## 🚀 Pasos para Desplegar

### 1. Backend en Railway

#### Opción A: Variables de Entorno (Recomendada)

1. Ve a tu proyecto en Railway
2. Selecciona el servicio del backend
3. Ve a la pestaña **Variables**
4. Agrega/actualiza la variable:
   ```
   SPRING_PROFILES_ACTIVE=railway
   ```
5. **Redeploy** el servicio

#### Opción B: Push directo

```bash
cd AvalTrustBack
git add .
git commit -m "fix: actualizar CORS para Vercel"
git push
```

Railway detectará los cambios y hará el redeploy automáticamente.

---

### 2. Frontend en Vercel

#### Paso 1: Build de Producción (Local - Verificar)

```bash
cd avaltrust-dashboard
npm run build
```

Esto creará la carpeta `dist/` con el build optimizado usando `environment.prod.ts`.

#### Paso 2: Verificar Configuración en Vercel

1. Ve a tu proyecto en Vercel
2. Selecciona **Settings** → **General**
3. Verifica:
   - **Framework Preset**: Angular
   - **Build Command**: `npm run build` o `ng build`
   - **Output Directory**: `dist/avaltrust-dashboard/browser` o similar
   - **Install Command**: `npm install`

#### Paso 3: Deploy

**Opción A: Push a GitHub**
```bash
git add .
git commit -m "fix: configurar URLs de producción y CORS"
git push origin master
```

Vercel detectará el push y hará el deploy automáticamente.

**Opción B: Deploy Manual desde CLI**
```bash
npm install -g vercel
vercel --prod
```

---

## 🔍 Verificación

### 1. Verificar Build Local

```bash
cd avaltrust-dashboard
ng build --configuration production
```

Revisa la consola para asegurarte de que:
- ✅ No hay errores
- ✅ El build se completa exitosamente
- ✅ Se usa la configuración de producción

### 2. Verificar URLs en el Browser

Después del deploy, abre `https://app.avaltrust.co` y:

1. Abre **DevTools** → **Console**
2. Haz login
3. Verifica que NO haya errores de CORS
4. Verifica en **Network** tab que las requests van a:
   ```
   https://avaltrustback-production.up.railway.app/api/...
   ```

### 3. Verificar CORS en Backend

Puedes probar el endpoint de health:

```bash
curl -H "Origin: https://app.avaltrust.co" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://avaltrustback-production.up.railway.app/api/auth/login
```

Deberías ver headers de respuesta:
```
Access-Control-Allow-Origin: https://app.avaltrust.co
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
Access-Control-Allow-Credentials: true
```

---

## 🐛 Troubleshooting

### Problema: Aún hay errores CORS

**Solución 1: Verificar Profile Activo**

En Railway, asegúrate de que la variable de entorno esté correcta:
```
SPRING_PROFILES_ACTIVE=railway
```

**Solución 2: Ver Logs del Backend**

En Railway:
1. Ve a tu servicio
2. Click en **Deployments**
3. Click en el deployment actual
4. Revisa los logs y busca:
   ```
   The following profiles are active: railway
   ```

**Solución 3: Limpiar Caché de Vercel**

En Vercel:
1. Ve a **Deployments**
2. Click en el botón **...** del último deployment
3. Click **Redeploy**
4. Marca la opción **Clear build cache and redeploy**

---

### Problema: Frontend usa localhost en producción

**Solución: Verificar Build**

1. Comprueba que en Vercel se use el comando correcto:
   ```
   npm run build
   ```
   
2. Si usas `ng build`, debe incluir:
   ```
   ng build --configuration production
   ```

3. Verifica `package.json`:
   ```json
   {
     "scripts": {
       "build": "ng build --configuration production"
     }
   }
   ```

---

### Problema: Requests a URLs incorrectas

**Verificar en Browser:**

1. Abre `https://app.avaltrust.co`
2. Abre DevTools → Sources
3. Busca el archivo `auth.service.js` (o similar)
4. Busca la línea que define `API_URL`
5. Debe decir: `https://avaltrustback-production.up.railway.app`

Si dice `http://localhost:8080`, el build no usó el archivo correcto.

---

## 📝 Configuración de Vercel (vercel.json)

Si necesitas configuración adicional, crea `vercel.json` en la raíz:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist/avaltrust-dashboard/browser",
  "framework": "angular",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

---

## ✅ Checklist Final

### Backend (Railway)
- [ ] Variable `SPRING_PROFILES_ACTIVE=railway` configurada
- [ ] `application-railway.properties` actualizado con CORS
- [ ] Backend redeployado
- [ ] Logs muestran profile "railway" activo
- [ ] Endpoint de health responde: `https://avaltrustback-production.up.railway.app/actuator/health`

### Frontend (Vercel)
- [ ] `environment.prod.ts` creado con URL correcta
- [ ] `angular.json` tiene `fileReplacements` configurado
- [ ] `auth.service.ts` usa `environment.apiUrl`
- [ ] Build local funciona sin errores
- [ ] Código pusheado a GitHub
- [ ] Vercel detectó el push y deployó
- [ ] App funciona en `https://app.avaltrust.co`
- [ ] No hay errores CORS en console
- [ ] Login funciona correctamente

---

## 🔐 Seguridad Adicional

Para mayor seguridad en Railway, considera configurar estas variables:

```properties
# Variables de entorno en Railway
FRONTEND_URL=https://app.avaltrust.co
ALLOWED_ORIGINS=https://app.avaltrust.co,https://avaltrust.co
```

Y actualizar `application-railway.properties`:

```properties
app.cors.allowed-origins=${ALLOWED_ORIGINS}
```

Esto te permite cambiar los orígenes permitidos sin hacer redeploy del código.

---

## 📞 Soporte

Si después de seguir todos los pasos sigues teniendo problemas:

1. **Revisa los logs de Railway** para errores del backend
2. **Revisa la consola del browser** para errores del frontend
3. **Verifica que ambos servicios estén activos**
4. **Prueba con herramientas como Postman** para aislar si es un problema de CORS o de la API

---

## 🎉 Resultado Final

Una vez completados todos los pasos:

✅ Frontend en Vercel apunta correctamente a Railway
✅ Backend en Railway acepta requests desde Vercel
✅ No hay errores de CORS
✅ La aplicación funciona completamente en producción
✅ Los entornos de desarrollo y producción están separados

**URLs Finales:**
- 🌐 Frontend: `https://app.avaltrust.co`
- 🔧 Backend: `https://avaltrustback-production.up.railway.app`
