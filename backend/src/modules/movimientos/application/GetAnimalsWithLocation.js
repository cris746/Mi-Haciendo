class GetAnimalsWithLocation {
  constructor(movimientoRepository) {
    this.movimientoRepository = movimientoRepository;
  }

  async execute() {
    const animales = await this.movimientoRepository.getAnimalsWithLocation();

    return animales.map(animal => {
      const movimientoActivo = animal.movimientos && animal.movimientos.length > 0 ? animal.movimientos[0] : null;
      
      return {
        id: animal.id,
        nombre: animal.nombre,
        nroArete: animal.nroArete,
        sexo: animal.sexo,
        estado: animal.estado,
        vendido: animal.vendido,
        origen: animal.origen,
        fechaIngreso: animal.fechaIngreso,
        edadIngresoMeses: animal.edadIngresoMeses,
        raza: animal.raza ? animal.raza.nombre : null,
        categoria: animal.categoria ? animal.categoria.nombre : null,
        ubicacionActual: movimientoActivo ? {
          movimientoId: movimientoActivo.id,
          parcelaId: movimientoActivo.parcelaId,
          parcelaNombre: movimientoActivo.parcela.nombre,
          fechaIngreso: movimientoActivo.fechaIngreso,
          observacion: movimientoActivo.observacion
        } : null
      };
    });
  }
}

module.exports = GetAnimalsWithLocation;
