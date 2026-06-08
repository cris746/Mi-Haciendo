class GetReporteStockBajo {
  constructor(reportesRepository) {
    this.reportesRepository = reportesRepository;
  }

  async execute(umbral) {
    return await this.reportesRepository.getStockBajoReport(umbral);
  }
}

module.exports = GetReporteStockBajo;
