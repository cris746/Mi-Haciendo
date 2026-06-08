class GetReporteStockAlertas {
  constructor(reportesRepository) {
    this.reportesRepository = reportesRepository;
  }

  async execute(filters) {
    return this.reportesRepository.getStockAlertsReport(filters);
  }
}

module.exports = GetReporteStockAlertas;
