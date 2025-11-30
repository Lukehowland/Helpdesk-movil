# Backend - Normalizar User Agent de Apps Móviles

## **Objetivo**
Normalizar y limpiar el campo `user_agent` en la tabla `refresh_tokens` para detectar aplicaciones móviles nativas (okhttp/React Native) y guardar un valor legible en lugar del raw user agent.

## **Problema Actual**
Cuando se autentica desde aplicaciones móviles (Expo/React Native Android), el user agent es `okhttp/4.12.0`, que no es descriptivo y no identifica claramente que es una app móvil.

## **Solución Requerida**

En el archivo de **autenticación** donde se crea/guarda el `refresh_token` (probablemente en `AuthController.php` o `AuthService.php`), agregar lógica para parsear y normalizar el user agent:

```php
// ANTES DE GUARDAR EN LA BD
$userAgent = $request->header('User-Agent') ?? '';

// Parsear user agents comunes de apps móviles
if (strpos($userAgent, 'okhttp') !== false) {
    // React Native / Expo Android
    $parsedUserAgent = 'Mobile App - Android';
} elseif (strpos($userAgent, 'CFNetwork') !== false) {
    // iOS nativo
    $parsedUserAgent = 'Mobile App - iOS';
} elseif (strpos($userAgent, 'Dart') !== false) {
    // Flutter
    $parsedUserAgent = 'Mobile App - Flutter';
} else {
    // Mantener user agent original para web browsers
    $parsedUserAgent = $userAgent;
}

// Guardar el user agent parseado en la BD
RefreshToken::create([
    'user_id' => $user->id,
    'token_hash' => hash('sha256', $token),
    'user_agent' => $parsedUserAgent, // <-- GUARDAR PARSEADO
    'ip_address' => $request->ip(),
    // ... otros campos
]);
```

## **Requisitos**
- ✅ Detectar `okhttp` (React Native/Expo)
- ✅ Detectar `CFNetwork` (iOS apps nativas)
- ✅ Detectar `Dart` (Flutter apps)
- ✅ Mantener user agents originales de browsers (Chrome, Firefox, Safari, etc.)
- ✅ Aplicar esta lógica en TODOS los endpoints que crean sesiones (login, register, refresh, etc.)

## **Validación**
Verificar que en la tabla `refresh_tokens`, el campo `user_agent` contenga:
```
✅ "Mobile App - Android" (en lugar de "okhttp/4.12.0")
✅ "Mobile App - iOS" (en lugar de "CFNetwork")
✅ "Mozilla/5.0..." (browsers mantienen su formato original)
```

## **Impacto**
- Datos más limpios en BD
- Pantalla de sesiones activas mostrará "Mobile App - Android" directamente
- No requiere parseo en el cliente
- Mejor para reportes y analytics

## **Endpoints Afectados**
Revisar que el parsing se aplique en:
- `/api/auth/login`
- `/api/auth/register`
- `/api/auth/refresh`
- Cualquier endpoint que cree o actualice `refresh_tokens`
