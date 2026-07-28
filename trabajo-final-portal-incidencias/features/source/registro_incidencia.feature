# language: es
Característica: Registro de incidencias de soporte TI

  Como usuario del portal de soporte
  quiero registrar una incidencia
  para comunicar un problema al equipo responsable.

  @datasource:test-data/excel/DatosIncidencias.xlsx
  @hoja:REGISTRO
  @e2e
  @registro
  Escenario: Registrar correctamente una nueva incidencia
    Dado que se cargan los datos del trabajo final
    Y el usuario inicia sesión en el portal de incidencias
    Cuando accede a la opción Nueva incidencia
    Y completa el formulario con los datos configurados
    Y revisa la información ingresada
    Y confirma el registro de la incidencia
    Entonces el sistema debe confirmar la creación
    Y debe generar un código único de incidencia
    Y la incidencia debe aparecer en Mis incidencias
