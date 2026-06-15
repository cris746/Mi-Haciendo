class CreateMedicamento {
  constructor(inventarioRepository) {
    this.inventarioRepository = inventarioRepository;
  }

  async execute(data) {
    const { 
      nombre, descripcion, fechaVencimiento, 
      codigo, presentacion, unidadCompra, contenidoPorUnidad, unidadBase,
      stockUnidades, stockTotalBase, precioCompraUnidad, lote,
      // old fields for fallback/sync
      stockCantidad, unidadMedida, precioCompra 
    } = data;

    if (!nombre) {
      throw new Error('Nombre es obligatorio');
    }

    // calculate stockTotalBase
    let finalStockTotalBase = stockTotalBase;
    if (finalStockTotalBase === undefined && stockUnidades !== undefined && contenidoPorUnidad !== undefined && stockUnidades !== '' && contenidoPorUnidad !== '') {
      finalStockTotalBase = parseFloat(stockUnidades) * parseFloat(contenidoPorUnidad);
    }

    // fallback mapping to old fields
    const finalStockCantidad = finalStockTotalBase !== undefined && finalStockTotalBase !== '' ? parseFloat(finalStockTotalBase) : parseFloat(stockCantidad || 0);
    const finalUnidadMedida = unidadBase || unidadMedida || 'Unidad'; // fallback
    const finalPrecioCompra = precioCompraUnidad !== undefined && precioCompraUnidad !== '' ? parseFloat(precioCompraUnidad) : (precioCompra !== undefined && precioCompra !== '' ? parseFloat(precioCompra) : null);

    if (finalStockCantidad < 0) {
      throw new Error('El stock no puede ser negativo');
    }

    if (finalPrecioCompra !== null && finalPrecioCompra < 0) {
      throw new Error('El precio de compra no puede ser negativo');
    }

    if (contenidoPorUnidad !== undefined && contenidoPorUnidad !== '' && parseFloat(contenidoPorUnidad) <= 0) {
      throw new Error('El contenido por unidad debe ser mayor a 0');
    }

    if (stockUnidades !== undefined && stockUnidades !== '' && parseFloat(stockUnidades) < 0) {
      throw new Error('El stock en unidades no puede ser negativo');
    }

    const existe = await this.inventarioRepository.findMedicamentoByNombre(nombre);
    if (existe) {
      throw new Error('Ya existe un medicamento con ese nombre');
    }

    return await this.inventarioRepository.saveMedicamento({
      nombre,
      descripcion,
      codigo,
      presentacion,
      unidadCompra,
      contenidoPorUnidad: contenidoPorUnidad !== undefined && contenidoPorUnidad !== '' ? parseFloat(contenidoPorUnidad) : null,
      unidadBase,
      stockUnidades: stockUnidades !== undefined && stockUnidades !== '' ? parseFloat(stockUnidades) : null,
      stockTotalBase: finalStockTotalBase !== undefined && finalStockTotalBase !== '' ? parseFloat(finalStockTotalBase) : null,
      precioCompraUnidad: precioCompraUnidad !== undefined && precioCompraUnidad !== '' ? parseFloat(precioCompraUnidad) : null,
      lote,
      stockCantidad: finalStockCantidad,
      unidadMedida: finalUnidadMedida,
      fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
      precioCompra: finalPrecioCompra
    });
  }
}

module.exports = CreateMedicamento;
