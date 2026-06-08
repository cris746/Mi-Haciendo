class CreateCliente {
  constructor(ventasRepository) {
    this.ventasRepository = ventasRepository;
  }

  async execute(data) {
    const { nombre } = data;
    if (!nombre) {
      throw new Error('El nombre del cliente es obligatorio');
    }
    return await this.ventasRepository.saveCliente(data);
  }
}

module.exports = CreateCliente;
