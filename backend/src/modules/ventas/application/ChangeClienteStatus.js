class ChangeClienteStatus {
  constructor(ventasRepository) {
    this.ventasRepository = ventasRepository;
  }

  async execute(id) {
    const cliente = await this.ventasRepository.findClienteById(id);
    if (!cliente) {
      throw new Error('Cliente no encontrado');
    }
    
    const newStatus = !cliente.estado;
    return await this.ventasRepository.changeClienteStatus(id, newStatus);
  }
}

module.exports = ChangeClienteStatus;
