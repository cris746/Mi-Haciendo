class TransferirAnimal {
  constructor(movimientoRepository) {
    this.movimientoRepository = movimientoRepository;
  }

  async execute(data) {
    const { animalId, nuevaParcelaId, parcelaId, fechaIngreso, observacion } = data;
    const destinoId = nuevaParcelaId || parcelaId;

    if (!animalId || !destinoId) {
      throw new Error('Animal y nueva Parcela son obligatorios');
    }

    let parsedFechaIngreso = new Date();
    if (fechaIngreso) {
      parsedFechaIngreso = new Date(fechaIngreso);
      if (isNaN(parsedFechaIngreso.getTime())) {
        throw new Error('La fecha de ingreso no es válida.');
      }
    }

    const animal = await this.movimientoRepository.findAnimalById(animalId);
    if (!animal) {
      throw new Error('El animal no existe');
    }
    if (!animal.estado) {
      throw new Error('No se puede transferir un animal inactivo');
    }
    if (animal.vendido) {
      throw new Error('No se puede transferir un animal vendido');
    }

    const animalDate = animal.origen === 'COMPRADO' ? animal.fechaIngreso : animal.fechaNacimiento;
    if (animalDate && parsedFechaIngreso < new Date(animalDate)) {
      throw new Error('La fecha de transferencia no puede ser anterior a la fecha de compra/nacimiento del animal.');
    }

    const parcela = await this.movimientoRepository.findParcelaById(destinoId);
    if (!parcela) {
      throw new Error('La parcela destino no existe');
    }
    if (!parcela.estado) {
      throw new Error('La parcela destino está inactiva');
    }

    const active = await this.movimientoRepository.findActiveMovimientoByAnimal(animalId);
    if (!active) {
      throw new Error('El animal no tiene ubicación actual. Use asignación inicial.');
    }

    if (active.parcelaId === parseInt(destinoId)) {
      throw new Error('El animal ya se encuentra en la parcela destino');
    }

    return await this.movimientoRepository.transferirAnimal(animalId, destinoId, parsedFechaIngreso, observacion);
  }
}

module.exports = TransferirAnimal;
