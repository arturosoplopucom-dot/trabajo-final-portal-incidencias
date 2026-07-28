import { Given, Then, When } from '@cucumber/cucumber';
import { EnvironmentConfig } from '../config/EnvironmentConfig';
import { LoginFlow } from '../flows/LoginFlow';
import { RegistroIncidenciaFlow } from '../flows/RegistroIncidenciaFlow';
import { RegistroIncidenciaAssertions } from '../assertions/RegistroIncidenciaAssertions';
import { TrabajoFinalWorld } from '../support/TrabajoFinalWorld';
import { DetalleIncidenciaPage } from '../pages/DetalleIncidenciaPage';

Given('que se cargan los datos del trabajo final', async function (this: TrabajoFinalWorld) {
  if (!this.datosIncidencia) throw new Error('Los datos no fueron preparados por el Hook.');
  this.logger.info('DATOS', `Fila cargada: ${this.executionId}`);
});

Given('el usuario inicia sesión en el portal de incidencias', async function (this: TrabajoFinalWorld) {
  const ambiente = EnvironmentConfig.load();
  const flow = new LoginFlow(this.page);
  await flow.iniciarSesion(
    ambiente.baseUrl,
    this.datosIncidencia.correo,
    this.datosIncidencia.contrasena
  );
});

When('accede a la opción Nueva incidencia', async function (this: TrabajoFinalWorld) {
  await new RegistroIncidenciaFlow(this.page).abrirNuevaIncidencia();
});

When('completa el formulario con los datos configurados', async function (this: TrabajoFinalWorld) {
  await new RegistroIncidenciaFlow(this.page).completar(this.datosIncidencia);
});

When('revisa la información ingresada', async function (this: TrabajoFinalWorld) {
  await new RegistroIncidenciaFlow(this.page).revisar();
});

When('confirma el registro de la incidencia', async function (this: TrabajoFinalWorld) {
  await new RegistroIncidenciaFlow(this.page).registrar();
});

Then('el sistema debe confirmar la creación', async function (this: TrabajoFinalWorld) {
  await new RegistroIncidenciaAssertions(this.page).validarConfirmacion();
});

Then('debe generar un código único de incidencia', async function (this: TrabajoFinalWorld) {
  this.codigoIncidencia = await new DetalleIncidenciaPage(this.page).obtenerCodigo();
  new RegistroIncidenciaAssertions(this.page).validarFormatoCodigo(this.codigoIncidencia);
});

Then('la incidencia debe aparecer en Mis incidencias', async function (this: TrabajoFinalWorld) {
  if (!this.codigoIncidencia) throw new Error('No existe un código de incidencia para buscar.');
  await new DetalleIncidenciaPage(this.page).irAlListado();
  await new RegistroIncidenciaAssertions(this.page).validarEnListado(
    this.codigoIncidencia,
    this.datosIncidencia.titulo,
    this.datosIncidencia.estadoEsperado
  );
});
