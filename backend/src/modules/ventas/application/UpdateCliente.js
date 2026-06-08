class UpdateCliente {
  constructor(ventasRepository) {
    this.ventasRepository = ventasRepository;
  }

  async execute(id, data) {
    const cliente = await this.ventasRepository.findClienteById(id);
    if (!cliente) {
      throw new Error('Cliente no encontrado');
    }
    return await this.ventasRepository.updateCliente(id, data);
  }
}

module.exports = UpdateCliente;
