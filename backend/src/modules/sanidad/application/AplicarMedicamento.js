class AplicarMedicamento {
  constructor(sanidadRepository) {
    this.sanidadRepository = sanidadRepository;
  }

  async execute(data) {
    const { tratamientoId, medicamentoId, dosis, cantidad, fechaSiguiente, fechaAdministracion } = data;

    if (!tratamientoId || !medicamentoId || !dosis) {
      throw new Error('tratamientoId, medicamentoId y dosis son obligatorios');
    }

    // Validar cantidad numérica
    const cantidadNum = parseFloat(cantidad);
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      throw new Error('La cantidad debe ser un número mayor a 0');
    }
    
    let parsedFechaAdmin = new Date();
    if (fechaAdministracion) {
      parsedFechaAdmin = new Date(fechaAdministracion);
      if (isNaN(parsedFechaAdmin.getTime())) {
        throw new Error('La fecha de aplicación no es válida');
      }
    }
    
    let parsedFechaSiguiente = null;
    if (fechaSiguiente) {
      parsedFechaSiguiente = new Date(fechaSiguiente);
      if (isNaN(parsedFechaSiguiente.getTime())) {
        throw new Error('La fecha siguiente no es válida');
      }
      
      const fAdminNormalized = new Date(parsedFechaAdmin);
      fAdminNormalized.setHours(0,0,0,0);
      const fSiguienteNormalized = new Date(parsedFechaSiguiente);
      fSiguienteNormalized.setHours(0,0,0,0);

      if (fSiguienteNormalized < fAdminNormalized) {
        throw new Error('La próxima dosis no puede ser anterior a la fecha de aplicación.');
      }
    }

    return await this.sanidadRepository.aplicarMedicamento({
      tratamientoId,
      medicamentoId,
      dosis: String(dosis).trim(),
      cantidad: cantidadNum,
      fechaAdministracion: parsedFechaAdmin,
      fechaSiguiente: parsedFechaSiguiente
    });
  }
}

module.exports = AplicarMedicamento;
