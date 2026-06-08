class GetReporteKardex {
  constructor(reportesRepository) {
    this.reportesRepository = reportesRepository;
  }

  async execute(filters) {
    return this.reportesRepository.getKardexReport(filters);
  }
}

module.exports = GetReporteKardex;
