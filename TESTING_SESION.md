# Instrucciones de Prueba - Gestión de Sesión

## Configuración para Testing Rápido

Para probar rápidamente la funcionalidad de advertencia de sesión, sigue estos pasos:

### 1. Reducir Tiempos para Testing

En el archivo `src/app/auth/auth.service.ts`, cambia temporalmente estos valores:

```typescript
// CONFIGURACIÓN ORIGINAL (Producción)
private readonly inactivityThresholdMs = 15 * 60 * 1000; // 15 minutos
private readonly keepAliveIntervalMs = 4 * 60 * 1000; // 4 minutos  
private readonly warningThresholdMs = 60 * 1000; // 1 minuto

// CONFIGURACIÓN PARA TESTING (Comentar la original y descomentar esta)
private readonly inactivityThresholdMs = 2 * 60 * 1000; // 2 minutos
private readonly keepAliveIntervalMs = 30 * 1000; // 30 segundos
private readonly warningThresholdMs = 20 * 1000; // 20 segundos
```

### 2. Escenarios de Prueba

#### Escenario 1: Advertencia de Sesión
1. Hacer login
2. Esperar ~40 segundos (si usas config de testing)
3. Debe aparecer el diálogo de advertencia
4. Observar la cuenta regresiva de 20 segundos
5. Click en "Continuar trabajando"
6. Verificar que el diálogo se cierra y la sesión continúa

#### Escenario 2: Cierre Automático
1. Hacer login
2. Esperar a que aparezca el diálogo
3. NO hacer click en ningún botón
4. Esperar a que el contador llegue a 0
5. Verificar que se cierra sesión automáticamente

#### Escenario 3: Logout Manual
1. Hacer login
2. Esperar a que aparezca el diálogo
3. Click en "Cerrar sesión"
4. Verificar redirección a login

#### Escenario 4: Keep-Alive con Actividad
1. Hacer login
2. Interactuar continuamente (mover mouse, hacer clicks, scroll)
3. Abrir DevTools → Network tab
4. Observar requests periódicos a `/api/user/profile`
5. La sesión NO debe mostrar advertencia mientras haya actividad

#### Escenario 5: Inactividad
1. Hacer login
2. NO interactuar durante 2+ minutos (config testing)
3. No debe haber requests keep-alive
4. El token NO se renovará automáticamente
5. Eventualmente aparecerá la advertencia

### 3. Verificación en DevTools

#### Console
Abre DevTools Console y observa:
```
- "Sesión extendida exitosamente" (al continuar)
- Warnings de token refresh
```

#### Network Tab
Observa estos endpoints:
```
POST /api/auth/refresh  → Renovación de token
GET  /api/user/profile  → Keep-alive ping
POST /api/auth/logout   → Cierre de sesión
```

#### Application Tab → Local Storage
Verifica:
```
avaltrust.auth → Contiene datos del usuario y tokens
```

### 4. Testing del Diálogo Visual

El diálogo debe:
- ✅ Aparecer centrado en la pantalla
- ✅ Tener fondo oscuro semi-transparente
- ✅ Mostrar icono de advertencia naranja
- ✅ Mostrar cuenta regresiva actualizada cada segundo
- ✅ Tener dos botones visibles y funcionales
- ✅ Ser responsive en móvil

### 5. Restaurar Configuración de Producción

**¡IMPORTANTE!** Después de testing, restaurar los valores originales:

```typescript
private readonly inactivityThresholdMs = 15 * 60 * 1000; // 15 minutos
private readonly keepAliveIntervalMs = 4 * 60 * 1000; // 4 minutos  
private readonly warningThresholdMs = 60 * 1000; // 1 minuto
```

## Troubleshooting

### Problema: El diálogo no aparece
- ✓ Verificar que el token tenga tiempo de expiración
- ✓ Verificar en console si hay errores
- ✓ Verificar que el usuario esté autenticado

### Problema: El diálogo no se cierra al continuar
- ✓ Verificar response de `/api/auth/refresh`
- ✓ Verificar console para errores
- ✓ Verificar que el backend esté respondiendo

### Problema: Keep-alive no funciona
- ✓ Verificar que haya actividad del usuario
- ✓ Verificar en Network tab si hay requests
- ✓ Verificar threshold de inactividad

## Checklist de Funcionalidad

- [ ] Login inicia todos los timers correctamente
- [ ] Advertencia aparece antes de expiración
- [ ] Cuenta regresiva funciona correctamente
- [ ] Botón "Continuar" extiende la sesión
- [ ] Botón "Cerrar sesión" hace logout
- [ ] Timeout automático al llegar a 0
- [ ] Keep-alive mantiene sesión con actividad
- [ ] Sin actividad no renueva token
- [ ] Logout limpia todos los timers
- [ ] Diálogo es responsive
