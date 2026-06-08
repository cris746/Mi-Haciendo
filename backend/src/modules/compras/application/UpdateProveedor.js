class UpdateProveedor {
  constructor(comprasRepository) {
    this.comprasRepository = comprasRepository;
  }

  async execute(id, data) {
    const proveedor = await this.comprasRepository.findProveedorById(id);
    if (!proveedor) {
      throw new Error('Proveedor no encontrado');
    }
    return await this.comprasRepository.updateProveedor(id, data);
  }
}

module.exports = UpdateProveedor;
