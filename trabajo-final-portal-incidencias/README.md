# TRABAJO FINAL — Portal de incidencias

Proyecto base académico para automatizar un único escenario: registrar correctamente una incidencia en NALABTECH Service Desk.

## Qué ya está preparado

- Playwright, Cucumber y TypeScript.
- Configuración local y Jenkins.
- Lectura de Excel y generación de escenarios por fila activa.
- Hooks, World, navegador, logs, capturas por paso y video.
- Reporte Allure.
- PDF individual y PDF consolidado.
- Excel `test-data/excel/DatosIncidencias.xlsx` con una fila de ejemplo.
- Localizadores iniciales de los controles reales del formulario.

## Estado de la solución

La automatización del escenario está completamente implementada. Incluye Login, navegación, registro, confirmación mediante modal, obtención dinámica del código y validación en Mis incidencias.

La ejecución validada terminó con los 9 pasos aprobados y generó capturas, video, Allure, PDF individual y PDF consolidado.

## Primera ejecución

Abra la terminal de Visual Studio Code en la raíz del proyecto:

```text
npm ci
npx playwright install chromium
npm run validate
npm run bdd
```

## Reportes

```text
npm run allure:generate
npm run allure:open
```

Los PDF y las evidencias se generan automáticamente al terminar Cucumber en:

```text
ejecuciones/YYYYMMDD/NN/
```

## Portal y credenciales de demostración

```text
URL: https://academia.nalabtech.com/labs/portal-incidencias/login.html
Usuario: usuario@empresa.com
Contraseña: Usuario123
```

## Arquitectura

```text
Excel → modelo → Feature → Steps → Flows → Pages → portal → Assertions → evidencias
```

Los Steps no deben contener localizadores. Las Pages interactúan con controles, los Flows coordinan procesos y las Assertions demuestran el resultado.
