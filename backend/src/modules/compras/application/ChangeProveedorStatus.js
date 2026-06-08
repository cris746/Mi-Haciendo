class ChangeProveedorStatus {
  constructor(comprasRepository) {
    this.comprasRepository = comprasRepository;
  }

  async execute(id) {
    const proveedor = await this.comprasRepository.findProveedorById(id);
    if (!proveedor) {
      throw new Error('Proveedor no encontrado');
    }
    const newStatus = !proveedor.estado;
    return await this.comprasRepository.changeProveedorStatus(id, newStatus);
  }
}

module.exports = ChangeProveedorStatus;
