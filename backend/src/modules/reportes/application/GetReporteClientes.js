class GetReporteClientes {
  constructor(reportesRepository) {
    this.reportesRepository = reportesRepository;
  }

  async execute(filters) {
    return this.reportesRepository.getClientsReport(filters);
  }
}

module.exports = GetReporteClientes;
