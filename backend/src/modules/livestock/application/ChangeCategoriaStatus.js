class ChangeCategoriaStatus {
  constructor(animalRepository) {
    this.animalRepository = animalRepository;
  }

  async execute(id) {
    const categoria = await this.animalRepository.findCategoriaById(id);
    if (!categoria) {
      throw new Error('Categoría no encontrada');
    }

    return await this.animalRepository.updateCategoria(id, { estado: !categoria.estado });
  }
}

module.exports = ChangeCategoriaStatus;
