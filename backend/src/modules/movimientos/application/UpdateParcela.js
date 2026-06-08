class UpdateParcela {
  constructor(movimientoRepository) {
    this.movimientoRepository = movimientoRepository;
  }

  async execute(id, data) {
    const parcela = await this.movimientoRepository.findParcelaById(id);
    if (!parcela) throw new Error('Parcela no encontrada');

    const updateData = {};

    if (data.nombre !== undefined) {
      if (!data.nombre || data.nombre.trim() === '') {
        throw new Error('El nombre de la parcela es obligatorio');
      }
      const nombreTrimmed = data.nombre.trim();
      
      const existing = await this.movimientoRepository.findParcelaByName(nombreTrimmed);
      if (existing && existing.id !== parseInt(id)) {
        throw new Error(`La parcela '${nombreTrimmed}' ya existe.`);
      }
      updateData.nombre = nombreTrimmed;
    }

    if (data.tamano !== undefined) {
      if (data.tamano === null || data.tamano === '') {
        updateData.tamano = null;
      } else {
        const tamano = parseFloat(data.tamano);
        if (isNaN(tamano) || tamano < 0) {
          throw new Error('El tamaño debe ser un número positivo.');
        }
        updateData.tamano = tamano;
      }
    }

    if (data.imagen !== undefined) {
      updateData.imagen = data.imagen || null;
    }

    return await this.movimientoRepository.updateParcela(id, updateData);
  }
}

module.exports = UpdateParcela;
