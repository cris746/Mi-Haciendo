const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with new comprehensive schema...');

  // 1. Create Roles/Users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@mihacienda.com' },
    update: {},
    create: {
      nombre: 'Administrador Principal',
      email: 'admin@mihacienda.com',
      password: adminPassword,
      rol: 'ADMIN',
    },
  });
  console.log(`✅ Admin user created: ${admin.email}`);

  const vetPassword = await bcrypt.hash('vet123', 10);
  const vet = await prisma.usuario.upsert({
    where: { email: 'veterinario@mihacienda.com' },
    update: {},
    create: {
      nombre: 'Dr. Juan Pérez',
      email: 'veterinario@mihacienda.com',
      password: vetPassword,
      rol: 'VETERINARIO',
    },
  });
  console.log(`✅ Vet user created: ${vet.email}`);

  // 2. Create Razas
  const brahman = await prisma.raza.create({ data: { nombre: 'Brahman' } });
  const holstein = await prisma.raza.create({ data: { nombre: 'Holstein' } });
  const nelore = await prisma.raza.create({ data: { nombre: 'Nelore' } });

  // 3. Create Categorias
  const vaca = await prisma.categoria.create({ data: { nombre: 'Vaca' } });
  const toro = await prisma.categoria.create({ data: { nombre: 'Toro' } });
  const becerro = await prisma.categoria.create({ data: { nombre: 'Becerro' } });

  // 4. Create Parcela
  const parcela1 = await prisma.parcela.create({ data: { nombre: 'Potrero Norte', ubicacion: 'Lote A' } });

  // 5. Create Animals
  const animal1 = await prisma.animal.create({
    data: {
      nombre: 'Bella',
      arete: 'A-101',
      sexo: 'Hembra',
      peso: 450.5,
      estado: 'Sano',
      razaId: brahman.id,
      categoriaId: vaca.id,
      fechaNacimiento: new Date('2022-05-10'),
    },
  });

  const animal2 = await prisma.animal.create({
    data: {
      nombre: 'Rambo',
      arete: 'A-102',
      sexo: 'Macho',
      peso: 620.0,
      estado: 'Sano',
      razaId: nelore.id,
      categoriaId: toro.id,
      fechaNacimiento: new Date('2021-08-15'),
    },
  });

  // 6. Create Veterinario reference
  const veterinarioDoc = await prisma.veterinario.create({
    data: {
      nombre: 'Dr. Juan Pérez',
      telefono: '555-0199',
    },
  });

  console.log('✨ Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
