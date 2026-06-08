class GetDashboard {
  constructor(reportesRepository) {
    this.reportesRepository = reportesRepository;
  }

  async execute() {
    return await this.reportesRepository.getDashboardMetrics();
  }
}

module.exports = GetDashboard;
