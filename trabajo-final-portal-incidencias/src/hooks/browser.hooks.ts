import { AfterAll } from '@cucumber/cucumber';
import { BrowserFactory } from '../support/BrowserFactory';

// El navegador se crea de forma diferida en el hook Before de cada escenario.
// Así no se abre y cierra Chromium cuando Cucumber no encuentra escenarios.
AfterAll(async function () {
  await BrowserFactory.close();
});
