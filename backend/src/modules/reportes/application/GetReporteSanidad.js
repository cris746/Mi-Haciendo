class GetReporteSanidad {
  constructor(reportesRepository) {
    this.reportesRepository = reportesRepository;
  }

  async execute(filters) {
    return this.reportesRepository.getSanidadReport(filters);
  }
}

module.exports = GetReporteSanidad;
