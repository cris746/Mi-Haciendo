class UpdateAnimal {
  constructor(animalRepository) {
    this.animalRepository = animalRepository;
  }

  async execute(id, animalData) {
    const animal = await this.animalRepository.findById(id);
    if (!animal) {
      throw new Error('Animal no encontrado');
    }

    const updatedData = {};

    if (animalData.nombre !== undefined) updatedData.nombre = animalData.nombre;
    if (animalData.peso !== undefined) {
      if (animalData.peso < 0) throw new Error('El peso debe ser positivo');
      updatedData.peso = animalData.peso;
    }
    if (animalData.imagen !== undefined) updatedData.imagen = animalData.imagen;
    if (animalData.fechaNacimiento !== undefined) updatedData.fechaNacimiento = animalData.fechaNacimiento ? new Date(animalData.fechaNacimiento) : null;
    if (animalData.fechaIngreso !== undefined) updatedData.fechaIngreso = animalData.fechaIngreso ? new Date(animalData.fechaIngreso) : null;
    if (animalData.razaId !== undefined) updatedData.razaId = parseInt(animalData.razaId);
    if (animalData.categoriaId !== undefined) updatedData.categoriaId = parseInt(animalData.categoriaId);
    
    if (animalData.sexo !== undefined) {
      const sexo = animalData.sexo.toUpperCase();
      if (!['MACHO', 'HEMBRA'].includes(sexo)) throw new Error('El sexo debe ser MACHO o HEMBRA');
      updatedData.sexo = sexo;
    }

    if (animalData.nroArete !== undefined && animalData.nroArete !== animal.nroArete) {
      const existing = await this.animalRepository.findByArete(animalData.nroArete);
      if (existing) throw new Error(`Ya existe otro animal con el arete ${animalData.nroArete}`);
      updatedData.nroArete = animalData.nroArete;
    }

    // Validate Origen and Age
    if (animalData.origen !== undefined) {
      const origen = animalData.origen ? animalData.origen.toUpperCase() : null;
      if (origen && !['NACIDO', 'COMPRADO'].includes(origen)) {
        throw new Error('El origen debe ser NACIDO o COMPRADO');
      }
      updatedData.origen = origen;

      if (origen === 'NACIDO') {
        const checkFecha = updatedData.fechaNacimiento !== undefined ? updatedData.fechaNacimiento : animal.fechaNacimiento;
        if (!checkFecha) throw new Error('Para animales NACIDOS es obligatorio la fecha de nacimiento');
        updatedData.edadIngresoMeses = null;
        updatedData.precioCompra = null; // Los animales nacidos no tienen precio de compra
      } else if (origen === 'COMPRADO') {
        const edad = animalData.edadIngresoMeses !== undefined ? animalData.edadIngresoMeses : animal.edadIngresoMeses;
        if (edad === null || isNaN(edad) || edad < 0) {
          throw new Error('Para animales COMPRADOS es obligatoria la edad de ingreso (en meses) y debe ser válida');
        }
        updatedData.edadIngresoMeses = parseInt(edad);

        // Validar precio de compra al cambiar a COMPRADO
        const pc = animalData.precioCompra !== undefined ? animalData.precioCompra : animal.precioCompra;
        if (pc === null || pc === undefined || isNaN(parseFloat(pc)) || parseFloat(pc) < 0) {
          throw new Error('Para animales COMPRADOS es obligatorio el precio de compra y debe ser mayor o igual a 0');
        }
        updatedData.precioCompra = parseFloat(pc);
      }
    } else {
      // Origen no cambia
      if (animalData.edadIngresoMeses !== undefined) {
        const currentOrigen = animal.origen;
        if (currentOrigen === 'COMPRADO') {
            updatedData.edadIngresoMeses = parseInt(animalData.edadIngresoMeses);
        } else if (animalData.edadIngresoMeses !== null) {
             throw new Error('No se puede asignar edad de ingreso a un animal que no es COMPRADO');
        }
      }
      // Actualizar precioCompra independientemente si origen no cambia
      if (animalData.precioCompra !== undefined) {
        const currentOrigen = animal.origen;
        if (currentOrigen === 'COMPRADO') {
          const pc = animalData.precioCompra;
          if (pc !== null && (isNaN(parseFloat(pc)) || parseFloat(pc) < 0)) {
            throw new Error('El precio de compra debe ser un valor válido mayor o igual a 0');
          }
          updatedData.precioCompra = pc !== null && pc !== '' ? parseFloat(pc) : null;
        } else if (animalData.precioCompra !== null && animalData.precioCompra !== '') {
          throw new Error('No se puede asignar precio de compra a un animal que no es COMPRADO');
        }
      }
    }

    // Validate Parents
    const pId = animalData.padreId !== undefined ? (animalData.padreId ? parseInt(animalData.padreId) : null) : animal.padreId;
    const mId = animalData.madreId !== undefined ? (animalData.madreId ? parseInt(animalData.madreId) : null) : animal.madreId;

    if (pId) {
      if (pId === animal.id) throw new Error('Un animal no puede ser su propio padre');
      const padre = await this.animalRepository.findById(pId);
      if (!padre) throw new Error('El padre especificado no existe');
      if (!padre.estado) throw new Error('El padre especificado está inactivo');
      if (padre.vendido) throw new Error('No se puede seleccionar un animal vendido como padre');
      if (padre.sexo !== 'MACHO') throw new Error('El padre debe ser MACHO');
    }

    if (mId) {
      if (mId === animal.id) throw new Error('Un animal no puede ser su propia madre');
      const madre = await this.animalRepository.findById(mId);
      if (!madre) throw new Error('La madre especificada no existe');
      if (!madre.estado) throw new Error('La madre especificada está inactiva');
      if (madre.vendido) throw new Error('No se puede seleccionar un animal vendido como madre');
      if (madre.sexo !== 'HEMBRA') throw new Error('La madre debe ser HEMBRA');
    }

    if (pId && mId && pId === mId) {
        throw new Error('Padre y madre no pueden ser el mismo animal');
    }

    if (animalData.padreId !== undefined) updatedData.padreId = pId;
    if (animalData.madreId !== undefined) updatedData.madreId = mId;

    return await this.animalRepository.update(id, updatedData);
  }
}

module.exports = UpdateAnimal;
