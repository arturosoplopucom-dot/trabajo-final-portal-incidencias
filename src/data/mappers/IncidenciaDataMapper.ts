import { DatosIncidencia } from '../../models/DatosIncidencia';
import { TestDataContext } from '../contexts/TestDataContext';

export class IncidenciaDataMapper {
  static from(context: TestDataContext): DatosIncidencia {
    return {
      correo: context.requireString('Correo'),
      contrasena: context.requireString('Contrasena'),
      celular: context.requireString('Celular'),
      horarioDisponible: context.requireString('HorarioDisponible'),
      autorizaWhatsApp: context.getBoolean('AutorizaWhatsApp'),
      categoria: context.requireString('Categoria'),
      subcategoria: context.requireString('Subcategoria'),
      titulo: context.requireString('Titulo'),
      equipoAfectado: context.requireString('EquipoAfectado'),
      fechaProblema: context.requireString('FechaProblema').slice(0, 10),
      horaProblema: context.requireString('HoraProblema'),
      numeroActivo: context.requireString('NumeroActivo'),
      usuariosAfectados: context.getNumber('UsuariosAfectados'),
      impacto: context.requireString('Impacto'),
      urgencia: context.requireString('Urgencia'),
      descripcion: context.requireString('Descripcion'),
      estadoEsperado: context.requireString('EstadoEsperado')
    };
  }
}
