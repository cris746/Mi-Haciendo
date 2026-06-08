class ChangeParcelaStatus {
  constructor(movimientoRepository) {
    this.movimientoRepository = movimientoRepository;
  }

  async execute(id) {
    const parcela = await this.movimientoRepository.findParcelaById(id);
    if (!parcela) throw new Error('Parcela no encontrada');

    return await this.movimientoRepository.updateParcela(id, {
      estado: !parcela.estado
    });
  }
}

module.exports = ChangeParcelaStatus;
