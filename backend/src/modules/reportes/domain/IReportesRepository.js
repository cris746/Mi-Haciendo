class IReportesRepository {
  async getDashboardMetrics() {
    throw new Error('Method not implemented');
  }

  // Reportes existentes (ahora con filtros)
  async getSalesReport(filters) {
    throw new Error('Method not implemented');
  }

  async getPurchasesReport(filters) {
    throw new Error('Method not implemented');
  }

  async getInventoryReport(filters) {
    throw new Error('Method not implemented');
  }

  // Reportes nuevos
  async getSanitarioReport(filters) {
    throw new Error('Method not implemented');
  }

  async getAnimalesVendidosReport(filters) {
    throw new Error('Method not implemented');
  }

  async getGananciasReport(filters) {
    throw new Error('Method not implemented');
  }

  async getStockBajoReport(umbral) {
    throw new Error('Method not implemented');
  }
}

module.exports = IReportesRepository;
