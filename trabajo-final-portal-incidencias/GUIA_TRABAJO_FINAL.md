# Guía para completar el trabajo final

## Escenario

Automatizar el inicio de sesión, registro de una incidencia, obtención del código y validación en Mis incidencias.

## Orden recomendado

1. Ejecute `npm run validate` y confirme que la base está correctamente instalada.
2. Revise la fila de `DatosIncidencias.xlsx`.
3. Complete `LoginPage.ingresar`.
4. Cree la navegación a Nueva incidencia dentro de una Page o Flow.
5. Complete `NuevaIncidenciaPage.completar` utilizando `fill`, `check` y `selectOption`.
6. Seleccione Categoría antes de Subcategoría.
7. Implemente la revisión y el registro.
8. Obtenga el código dinámico con formato `INC-AAAA-NNNN`.
9. Valide el mensaje de confirmación.
10. Busque el código generado en Mis incidencias y valide título y estado.
11. Ejecute `npm run bdd` hasta obtener el escenario aprobado.
12. Revise capturas, Allure y PDF.

## Localizadores recomendados

Priorice `getByRole` y `getByLabel`. El archivo `NuevaIncidenciaPage.ts` contiene una base con los controles reales del portal.

## Condición de entrega

No elimine las evidencias automáticas. La entrega debe incluir el código, el Excel, el escenario aprobado, Allure y el PDF generado.
