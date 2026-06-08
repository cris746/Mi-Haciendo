class GetMovimientosByAnimal {
  constructor(movimientoRepository) {
    this.movimientoRepository = movimientoRepository;
  }

  async execute(animalId) {
    if (!animalId) throw new Error('ID de animal es obligatorio');
    return await this.movimientoRepository.findHistoryByAnimal(animalId);
  }
}

module.exports = GetMovimientosByAnimal;
