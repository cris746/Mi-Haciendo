class UpdateMedicamento {
  constructor(inventarioRepository) {
    this.inventarioRepository = inventarioRepository;
  }

  async execute(id, data) {
    const { 
      nombre, descripcion, fechaVencimiento,
      codigo, presentacion, unidadCompra, contenidoPorUnidad, unidadBase,
      stockUnidades, stockTotalBase, precioCompraUnidad, lote,
      // old fields for fallback/sync
      stockCantidad, unidadMedida, precioCompra 
    } = data;

    if (!id) throw new Error('El id del medicamento es obligatorio');
    
    let updateData = {};

    if (nombre) updateData.nombre = nombre;
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (codigo !== undefined) updateData.codigo = codigo;
    if (presentacion !== undefined) updateData.presentacion = presentacion;
    if (unidadCompra !== undefined) updateData.unidadCompra = unidadCompra;
    if (unidadBase !== undefined) updateData.unidadBase = unidadBase;
    if (lote !== undefined) updateData.lote = lote;
    if (fechaVencimiento !== undefined) updateData.fechaVencimiento = fechaVencimiento ? new Date(fechaVencimiento) : null;
    
    // Si envían datos de presentación, calcular stockTotalBase
    let finalStockTotalBase = stockTotalBase;
    if (finalStockTotalBase === undefined && stockUnidades !== undefined && contenidoPorUnidad !== undefined && stockUnidades !== '' && contenidoPorUnidad !== '') {
      finalStockTotalBase = parseFloat(stockUnidades) * parseFloat(contenidoPorUnidad);
    }
    
    if (finalStockTotalBase !== undefined && finalStockTotalBase !== '') {
      updateData.stockTotalBase = parseFloat(finalStockTotalBase);
      updateData.stockCantidad = updateData.stockTotalBase; // sync
    } else if (stockCantidad !== undefined && stockCantidad !== '') {
      updateData.stockCantidad = parseFloat(stockCantidad);
    }

    if (contenidoPorUnidad !== undefined && contenidoPorUnidad !== '') updateData.contenidoPorUnidad = parseFloat(contenidoPorUnidad);
    if (stockUnidades !== undefined && stockUnidades !== '') updateData.stockUnidades = parseFloat(stockUnidades);
    
    if (precioCompraUnidad !== undefined) {
      updateData.precioCompraUnidad = precioCompraUnidad !== '' ? parseFloat(precioCompraUnidad) : null;
      updateData.precioCompra = updateData.precioCompraUnidad; // sync
    } else if (precioCompra !== undefined) {
      updateData.precioCompra = precioCompra !== '' ? parseFloat(precioCompra) : null;
    }
    
    if (unidadBase !== undefined && unidadBase !== '') {
      updateData.unidadMedida = unidadBase; // sync
    } else if (unidadMedida !== undefined && unidadMedida !== '') {
      updateData.unidadMedida = unidadMedida;
    }

    if (updateData.stockCantidad !== undefined && updateData.stockCantidad < 0) {
      throw new Error('El stock no puede ser negativo');
    }

    if (updateData.stockUnidades !== undefined && updateData.stockUnidades < 0) {
      throw new Error('El stock en unidades no puede ser negativo');
    }

    if (updateData.precioCompra !== undefined && updateData.precioCompra !== null && updateData.precioCompra < 0) {
      throw new Error('El precio de compra no puede ser negativo');
    }
    
    if (updateData.contenidoPorUnidad !== undefined && updateData.contenidoPorUnidad <= 0) {
      throw new Error('El contenido por unidad debe ser mayor a 0');
    }
    
    if (nombre) {
      const existe = await this.inventarioRepository.findMedicamentoByNombre(nombre);
      if (existe && existe.id !== parseInt(id)) {
        throw new Error('Ya existe un medicamento con ese nombre');
      }
    }
    
    return await this.inventarioRepository.updateMedicamento(id, updateData);
  }
}

module.exports = UpdateMedicamento;
