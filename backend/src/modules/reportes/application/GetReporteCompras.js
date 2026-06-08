class GetReporteCompras {
  constructor(reportesRepository) {
    this.reportesRepository = reportesRepository;
  }

  async execute(filters = {}) {
    return await this.reportesRepository.getPurchasesReport(filters);
  }
}

module.exports = GetReporteCompras;
