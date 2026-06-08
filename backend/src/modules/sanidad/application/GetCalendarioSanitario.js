class GetCalendarioSanitario {
  constructor(sanidadRepository) {
    this.sanidadRepository = sanidadRepository;
  }

  async execute(filters) {
    // 1. Validaciones básicas de fechas si existen
    if (filters.desde && isNaN(new Date(filters.desde).getTime())) {
      throw new Error('La fecha "desde" no es válida');
    }
    if (filters.hasta && isNaN(new Date(filters.hasta).getTime())) {
      throw new Error('La fecha "hasta" no es válida');
    }
    if (filters.desde && filters.hasta) {
      if (new Date(filters.hasta) < new Date(filters.desde)) {
        throw new Error('La fecha "hasta" no puede ser menor que "desde"');
      }
    }

    // 2. Traer los datos del repositorio
    const aplicaciones = await this.sanidadRepository.findCalendarioSanitario(filters);

    // 3. Procesar estados y calcular días
    const hoyStr = new Date().toISOString().split('T')[0];
    const hoyDate = new Date(hoyStr);

    let resultados = aplicaciones.map(ap => {
      const fechaSiguienteDate = new Date(ap.fechaSiguiente);
      const fechaSiguienteStr = fechaSiguienteDate.toISOString().split('T')[0];
      
      let estadoCalendario = 'PROXIMO';
      if (fechaSiguienteStr < hoyStr) {
        estadoCalendario = 'VENCIDO';
      } else if (fechaSiguienteStr === hoyStr) {
        estadoCalendario = 'HOY';
      }

      // Calcular diferencia en días exactos usando las fechas a medianoche
      const diffTime = Math.abs(fechaSiguienteDate - hoyDate);
      let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (fechaSiguienteStr < hoyStr) diffDays = -diffDays;

      return {
        id: ap.id,
        fechaAplicacion: ap.fecha ? new Date(ap.fecha).toISOString().split('T')[0] : null,
        fechaSiguiente: fechaSiguienteStr,
        estadoCalendario,
        diasRestantes: diffDays,
        dosis: ap.dosis,
        cantidad: ap.cantidad,
        medicamento: {
          id: ap.medicamento.id,
          nombre: ap.medicamento.nombre,
          unidadMedida: ap.medicamento.unidadMedida,
          fechaVencimiento: ap.medicamento.fechaVencimiento ? new Date(ap.medicamento.fechaVencimiento).toISOString().split('T')[0] : null
        },
        animal: {
          id: ap.tratamiento.animal.id,
          nombre: ap.tratamiento.animal.nombre,
          nroArete: ap.tratamiento.animal.nroArete,
          sexo: ap.tratamiento.animal.sexo
        },
        tratamiento: {
          id: ap.tratamiento.id,
          descripcion: ap.tratamiento.descripcion,
          tipo: ap.tratamiento.tipo,
          fechaInicio: ap.tratamiento.fechaInicio ? new Date(ap.tratamiento.fechaInicio).toISOString().split('T')[0] : null,
          fechaFin: ap.tratamiento.fechaFin ? new Date(ap.tratamiento.fechaFin).toISOString().split('T')[0] : null,
          estado: ap.tratamiento.estado
        },
        veterinario: {
          id: ap.tratamiento.veterinario.id,
          nombre: ap.tratamiento.veterinario.nombre
        }
      };
    });

    // 4. Filtrar por estado si se solicitó (VENCIDO, HOY, PROXIMO)
    const estadoFiltro = filters.estado ? filters.estado.toUpperCase() : 'TODOS';
    if (['VENCIDO', 'HOY', 'PROXIMO'].includes(estadoFiltro)) {
      resultados = resultados.filter(r => r.estadoCalendario === estadoFiltro);
    }

    return resultados;
  }
}

module.exports = GetCalendarioSanitario;
