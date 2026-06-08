class GetReporteProveedores {
  constructor(reportesRepository) {
    this.reportesRepository = reportesRepository;
  }

  async execute(filters) {
    return this.reportesRepository.getProvidersReport(filters);
  }
}

module.exports = GetReporteProveedores;
