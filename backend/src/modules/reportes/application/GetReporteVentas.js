class GetReporteVentas {
  constructor(reportesRepository) {
    this.reportesRepository = reportesRepository;
  }

  async execute(filters = {}) {
    return await this.reportesRepository.getSalesReport(filters);
  }
}

module.exports = GetReporteVentas;
