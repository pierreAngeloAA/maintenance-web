# maintenance-web

Frontend en Angular de **Maintenance**: app de mantenimiento predictivo vehicular.

En vez de usar tablas genericas de intervalos de servicio ("cambia el aceite cada 5.000 km"), la app
modela la probabilidad de falla de cada pieza como una **curva de riesgo** que crece con el uso y se
ajusta por el contexto real del vehiculo: clima de la ciudad, terreno, estilo de manejo y marca de
los repuestos instalados.

El backend Rails esta en el repo [`maintenance-api`](../maintenance-api).

## Stack

- Angular 20 (standalone components + signals)
- SCSS
- Jasmine + Karma
- ESLint + Prettier
- Despliegue en Render (sitio estatico)

## Setup

Requisitos: Node 22, npm 10.

```bash
git clone git@github.com:pierreAngeloAA/maintenance-web.git
cd maintenance-web
npm install
npm start
```

La app queda en `http://localhost:4200` y espera el API en `http://localhost:3000`.

## Tests

```bash
npm test              # watch
npm run test:ci       # headless, una corrida
npm run test:coverage # headless + cobertura (minimo 80%)
npm run lint
```

## Como se trabaja

TDD estricto (spec primero), una rama por issue, Conventional Commits y `main` protegida.
El detalle esta en [`CLAUDE.md`](CLAUDE.md).

## Licencia

MIT
