class GetVentaDetalle {
  constructor(ventasRepository) {
    this.ventasRepository = ventasRepository;
  }

  async execute(id) {
    if (!id) {
      throw new Error('ID de la venta es obligatorio');
    }
    return await this.ventasRepository.findVentaById(id);
  }
}

module.exports = GetVentaDetalle;
