class GetReporteAnimales {
  constructor(reportesRepository) {
    this.reportesRepository = reportesRepository;
  }

  async execute(filters) {
    return this.reportesRepository.getAnimalsReport(filters);
  }
}

module.exports = GetReporteAnimales;
