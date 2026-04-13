/**
 * Interface for Animal Repository
 */
class IAnimalRepository {
  async save(animal) {
    throw new Error('Method not implemented');
  }

  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findAll() {
    throw new Error('Method not implemented');
  }

  async findByTag(tag) {
    throw new Error('Method not implemented');
  }

  async update(id, animalData) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }
}

module.exports = IAnimalRepository;
