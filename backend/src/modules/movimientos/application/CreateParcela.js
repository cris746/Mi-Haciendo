class CreateParcela {
  constructor(movimientoRepository) {
    this.movimientoRepository = movimientoRepository;
  }

  async execute(data) {
    let { nombre, tamano, imagen, estado } = data;
    
    if (!nombre || nombre.trim() === '') {
      throw new Error('El nombre de la parcela es obligatorio');
    }
    nombre = nombre.trim();

    const existing = await this.movimientoRepository.findParcelaByName(nombre);
    if (existing) {
      throw new Error(`La parcela '${nombre}' ya existe.`);
    }

    if (tamano !== undefined && tamano !== null && tamano !== '') {
      tamano = parseFloat(tamano);
      if (isNaN(tamano) || tamano < 0) {
        throw new Error('El tamaño debe ser un número positivo.');
      }
    } else {
      tamano = null;
    }

    return await this.movimientoRepository.saveParcela({
      nombre,
      tamano,
      imagen: imagen || null,
      estado: estado !== undefined ? estado : true
    });
  }
}

module.exports = CreateParcela;
