class CreateAnimalDTO {
  constructor(data) {
    this.nombre = data.nombre;
    this.nroArete = data.nroArete;
    this.sexo = data.sexo;
    this.peso = data.peso;
    this.fechaNacimiento = data.fechaNacimiento ? new Date(data.fechaNacimiento) : null;
    this.fechaIngreso = data.fechaIngreso ? new Date(data.fechaIngreso) : new Date();
    this.categoriaId = parseInt(data.categoriaId);
    this.razaId = parseInt(data.razaId);
    this.padreId = data.padreId ? parseInt(data.padreId) : null;
    this.madreId = data.madreId ? parseInt(data.madreId) : null;
    this.imagen = data.imagen || null;
    this.origen = data.origen ? data.origen.toUpperCase() : null;
    this.edadIngresoMeses = data.edadIngresoMeses !== undefined && data.edadIngresoMeses !== null ? parseInt(data.edadIngresoMeses) : null;
    this.precioCompra = data.precioCompra !== undefined && data.precioCompra !== null && data.precioCompra !== ''
      ? parseFloat(data.precioCompra)
      : null;
  }

  static validate(data) {
    const errors = [];
    if (!data.nombre) errors.push('El nombre es obligatorio');
    if (!data.nroArete) errors.push('El número de arete es obligatorio');
    if (!data.sexo) errors.push('El sexo es obligatorio');
    if (data.sexo && !['MACHO', 'HEMBRA'].includes(data.sexo.toUpperCase())) {
      errors.push('El sexo debe ser MACHO o HEMBRA');
    }
    if (!data.categoriaId) errors.push('La categoría es obligatoria');
    if (!data.razaId) errors.push('La raza es obligatoria');
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = CreateAnimalDTO;
