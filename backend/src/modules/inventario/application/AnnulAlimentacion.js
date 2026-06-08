class AnnulAlimentacion {
  constructor(inventarioRepository) {
    this.inventarioRepository = inventarioRepository;
  }

  async execute(id, motivoAnulacion) {
    if (!id) {
      throw new Error('El ID de la alimentación es obligatorio');
    }

    const alimentacionId = parseInt(id);
    if (isNaN(alimentacionId)) {
      throw new Error('El ID de la alimentación debe ser un número válido');
    }

    return await this.inventarioRepository.annulAlimentacion(alimentacionId, motivoAnulacion);
  }
}

module.exports = AnnulAlimentacion;
