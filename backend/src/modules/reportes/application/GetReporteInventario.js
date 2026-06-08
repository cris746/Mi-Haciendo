class GetReporteInventario {
  constructor(reportesRepository) {
    this.reportesRepository = reportesRepository;
  }

  async execute(filters) {
    return this.reportesRepository.getInventoryReport(filters);
  }
}

module.exports = GetReporteInventario;
