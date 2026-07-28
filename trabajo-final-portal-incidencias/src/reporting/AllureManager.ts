import * as allure from 'allure-js-commons';
import { EnvironmentConfig } from '../config/EnvironmentConfig';
import { DataSourceConfiguration } from '../data/models/DataSourceConfiguration';

export class AllureManager {
  static async register(
    config: DataSourceConfiguration,
    executionId: string,
    rowData: Record<string, unknown>
  ): Promise<void> {
    const environment = EnvironmentConfig.load();

    await allure.epic('NALABTECH Portal de Incidencias');
    await allure.feature('Registro de incidencias de soporte TI');
    await allure.story('Ejecución parametrizada desde Excel');
    await allure.parameter('Ambiente', environment.name);
    await allure.parameter('URL base', environment.baseUrl);
    await allure.parameter('Navegador', environment.browser);
    await allure.parameter('Datasource', config.datasource);
    await allure.parameter('Hoja', config.sheet);
    await allure.parameter('Fila Excel', String(config.rowNumber ?? ''));
    await allure.parameter('IdEjecucion', executionId);

    for (const key of ['TipoAusencia', 'Jornada', 'EstadoInicialEsperado', 'EstadoFinalEsperado']) {
      if (rowData[key] !== undefined && rowData[key] !== '') {
        await allure.parameter(key, String(rowData[key]));
      }
    }
  }
}
