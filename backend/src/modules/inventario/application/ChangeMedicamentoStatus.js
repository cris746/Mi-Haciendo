class ChangeMedicamentoStatus {
  constructor(inventarioRepository) {
    this.inventarioRepository = inventarioRepository;
  }

  async execute(id) {
    if (!id) throw new Error('ID de medicamento es requerido');
    
    const medicamento = await this.inventarioRepository.findMedicamentoById(id);
    if (!medicamento) throw new Error('Medicamento no encontrado');

    const newStatus = !medicamento.estado;
    return await this.inventarioRepository.changeMedicamentoStatus(id, newStatus);
  }
}

module.exports = ChangeMedicamentoStatus;
