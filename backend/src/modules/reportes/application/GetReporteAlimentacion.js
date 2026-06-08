class GetReporteAlimentacion {
  constructor(reportesRepository) {
    this.reportesRepository = reportesRepository;
  }

  async execute(filters) {
    return this.reportesRepository.getFeedingReport(filters);
  }
}

module.exports = GetReporteAlimentacion;
