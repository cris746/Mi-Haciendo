class CreateTratamiento {
  constructor(sanidadRepository) {
    this.sanidadRepository = sanidadRepository;
  }

  async execute(data) {
    const { animalId, veterinarioId, descripcion, tipo } = data;

    if (!animalId || !veterinarioId || !descripcion || !tipo) {
      throw new Error('Datos incompletos para crear el tratamiento (animal, veterinario, descripción y tipo son obligatorios)');
    }

    // Validar animal activo y no vendido
    const prisma = require('../../../shared/infrastructure/persistence/prisma');
    const animal = await prisma.animal.findUnique({ where: { id: parseInt(animalId) } });
    if (!animal)        throw new Error('Animal no encontrado');
    if (!animal.estado) throw new Error('El animal no está activo');
    if (animal.vendido) throw new Error('No se puede registrar un tratamiento a un animal que ya fue vendido');

    // Validar veterinario activo
    const vet = await prisma.veterinario.findUnique({ where: { id: parseInt(veterinarioId) } });
    if (!vet)        throw new Error('Veterinario no encontrado');
    if (!vet.estado) throw new Error('El veterinario no está activo');

    // Forzar fechaFin a nulo ya que los tratamientos nuevos inician EN CURSO
    data.fechaFin = undefined;

    return await this.sanidadRepository.saveTratamiento(data);
  }
}

module.exports = CreateTratamiento;
