# ASCENDX AI — App Android

React Native + Expo (SDK 57) + TypeScript + Expo Router.

## Ejecutar

```bash
cp .env.example .env     # ajusta EXPO_PUBLIC_API_URL
npm install
npx expo start           # luego "a" para abrir el emulador Android, o escanea el QR con Expo Go
```

`EXPO_PUBLIC_API_URL` según dónde corras la app:

| Dónde | URL |
|---|---|
| Emulador de Android Studio | `http://10.0.2.2:4000/api` |
| Teléfono físico (misma red Wi-Fi) | `http://<IP de tu PC>:4000/api` (ver con `ipconfig`) |
| Navegador (solo vista previa) | `http://localhost:4000/api` |

Recuerda tener el backend corriendo (`cd ../backend && npm run dev`).

## Verificar

```bash
npm run typecheck
npm run lint
```

## Estructura

```
src/
  app/                 Rutas (Expo Router): cada archivo es una pantalla
    _layout.tsx        Proveedores y rutas protegidas según la sesión
    welcome.tsx        Bienvenida (sin sesión)
    login.tsx          Inicio de sesión
    register.tsx       Registro con aceptación de tratamiento de datos
    (tabs)/            Pestañas con sesión: Inicio, Registros, Metas, Simulador, Perfil
  components/ui/       Componentes visuales reutilizables (texto, botones, campos, tarjetas…)
  features/            Lógica por función (auth, simulator…)
  lib/                 Cliente de API, almacenamiento seguro, formatos de moneda
  theme/               Colores, espaciado y tipografía (modo claro y oscuro)
```

## Decisiones

- **Sesión:** el token de acceso vive solo en memoria; el refresh token se guarda cifrado con `expo-secure-store`. Si el token de acceso vence, el cliente renueva la sesión una vez y reintenta.
- **Rutas protegidas:** `Stack.Protected` muestra la bienvenida sin sesión y las pestañas con sesión. La seguridad real está en el backend.
- **Íconos:** `expo-symbols` (Material Symbols en Android).
- **Diseño:** todos los colores salen de `src/theme/tokens.ts`; acentos turquesa sobre fondos sobrios, con modo claro y oscuro automáticos.
- Las pantallas de Registros y Metas muestran honestamente que están **en desarrollo**.
