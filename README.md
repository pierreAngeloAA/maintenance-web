# maintenance-web

Frontend de **Maintenance**, app de mantenimiento predictivo vehicular.

Un solo workspace con **tres aplicaciones** y una carpeta de codigo compartido.

```
projects/
├── shared/        auth, http, interceptor, contexto, modelos, formularios, UI comun
├── app-cliente/   :4200   mis vehiculos, riesgo, historial
├── app-taller/    :4201   servicios, inspecciones
└── app-almacen/   :4202   productos, inventario, ventas
```

Son **tres builds separados** —el cliente no descarga la pantalla de inventario del almacen— pero se
publican bajo **un solo dominio** en rutas distintas (`/cliente`, `/taller`, `/almacen`). Mismo
origen significa mismo `localStorage`, y por eso la sesion se comparte: cambiar de contexto es una
navegacion normal, no un login nuevo.

El codigo compartido se importa con el alias `@shared/*`.

## Setup local

```bash
npm install
npm start                 # cliente  en http://localhost:4200
npm run start:taller      # taller   en http://localhost:4201
npm run start:almacen     # almacen  en http://localhost:4202

npm test                  # Karma en watch (app-cliente)
npm run test:ci           # las tres suites, headless
npm run test:coverage     # cobertura del cliente (incluye shared)
npm run lint
npm run build             # las tres apps
npm run build:site        # las tres + el sitio unificado en dist/site
```

El backend tiene que estar corriendo en `http://localhost:3000` (repo `maintenance-api`).

Los specs de `shared/` corren una sola vez, con `app-cliente`: incluirlos en las tres los ejecutaria
por triplicado.

## Contexto del actor

El token dice **quien eres**; el header `X-Organization-Id` dice **en nombre de quien actuas**. Lo
pone el interceptor a partir del contexto activo, y el backend lo valida en cada peticion.

`GET /me` devuelve los contextos disponibles. Con uno solo se entra directo; con dos o mas aparece
el selector, que recuerda el ultimo elegido.

## Configuracion de entornos

`projects/shared/environments/`, una sola para las tres apps:

- `environment.development.ts` -> `http://localhost:3000`
- `environment.ts` -> URL de produccion en Render

Nunca hardcodear URLs del API: los prefijos viven en `@shared/core/api-routes`.
