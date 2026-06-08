class CreateVenta {
  constructor(ventasRepository) {
    this.ventasRepository = ventasRepository;
  }

  async execute(data) {
    const { clienteId, detalles, numeroFactura, observacion } = data;

    if (!clienteId || !detalles || !Array.isArray(detalles) || detalles.length === 0) {
      throw new Error('Cliente y al menos un detalle son obligatorios');
    }

    const cliente = await this.ventasRepository.findClienteById(clienteId);
    if (!cliente) throw new Error('Cliente no encontrado');
    if (!cliente.estado) throw new Error('El cliente está inactivo');

    const animalIdsSet = new Set();

    // Validar cada detalle
    for (const [index, d] of detalles.entries()) {
      if (!d.animalId) {
        throw new Error(`El detalle ${index + 1} debe incluir un animalId`);
      }

      // Nota: El precio y pesoVenta se validan más abajo durante el map() 
      // para mantener el bucle limpio y calcular subtotales.

      if (animalIdsSet.has(d.animalId)) {
        throw new Error(`El animal con ID ${d.animalId} está duplicado en esta venta`);
      }
      animalIdsSet.add(d.animalId);

      const animal = await this.ventasRepository.findAnimalById(d.animalId);
      if (!animal) throw new Error(`Animal con ID ${d.animalId} no encontrado`);
      if (!animal.estado) throw new Error(`El animal '${animal.nombre}' está inactivo`);
      if (animal.vendido) throw new Error(`El animal '${animal.nombre}' ya ha sido vendido`);
    }

    // Calcular subtotales y total
    let total = 0;
    const detallesProcesados = await Promise.all(detalles.map(async (d, index) => {
      const pesoVenta = parseFloat(d.pesoVenta);
      if (isNaN(pesoVenta) || pesoVenta <= 0) {
        throw new Error(`El peso de venta en el detalle ${index + 1} debe ser mayor a 0`);
      }
      
      const precioKg = parseFloat(d.precioKg);
      if (isNaN(precioKg) || precioKg <= 0) {
        throw new Error(`El precio por kg en el detalle ${index + 1} debe ser mayor a 0`);
      }

      const subtotal = pesoVenta * precioKg;
      total += subtotal;

      // Leer precioCompra del animal para calcular ganancia
      const animal = await this.ventasRepository.findAnimalById(d.animalId);
      const precioCompraAnimal = animal?.precioCompra !== null && animal?.precioCompra !== undefined
        ? parseFloat(animal.precioCompra)
        : null;
      const gananciaAnimal = precioCompraAnimal !== null
        ? parseFloat((subtotal - precioCompraAnimal).toFixed(2))
        : null;

      return {
        ...d,
        cantidad: pesoVenta, // Frontend payload has pesoVenta, we keep it as cantidad for compat
        precio: precioKg,     // And precioKg as precio for compat
        subtotal,
        pesoVenta,
        precioKg,
        precioCompraAnimal,
        gananciaAnimal
      };
    }));


    const ventaData = {
      clienteId: parseInt(clienteId),
      total,
      numeroFactura: numeroFactura ? numeroFactura.trim() : null,
      observacion: observacion ? observacion.trim() : null,
      detalles: detallesProcesados
    };

    return await this.ventasRepository.saveVenta(ventaData);
  }
}

module.exports = CreateVenta;
