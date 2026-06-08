class IComprasRepository {
  async saveProveedor(data) {
    throw new Error('Method not implemented');
  }

  async findAllProveedores() {
    throw new Error('Method not implemented');
  }

  async saveCompra(data) {
    throw new Error('Method not implemented');
  }

  async findAllCompras() {
    throw new Error('Method not implemented');
  }

  async findProveedorById(id) {
    throw new Error('Method not implemented');
  }

  async updateProveedor(id, data) {
    throw new Error('Method not implemented');
  }

  async changeProveedorStatus(id, status) {
    throw new Error('Method not implemented');
  }

  async findCompraById(id) {
    throw new Error('Method not implemented');
  }

  async anularCompra(id) {
    throw new Error('Method not implemented');
  }

  async findAlimentoById(id) {
    throw new Error('Method not implemented');
  }

  async findMedicamentoById(id) {
    throw new Error('Method not implemented');
  }
}

module.exports = IComprasRepository;
