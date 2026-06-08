class AnnulCompra {
  constructor(comprasRepository) {
    this.comprasRepository = comprasRepository;
  }

  async execute(id, data = {}) {
    if (!id) throw new Error('ID de la compra es requerido');
    
    if (!data.motivoAnulacion || data.motivoAnulacion.trim() === '') {
      throw new Error('El motivo de anulación es obligatorio.');
    }
    
    // El repositorio se encarga de las validaciones de existencia, 
    // estado y suficiencia de stock dentro de la transacción
    return await this.comprasRepository.anularCompra(id, data);
  }
}

module.exports = AnnulCompra;
