class ChangeAlimentoStatus {
  constructor(inventarioRepository) {
    this.inventarioRepository = inventarioRepository;
  }

  async execute(id) {
    if (!id) throw new Error('ID de alimento es requerido');
    
    const alimento = await this.inventarioRepository.findAlimentoById(id);
    if (!alimento) throw new Error('Alimento no encontrado');

    const newStatus = !alimento.estado;
    return await this.inventarioRepository.changeAlimentoStatus(id, newStatus);
  }
}

module.exports = ChangeAlimentoStatus;
