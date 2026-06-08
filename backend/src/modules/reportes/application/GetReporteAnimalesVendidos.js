class GetReporteAnimalesVendidos {
  constructor(reportesRepository) {
    this.reportesRepository = reportesRepository;
  }

  async execute(filters = {}) {
    return await this.reportesRepository.getAnimalesVendidosReport(filters);
  }
}

module.exports = GetReporteAnimalesVendidos;
