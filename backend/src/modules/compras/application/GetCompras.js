class GetCompras {
  constructor(comprasRepository) {
    this.comprasRepository = comprasRepository;
  }

  async execute() {
    return await this.comprasRepository.findAllCompras();
  }
}

module.exports = GetCompras;
