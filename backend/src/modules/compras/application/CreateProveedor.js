class CreateProveedor {
  constructor(comprasRepository) {
    this.comprasRepository = comprasRepository;
  }

  async execute(data) {
    const { nombre } = data;
    if (!nombre) {
      throw new Error('El nombre del proveedor es obligatorio');
    }
    return await this.comprasRepository.saveProveedor(data);
  }
}

module.exports = CreateProveedor;
