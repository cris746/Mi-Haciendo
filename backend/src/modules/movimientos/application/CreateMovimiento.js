class CreateMovimiento {
  constructor(movimientoRepository) {
    this.movimientoRepository = movimientoRepository;
  }

  async execute(data) {
    const { animalId, parcelaId, fechaIngreso } = data;
    
    if (!animalId || !parcelaId) {
      throw new Error('Animal y Parcela son obligatorios');
    }

    let parsedFechaIngreso = new Date();
    if (fechaIngreso) {
      parsedFechaIngreso = new Date(fechaIngreso);
      if (isNaN(parsedFechaIngreso.getTime())) {
        throw new Error('La fecha de ingreso no es válida.');
      }
    }
    data.fechaIngreso = parsedFechaIngreso;

    const animal = await this.movimientoRepository.findAnimalById(animalId);
    if (!animal) {
      throw new Error('El animal no existe');
    }
    if (!animal.estado) {
      throw new Error('No se puede asignar ubicación a un animal inactivo');
    }
    if (animal.vendido) {
      throw new Error('No se puede asignar ubicación a un animal vendido');
    }

    // Validar fecha de ingreso a parcela contra fecha de compra/nacimiento
    const animalDate = animal.origen === 'COMPRADO' ? animal.fechaIngreso : animal.fechaNacimiento;
    if (animalDate && parsedFechaIngreso < new Date(animalDate)) {
      throw new Error('La fecha de ingreso a parcela no puede ser anterior a la fecha de compra/ingreso del animal.');
    }

    const parcela = await this.movimientoRepository.findParcelaById(parcelaId);
    if (!parcela) {
      throw new Error('La parcela destino no existe');
    }
    if (!parcela.estado) {
      throw new Error('La parcela destino está inactiva');
    }

    // Validar si ya tiene un movimiento activo
    const active = await this.movimientoRepository.findActiveMovimientoByAnimal(animalId);
    if (active) {
      throw new Error('El animal ya tiene un movimiento activo. Use transferir para moverlo.');
    }

    return await this.movimientoRepository.saveMovimiento(data);
  }
}

module.exports = CreateMovimiento;
