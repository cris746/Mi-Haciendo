class GetCompraDetalle {
  constructor(comprasRepository) {
    this.comprasRepository = comprasRepository;
  }

  async execute(id) {
    if (!id) {
      throw new Error('ID de la compra es obligatorio');
    }
    return await this.comprasRepository.findCompraById(id);
  }
}

module.exports = GetCompraDetalle;
