class GetReporteGanancias {
  constructor(reportesRepository) {
    this.reportesRepository = reportesRepository;
  }

  async execute(filters = {}) {
    return await this.reportesRepository.getGananciasReport(filters);
  }
}

module.exports = GetReporteGanancias;
