class RegistrarAlimentacion {
  constructor(inventarioRepository) {
    this.inventarioRepository = inventarioRepository;
  }

  async execute(data) {
    const { animalId, alimentoId, cantidad, observacion } = data;
    if (!animalId || !alimentoId || !cantidad) {
      throw new Error('Animal, alimento y cantidad son obligatorios');
    }

    if (cantidad <= 0) {
      throw new Error('La cantidad debe ser mayor a cero');
    }

    return await this.inventarioRepository.registrarAlimentacion({
      animalId,
      alimentoId,
      cantidad,
      observacion
    });
  }
}

module.exports = RegistrarAlimentacion;
