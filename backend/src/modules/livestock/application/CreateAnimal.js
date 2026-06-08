const CreateAnimalDTO = require('./dtos/createAnimal.dto');

class CreateAnimal {
  constructor(animalRepository) {
    this.animalRepository = animalRepository;
  }

  async execute(data) {
    // Validate DTO
    const { isValid, errors } = CreateAnimalDTO.validate(data);
    if (!isValid) {
      throw new Error(errors.join(', '));
    }

    const dto = new CreateAnimalDTO(data);

    // Check if nroArete already exists
    const existingAnimal = await this.animalRepository.findByArete(dto.nroArete);
    if (existingAnimal) {
      throw new Error(`Ya existe un animal con el número de arete ${dto.nroArete}`);
    }

    // Validate Parents
    if (dto.padreId) {
      const padre = await this.animalRepository.findById(dto.padreId);
      if (!padre) throw new Error('El padre especificado no existe');
      if (!padre.estado) throw new Error('El padre especificado está inactivo');
      if (padre.vendido) throw new Error('No se puede seleccionar un animal vendido como padre');
      if (padre.sexo !== 'MACHO') throw new Error('El padre debe ser MACHO');
      if (dto.madreId && dto.padreId === dto.madreId) throw new Error('Padre y madre no pueden ser el mismo animal');
    }

    if (dto.madreId) {
      const madre = await this.animalRepository.findById(dto.madreId);
      if (!madre) throw new Error('La madre especificada no existe');
      if (!madre.estado) throw new Error('La madre especificada está inactiva');
      if (madre.vendido) throw new Error('No se puede seleccionar un animal vendido como madre');
      if (madre.sexo !== 'HEMBRA') throw new Error('La madre debe ser HEMBRA');
    }

    // Validate Origen
    if (dto.origen) {
      if (!['NACIDO', 'COMPRADO'].includes(dto.origen)) {
        throw new Error('El origen debe ser NACIDO o COMPRADO');
      }
      if (dto.origen === 'NACIDO') {
        if (!dto.fechaNacimiento) throw new Error('Para animales NACIDOS es obligatorio la fecha de nacimiento');
        dto.edadIngresoMeses = null; // No aplica
        dto.precioCompra = null;     // No aplica para animales nacidos
      } else if (dto.origen === 'COMPRADO') {
        if (dto.edadIngresoMeses === null || isNaN(dto.edadIngresoMeses) || dto.edadIngresoMeses < 0) {
          throw new Error('Para animales COMPRADOS es obligatoria la edad de ingreso (en meses) y debe ser válida');
        }
        if (dto.precioCompra === null || dto.precioCompra === undefined || isNaN(dto.precioCompra) || dto.precioCompra < 0) {
          throw new Error('Para animales COMPRADOS es obligatorio el precio de compra y debe ser mayor o igual a 0');
        }
      }
    }

    const animalData = {
      nombre: dto.nombre,
      nroArete: dto.nroArete,
      sexo: dto.sexo.toUpperCase(),
      peso: dto.peso,
      fechaNacimiento: dto.fechaNacimiento,
      fechaIngreso: dto.fechaIngreso,
      categoriaId: dto.categoriaId,
      razaId: dto.razaId,
      padreId: dto.padreId,
      madreId: dto.madreId,
      imagen: dto.imagen,
      origen: dto.origen,
      edadIngresoMeses: dto.edadIngresoMeses,
      precioCompra: dto.precioCompra ?? null,
      estado: true
    };

    return await this.animalRepository.save(animalData);
  }
}

module.exports = CreateAnimal;
