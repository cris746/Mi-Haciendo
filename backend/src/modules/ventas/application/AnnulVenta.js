class AnnulVenta {
  constructor(ventasRepository) {
    this.ventasRepository = ventasRepository;
  }

  async execute(id, motivoAnulacion) {
    if (!id) throw new Error('ID de la venta es requerido');
    
    if (!motivoAnulacion || motivoAnulacion.trim() === '') {
      throw new Error('El motivo de anulación es obligatorio.');
    }
    
    // El repositorio se encarga de las validaciones de existencia, 
    // estado y reversión del animal dentro de la transacción
    return await this.ventasRepository.anularVenta(id, motivoAnulacion.trim());
  }
}

module.exports = AnnulVenta;
