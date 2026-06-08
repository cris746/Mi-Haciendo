class GetReporteSanitario {
  constructor(reportesRepository) {
    this.reportesRepository = reportesRepository;
  }

  async execute(filters = {}) {
    return await this.reportesRepository.getSanitarioReport(filters);
  }
}

module.exports = GetReporteSanitario;
