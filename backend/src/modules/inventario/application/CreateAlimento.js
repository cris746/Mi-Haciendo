class CreateAlimento {
  constructor(inventarioRepository) {
    this.inventarioRepository = inventarioRepository;
  }

  async execute(data) {
    const { nombre, descripcion, stockCantidad, unidadMedida, fechaVencimiento, precioCompra } = data;
    if (!nombre || stockCantidad === undefined || !unidadMedida) {
      throw new Error('Nombre, stock inicial y unidad de medida son obligatorios');
    }
    if (parseFloat(stockCantidad) < 0) {
      throw new Error('El stock inicial no puede ser negativo');
    }
    if (precioCompra !== undefined && precioCompra !== '' && parseFloat(precioCompra) < 0) {
      throw new Error('El precio de compra no puede ser negativo');
    }

    const existe = await this.inventarioRepository.findAlimentoByNombre(nombre);
    if (existe) {
      throw new Error('Ya existe un alimento con ese nombre');
    }

    return await this.inventarioRepository.saveAlimento({
      nombre,
      descripcion,
      stockCantidad: parseFloat(stockCantidad),
      unidadMedida,
      fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
      precioCompra: precioCompra !== undefined && precioCompra !== '' ? parseFloat(precioCompra) : null
    });
  }
}

module.exports = CreateAlimento;
