/**
 * Interface for Sanidad Repository
 */
class ISanidadRepository {
  // ── Veterinarios ────────────────────────────────────────────────────────────
  async findAllVeterinarios() {
    throw new Error('Method not implemented');
  }

  async findVeterinarioById(id) {
    throw new Error('Method not implemented');
  }

  async saveVeterinario(data) {
    throw new Error('Method not implemented');
  }

  async updateVeterinario(id, data) {
    throw new Error('Method not implemented');
  }

  async toggleVeterinarioEstado(id) {
    throw new Error('Method not implemented');
  }

  // ── Medicamentos ─────────────────────────────────────────────────────────────
  async findAllMedicamentosActivos() {
    throw new Error('Method not implemented');
  }

  // ── Tratamientos ─────────────────────────────────────────────────────────────
  async findAllTratamientos(filters) {
    throw new Error('Method not implemented');
  }

  async findTratamientoById(id) {
    throw new Error('Method not implemented');
  }

  async findTratamientosByAnimal(animalId) {
    throw new Error('Method not implemented');
  }

  async saveTratamiento(data) {
    throw new Error('Method not implemented');
  }

  async annulTratamiento(id) {
    throw new Error('Method not implemented');
  }

  // ── Diagnósticos ─────────────────────────────────────────────────────────────
  async addDiagnostico(data) {
    throw new Error('Method not implemented');
  }

  // ── Aplicaciones de Medicamento ───────────────────────────────────────────────
  async aplicarMedicamento(data) {
    throw new Error('Method not implemented');
  }
}

module.exports = ISanidadRepository;
