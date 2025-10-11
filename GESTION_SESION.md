# Gestión de Sesión - Avaltrust Dashboard

## Cambios Implementados

### 1. Componente de Advertencia de Sesión
**Archivo:** `src/app/auth/session-warning.component.ts`

- Componente standalone que muestra un diálogo modal cuando la sesión está por expirar
- Cuenta regresiva de 60 segundos
- Dos opciones para el usuario:
  - **Continuar trabajando**: Extiende la sesión refrescando el token
  - **Cerrar sesión**: Cierra la sesión inmediatamente

### 2. Mejoras en AuthService
**Archivo:** `src/app/auth/auth.service.ts`

#### Nuevas funcionalidades:
- **Timer de advertencia de sesión**: Muestra alerta 1 minuto antes de la expiración
- **Método `extendSession()`**: Permite extender la sesión manualmente
- **Observable `sessionWarning$`**: Emite eventos cuando la sesión está por expirar
- **Mejora en el keep-alive**: Ahora registra actividad automáticamente

#### Características de gestión de sesión:
1. **Detección de actividad del usuario**: 
   - Monitorea eventos: mousemove, mousedown, click, scroll, keydown, touchstart, touchmove
   - Actualiza automáticamente la última actividad

2. **Renovación automática del token**:
   - Se renueva 2 minutos antes de expirar (si hay actividad)
   - Keep-alive cada 4 minutos (si usuario está activo)
   - Threshold de inactividad: 15 minutos

3. **Advertencia de expiración**:
   - Se muestra 1 minuto antes de que expire la sesión
   - Cuenta regresiva de 60 segundos
   - Si llega a 0, cierra sesión automáticamente

### 3. Integración en App Component
**Archivo:** `src/app/app.ts`

- Integra el componente de advertencia de sesión
- Maneja los eventos de continuar/cerrar sesión
- Se suscribe al observable `sessionWarning$` del AuthService

## Flujo de Funcionamiento

### Login
1. Usuario inicia sesión
2. Se inician los timers:
   - Token refresh timer (renueva 2 min antes de expirar)
   - Keep-alive timer (ping cada 4 minutos si hay actividad)
   - Session warning timer (alerta 1 min antes de expirar)
3. Se registran listeners de actividad del usuario

### Durante la Sesión Activa
1. **Usuario interactúa** → Se registra actividad
2. **Keep-alive detecta actividad** → Mantiene sesión viva
3. **Token cercano a expirar** → Se renueva automáticamente
4. **Sesión a punto de expirar** → Muestra advertencia

### Advertencia de Sesión (1 minuto antes)
1. Se muestra diálogo modal
2. Cuenta regresiva de 60 segundos
3. Opciones:
   - **Continuar**: Refresca token, reinicia timers
   - **Cerrar sesión**: Logout inmediato
   - **Tiempo agotado**: Logout automático

### Logout
1. Se limpian todos los timers
2. Se eliminan listeners de actividad
3. Se limpia estado local y localStorage
4. Redirección a login

## Configuración

### Tiempos configurables en AuthService:
```typescript
private readonly inactivityThresholdMs = 15 * 60 * 1000; // 15 minutos
private readonly keepAliveIntervalMs = 4 * 60 * 1000; // 4 minutos
private readonly warningThresholdMs = 60 * 1000; // 1 minuto
```

### Para modificar los tiempos:
- **inactivityThresholdMs**: Tiempo de inactividad antes de dejar de renovar token
- **keepAliveIntervalMs**: Frecuencia del ping keep-alive
- **warningThresholdMs**: Tiempo antes de expiración para mostrar advertencia

## Beneficios

✅ **Sesión permanece activa mientras el usuario trabaja**
✅ **Renovación automática de tokens**
✅ **Advertencia antes de cerrar sesión**
✅ **Opción de extender sesión manualmente**
✅ **Gestión inteligente basada en actividad del usuario**
✅ **UX mejorada con diálogo visual atractivo**
✅ **Previene pérdida de trabajo por timeout inesperado**

## Testing

Para probar la funcionalidad:

1. **Probar advertencia de sesión**:
   - Modificar `warningThresholdMs` a un valor menor (ej: 10000 = 10 segundos)
   - Login y esperar a que aparezca el diálogo

2. **Probar extensión de sesión**:
   - Cuando aparezca el diálogo, hacer click en "Continuar trabajando"
   - Verificar que la sesión se extiende

3. **Probar cierre automático**:
   - No interactuar cuando aparezca el diálogo
   - Verificar que la sesión se cierra al llegar a 0

4. **Probar keep-alive**:
   - Interactuar con la aplicación normalmente
   - Verificar en Network tab que se hacen requests periódicos
   - La sesión debe mantenerse activa indefinidamente
