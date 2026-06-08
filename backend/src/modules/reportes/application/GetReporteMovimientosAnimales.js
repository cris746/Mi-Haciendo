class GetReporteMovimientosAnimales {
  constructor(reportesRepository) {
    this.reportesRepository = reportesRepository;
  }

  async execute(filters) {
    return this.reportesRepository.getAnimalMovementsReport(filters);
  }
}

module.exports = GetReporteMovimientosAnimales;
