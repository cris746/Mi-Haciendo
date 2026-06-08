const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning database...');
  await prisma.diagnostico.deleteMany();
  await prisma.aplicacionMedicamento.deleteMany();
  await prisma.tratamiento.deleteMany();
  await prisma.alimentacion.deleteMany();
  await prisma.detalleVenta.deleteMany();
  await prisma.venta.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.detalleCompra.deleteMany();
  await prisma.compra.deleteMany();
  await prisma.proveedor.deleteMany();
  await prisma.movimiento.deleteMany();
  await prisma.animal.deleteMany();
  await prisma.alimento.deleteMany();
  await prisma.medicamento.deleteMany();
  await prisma.veterinario.deleteMany();
  await prisma.parcela.deleteMany();
  await prisma.raza.deleteMany();
  await prisma.categoria.deleteMany();

  console.log('🌱 Seeding database with Animal Module, Movements, Health, Inventory, Sales and Purchases (Phase 7)...');

  // 1. Create Roles/Users
  const adminPassword = await bcrypt.hash('123456', 10);
  
  // ADMINS
  await prisma.user.upsert({
    where: { email: 'admin@admin.com' },
    update: {},
    create: { nombre: 'Administrador 1', email: 'admin@admin.com', password: adminPassword, role: 'ADMIN' },
  });
  await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: { nombre: 'Administrador 2', email: 'admin@test.com', password: adminPassword, role: 'ADMIN' },
  });

  // VETERINARIOS
  const vetPassword = await bcrypt.hash('vet123', 10);
  await prisma.user.upsert({
    where: { email: 'vet@vet.com' },
    update: {},
    create: { nombre: 'Veterinario 1', email: 'vet@vet.com', password: vetPassword, role: 'VETERINARIO' },
  });
  await prisma.user.upsert({
    where: { email: 'vet@test.com' },
    update: {},
    create: { nombre: 'Veterinario 2', email: 'vet@test.com', password: vetPassword, role: 'VETERINARIO' },
  });

  // VENDEDORES
  const ventasPassword = await bcrypt.hash('ventas123', 10);
  await prisma.user.upsert({
    where: { email: 'ventas@ventas.com' },
    update: {},
    create: { nombre: 'Vendedor 1', email: 'ventas@ventas.com', password: ventasPassword, role: 'VENDEDOR' },
  });
  await prisma.user.upsert({
    where: { email: 'ventas@test.com' },
    update: {},
    create: { nombre: 'Vendedor 2', email: 'ventas@test.com', password: ventasPassword, role: 'VENDEDOR' },
  });

  // 2. Create Razas
  const brahman = await prisma.raza.create({
    data: {
      nombre: 'Brahman',
      descripcion: 'Raza resistente al calor y parásitos',
      estado: true
    }
  });

  // 3. Create Categorias
  const ganado = await prisma.categoria.create({
    data: {
      nombre: 'Ganado de Carne',
      descripcion: 'Animales destinados a la producción de carne',
      estado: true
    }
  });

  // 4. Create Parcela
  const parcelaNorte = await prisma.parcela.create({
    data: {
      nombre: 'Potrero Norte',
      tamano: 15.5,
      estado: true,
      imagen: null
    }
  });

  // 5. Create Animals
  const padre = await prisma.animal.create({
    data: {
      nombre: 'Toro Zeus',
      nroArete: 'T-001',
      sexo: 'MACHO',
      peso: 850.0,
      estado: true,
      razaId: brahman.id,
      categoriaId: ganado.id,
      fechaNacimiento: new Date('2018-01-01'),
    },
  });

  const madre = await prisma.animal.create({
    data: {
      nombre: 'Vaca Hera',
      nroArete: 'V-001',
      sexo: 'HEMBRA',
      peso: 550.0,
      estado: true,
      razaId: brahman.id,
      categoriaId: ganado.id,
      fechaNacimiento: new Date('2019-05-15'),
    },
  });

  // 6. Create Initial Movements
  await prisma.movimiento.create({
    data: {
      animalId: padre.id,
      parcelaId: parcelaNorte.id,
      fechaIngreso: new Date()
    }
  });

  // 7. Create Health Data (Phase 4)
  const veterinario = await prisma.veterinario.create({
    data: {
      nombre: 'Dr. Roberto Sánchez',
      telefono: '0987-654321',
      email: 'roberto@veterinaria.com',
      estado: true
    }
  });

  const penicilina = await prisma.medicamento.create({
    data: {
      nombre: 'Penicilina G-Procaina',
      stockCantidad: 50,
      unidadMedida: 'Frasco 100ml',
      estado: true
    }
  });

  const vitamina = await prisma.medicamento.create({
    data: {
      nombre: 'Vitamina B12 Inyectable',
      stockCantidad: 30,
      unidadMedida: 'Frasco 50ml',
      estado: true
    }
  });

  const tratamiento = await prisma.tratamiento.create({
    data: {
      descripcion: 'Tratamiento por neumonía leve',
      tipo: 'CURATIVO',
      fechaInicio: new Date(),
      animal: { connect: { id: padre.id } },
      veterinario: { connect: { id: veterinario.id } }
    }
  });

  await prisma.diagnostico.create({
    data: {
      descripcion: 'Se observa tos seca y leve fiebre durante inspección matutina.',
      tratamiento: { connect: { id: tratamiento.id } }
    }
  });

  await prisma.aplicacionMedicamento.create({
    data: {
      dosis: '10ml IM',
      fecha: new Date(),
      tratamiento: { connect: { id: tratamiento.id } },
      medicamento: { connect: { id: penicilina.id } }
    }
  });


  // 8. Inventory & Feeding (Phase 5)
  const pasto = await prisma.alimento.create({
    data: {
      nombre: 'Pasto de Corte (Maralfalfa)',
      stockCantidad: 500.0,
      unidadMedida: 'kg',
      estado: true
    }
  });

  const concentrado = await prisma.alimento.create({
    data: {
      nombre: 'Concentrado Engorde',
      stockCantidad: 200.0,
      unidadMedida: 'kg',
      estado: true
    }
  });

  // Registros de alimentación inicial
  await prisma.alimentacion.create({
    data: {
      cantidad: 15.5,
      fecha: new Date(),
      animal: { connect: { id: padre.id } },
      alimento: { connect: { id: pasto.id } }
    }
  });

  await prisma.alimentacion.create({
    data: {
      cantidad: 12.0,
      fecha: new Date(),
      animal: { connect: { id: madre.id } },
      alimento: { connect: { id: pasto.id } }
    }
  });

  await prisma.alimentacion.create({
    data: {
      cantidad: 2.5,
      fecha: new Date(),
      animal: { connect: { id: padre.id } },
      alimento: { connect: { id: concentrado.id } }
    }
  });


  // Logic for initial users moved to top for clarity.

  // 9. Sales (Phase 6)
  const cliente = await prisma.cliente.create({
    data: {
      nombre: 'Ganadería Los Olivos S.A.',
      telefono: '123-456-7890',
      direccion: 'Km 25 Vía al Llano',
      estado: true
    }
  });

  // Una venta de prueba (Vendiendo al Toro Zeus)
  await prisma.venta.create({
    data: {
      total: 3500.0,
      cliente: { connect: { id: cliente.id } },
      detalles: {
        create: [
          {
            cantidad: 1,
            precio: 3500.0,
            subtotal: 3500.0,
            animal: { connect: { id: padre.id } }
          }
        ]
      }
    }
  });

  // Actualizar estado del animal vendido (en la vida real lo haría el repositorio, 
  // pero lo repetimos aquí por consistencia si el seed se corre directamente)
  await prisma.animal.update({
    where: { id: padre.id },
    data: { vendido: true, estado: false }
  });


  // 10. Purchases (Phase 7)
  const proveedor = await prisma.proveedor.create({
    data: {
      nombre: 'AgroTodo Ltda.',
      telefono: '555-0199',
      direccion: 'Central de Abastos Local 12',
      estado: true
    }
  });

  // Compra de prueba (Aumentando stock de Alimento y Medicamento)
  await prisma.compra.create({
    data: {
      total: 1200.0,
      proveedor: { connect: { id: proveedor.id } },
      detalles: {
        create: [
          {
            cantidad: 100,
            precio: 10.0,
            subtotal: 1000.0,
            alimento: { connect: { id: pasto.id } }
          },
          {
            cantidad: 2,
            precio: 100.0,
            subtotal: 200.0,
            medicamento: { connect: { id: penicilina.id } }
          }
        ]
      }
    }
  });

  // Aumentar stock manualmente en el seed para consistencia 
  await prisma.alimento.update({
    where: { id: pasto.id },
    data: { stockCantidad: { increment: 100 } }
  });

  await prisma.medicamento.update({
    where: { id: penicilina.id },
    data: { stockCantidad: { increment: 2 } }
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
