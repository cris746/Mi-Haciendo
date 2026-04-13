class User {
  constructor({ id, nombre, email, password, rol, createdAt, updatedAt }) {
    this.id = id;
    this.nombre = nombre;
    this.email = email;
    this.password = password;
    this.rol = rol;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Domain logic for user...
}

module.exports = User;
