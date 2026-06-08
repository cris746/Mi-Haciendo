class UpdateMedicamento {
  constructor(inventarioRepository) {
    this.inventarioRepository = inventarioRepository;
  }

  async execute(id, data) {
    const { nombre, descripcion, stockCantidad, unidadMedida, fechaVencimiento, precioCompra } = data;
    if (!id) throw new Error('El id del medicamento es obligatorio');
    
    if (stockCantidad !== undefined && parseFloat(stockCantidad) < 0) {
      throw new Error('El stock no puede ser negativo');
    }

    if (precioCompra !== undefined && precioCompra !== '' && parseFloat(precioCompra) < 0) {
      throw new Error('El precio de compra no puede ser negativo');
    }
    
    if (nombre) {
      const existe = await this.inventarioRepository.findMedicamentoByNombre(nombre);
      if (existe && existe.id !== parseInt(id)) {
        throw new Error('Ya existe un medicamento con ese nombre');
      }
    }
    
    return await this.inventarioRepository.updateMedicamento(id, {
      ...(nombre && { nombre }),
      ...(descripcion !== undefined && { descripcion }),
      ...(stockCantidad !== undefined && { stockCantidad: parseFloat(stockCantidad) }),
      ...(unidadMedida && { unidadMedida }),
      ...(fechaVencimiento !== undefined && { fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null }),
      ...(precioCompra !== undefined && { precioCompra: precioCompra !== '' ? parseFloat(precioCompra) : null })
    });
  }
}

module.exports = UpdateMedicamento;
