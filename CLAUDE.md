# maintenance-web

Frontend Angular de **Maintenance**, app de mantenimiento predictivo vehicular.

## 1. Que hace este proyecto

Predice fallas de piezas usando **ingenieria de confiabilidad** (funciones de riesgo / curvas de
supervivencia tipo hazard function) en vez de tablas fijas de intervalos ("cambia el aceite cada
5.000 km"). La probabilidad de falla no es un numero fijo: es una curva que crece con el uso y se
ajusta por clima de la ciudad, terreno, estilo de manejo y marca de los repuestos.

Este repo es solo la interfaz. Toda la logica de prediccion vive en el backend Rails
(`maintenance-api`); aca no se replican calculos de confiabilidad.

## 2. Stack

- Angular 20 (standalone components, signals)
- SCSS
- Jasmine + Karma para tests
- ESLint (`@angular-eslint`) + Prettier
- Despliegue en Render como sitio estatico (ver `render.yaml`)

## 3. Setup local

```bash
npm install
npm start                 # http://localhost:4200
npm test                  # Karma en modo watch
npm run test:ci           # una corrida headless
npm run test:coverage     # headless + reporte de cobertura
npm run lint
npm run build
```

El backend tiene que estar corriendo en `http://localhost:3000` (ver repo `maintenance-api`).

## 4. Configuracion de entornos

La URL del API vive en `src/environments/`:

- `environment.development.ts` -> `http://localhost:3000`
- `environment.ts` -> URL de produccion en Render

Nunca hardcodear URLs del API dentro de componentes o servicios: siempre importar `environment`.

## 5. Flujo de trabajo

### Ramas

`main` esta protegida y siempre desplegable. Nunca se commitea directo a `main`.
El trabajo diario va en ramas de tarea que salen de `staging`, y `staging` se mergea a `main`.

```
main                              <- protegida, siempre desplegable
 └─ staging                       <- integracion
     ├─ feature/12-formulario-vin
     ├─ fix/15-validacion-vin
     └─ chore/8-setup-eslint
```

Convencion: `tipo/numero-issue-descripcion-corta`
Tipos: `feature`, `fix`, `chore`, `refactor`, `test`, `docs`

Regla: **1 issue de GitHub = 1 rama = 1 Pull Request**.

### TDD (Red -> Green -> Refactor)

1. Escribir el `.spec.ts` primero: tiene que fallar.
2. Codigo minimo del componente/servicio para que pase: verde.
3. Refactorizar con el spec en verde.

Ninguna tarea se marca "Done" sin tests escritos primero y pasando en CI.
Cobertura minima 80%, configurada en `karma.conf.js` (`coverageReporter.check.global`).

### Commits — Conventional Commits

```
feat: agregar formulario de registro de VIN (#12)
fix: validar VIN de 17 caracteres (#15)
test: agregar specs para VehicleService (#13)
chore: configurar ESLint (#8)
```

Los commits no llevan firma ni co-autoria de herramientas.

### Definition of Done

- [ ] Tests escritos antes del codigo y en verde
- [ ] Cobertura no baja del 80%
- [ ] CI en verde (tests + ESLint + build)
- [ ] Code review / autorevision con checklist
- [ ] Sin codigo muerto ni `console.log` de debug
- [ ] Documentacion actualizada si aplica

### Scrum en GitHub

- Labels: `type:feature`, `type:bug`, `type:chore`, `priority:high/medium/low`, `size:S/M/L`
- Board: `Backlog` -> `Sprint Backlog` -> `In Progress` -> `In Review` -> `Done`
- Sprints = Milestones
- Cada issue lleva criterios de aceptacion (Given/When/Then) y checklist de Definition of Done

## 6. Modelo de dominio en el frontend

La app arranca con **autos y motos** y el esquema crece despues a otras clases de vehiculo. Lo que
eso implica en la interfaz:

- Los tipos TypeScript son espejo del API: `vehicleType` (`'car' | 'motorcycle'`), `usageValue`,
  `usageUnit` (`'km' | 'hours'`). **No** existe un campo `kilometraje` en el modelo de datos.
- La etiqueta del campo de uso se deriva de `usageUnit`, no se hardcodea: hoy siempre muestra
  "Kilometraje (km)", pero el dia que entre otra clase de vehiculo solo cambia el dato.
- Las listas de piezas vienen del API (`part_types`), nunca hardcodeadas en el frontend.
- **El VIN es opcional en el formulario.** NHTSA no tiene las motos que se venden en Colombia (AKT,
  Bajaj, TVS, Auteco, Victory), asi que el registro manual es el camino principal y el decode de VIN
  es un autocompletado que prellena campos editables. Que NHTSA no reconozca un VIN **no es un
  error**: se muestra un mensaje neutro y el formulario sigue usable.
- Lo mismo con los recalls: lista vacia se comunica explicitamente ("no hay recalls registrados para
  este vehiculo"), no como un vacio ambiguo ni como falla.

## 7. Convenciones de codigo

- Componentes standalone; nada de NgModules nuevos.
- Estado con signals (`signal`, `computed`), no con `BehaviorSubject` salvo que haga falta.
- Las llamadas HTTP van en servicios de `src/app/core/`, nunca dentro de un componente.
- Los servicios se testean con `HttpTestingController`, sin pegarle al API real.
- Nombres de archivos en kebab-case. Los componentes siguen el estilo del Angular CLI 20 sin
  sufijo (`vehicle-form.ts` -> clase `VehicleForm`); los servicios y modelos si llevan sufijo
  explicito (`vehicle.service.ts`, `vehicle.model.ts`) para que el servicio no choque de nombre
  con el tipo `Vehicle`.
- Las vistas tienen cuatro estados y se prueban los cuatro: cargando, vacio, error y con datos.
- Codigo en ingles, textos visibles en espanol. El usuario ve "Vehiculo" y "Kilometraje"; el codigo
  dice `vehicle` y `usageValue`.
