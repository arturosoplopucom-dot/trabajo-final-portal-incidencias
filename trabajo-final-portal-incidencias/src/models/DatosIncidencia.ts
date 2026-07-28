export interface DatosIncidencia {
  correo: string;
  contrasena: string;
  celular: string;
  horarioDisponible: string;
  autorizaWhatsApp: boolean;
  categoria: string;
  subcategoria: string;
  titulo: string;
  equipoAfectado: string;
  fechaProblema: string;
  horaProblema: string;
  numeroActivo: string;
  usuariosAfectados: number;
  impacto: string;
  urgencia: string;
  descripcion: string;
  estadoEsperado: string;
}
