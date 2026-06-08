class CreateCompra {
  constructor(comprasRepository) {
    this.comprasRepository = comprasRepository;
  }

  async execute(data) {
    const { proveedorId, detalles, numeroFactura, observacion } = data;

    if (!proveedorId || !detalles || !Array.isArray(detalles) || detalles.length === 0) {
      throw new Error('Proveedor y al menos un detalle son obligatorios');
    }

    const proveedor = await this.comprasRepository.findProveedorById(proveedorId);
    if (!proveedor) throw new Error('Proveedor no encontrado');
    if (!proveedor.estado) throw new Error('El proveedor está inactivo');

    // Validar que cada detalle tenga un producto y cantidades/precios positivos
    for (const [index, d] of detalles.entries()) {
      if ((!d.alimentoId && !d.medicamentoId) || (d.alimentoId && d.medicamentoId)) {
        throw new Error(`El detalle ${index + 1} debe incluir un alimentoId o un medicamentoId, pero no ambos al mismo tiempo`);
      }

      const cantidad = parseFloat(d.cantidad);
      const precio = parseFloat(d.precio);

      if (isNaN(cantidad) || cantidad <= 0) {
        throw new Error(`La cantidad en el detalle ${index + 1} debe ser mayor a 0`);
      }
      if (isNaN(precio) || precio <= 0) {
        throw new Error('El precio unitario debe ser mayor a 0.');
      }

      if (d.alimentoId) {
        const alimento = await this.comprasRepository.findAlimentoById(d.alimentoId);
        if (!alimento) throw new Error(`Alimento con ID ${d.alimentoId} no encontrado`);
        if (!alimento.estado) throw new Error(`El alimento '${alimento.nombre}' está inactivo`);
      }
      if (d.medicamentoId) {
        const medicamento = await this.comprasRepository.findMedicamentoById(d.medicamentoId);
        if (!medicamento) throw new Error(`Medicamento con ID ${d.medicamentoId} no encontrado`);
        if (!medicamento.estado) throw new Error(`El medicamento '${medicamento.nombre}' está inactivo`);
      }
    }

    // Calcular subtotales y total
    let total = 0;
    const detallesProcesados = detalles.map(d => {
      const cantidad = parseFloat(d.cantidad) || 0;
      const precio = parseFloat(d.precio) || 0;
      const subtotal = cantidad * precio;
      total += subtotal;

      return {
        ...d,
        cantidad,
        precio,
        subtotal
      };
    });

    const compraData = {
      proveedorId: parseInt(proveedorId),
      total,
      detalles: detallesProcesados,
      numeroFactura: typeof numeroFactura === 'string' ? numeroFactura.trim() : null,
      observacion: typeof observacion === 'string' ? observacion.trim() : null
    };

    return await this.comprasRepository.saveCompra(compraData);
  }
}

module.exports = CreateCompra;
