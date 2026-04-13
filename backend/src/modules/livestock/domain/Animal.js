class Animal {
  constructor({ id, tag, name, breed, gender, birthDate, weight, status, farmId, createdAt, updatedAt }) {
    this.id = id;
    this.tag = tag;
    this.name = name;
    this.breed = breed;
    this.gender = gender;
    this.birthDate = birthDate;
    this.weight = weight;
    this.status = status;
    this.farmId = farmId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Domain logic could go here (e.g. validate weight, check gender)
}

module.exports = Animal;
