# Configuración Jenkins

## Requisitos del agente

- Node.js 18 o superior.
- Java disponible para Allure Commandline.
- Acceso HTTPS a `academia.nalabtech.com`.
- Plugin **Allure Jenkins** instalado.
- Espacio para videos, screenshots y traces.

## Configuración interna

Jenkins utiliza directamente:

```text
config/environments/jenkins.json
```

Ejemplo:

```json
{
  "baseUrl": "https://academia.nalabtech.com/labs/nalabtech-leaveflow",
  "browser": "chromium",
  "headless": true
}
```

No deben configurarse variables `TEST_ENV`, `BASE_URL`, `BROWSER`, `HEADLESS` ni `CUCUMBER_TAGS` en el agente.

## Pipeline

Configure un Pipeline apuntando a:

```text
jenkins/Jenkinsfile
```

El único parámetro es:

- `TAGS`: expresión Cucumber, por ejemplo `@e2e`, `@regresion` o `@cancelacion`.

La configuración técnica siempre se obtiene de `jenkins.json`.

El pipeline utiliza `npm ci`, por lo que `package-lock.json` debe mantenerse en el repositorio.

## Resultados

- Evidencias físicas: `ejecuciones/`.
- Resultados Allure: `allure/results/`.
- Reporte JSON Cucumber: `reports/cucumber/cucumber.json`.

Las evidencias se archivan aunque falle una prueba. Allure se publica desde `allure/results/`.
