-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'EVALUADOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Puesto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo_clase_msc" TEXT,
    "descripcion_funciones" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "reporta_a" TEXT,
    "supervisa_a" TEXT,
    "educacion_requerida" TEXT,
    "experiencia_requerida" TEXT,
    "tipo_jornada" TEXT,
    "condiciones_trabajo" TEXT,
    "es_puesto_clave" BOOLEAN NOT NULL DEFAULT false,
    "estado" TEXT NOT NULL DEFAULT 'borrador',
    "eliminado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_eliminacion" TIMESTAMP(3),
    "fuente_manual_clases" BOOLEAN NOT NULL DEFAULT false,
    "org_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Puesto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluacion" (
    "id" TEXT NOT NULL,
    "puesto_id" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "grado_dificultad" INTEGER NOT NULL,
    "puntos_dificultad" INTEGER NOT NULL,
    "justif_dificultad" TEXT,
    "grado_supervision" INTEGER NOT NULL,
    "puntos_supervision" INTEGER NOT NULL,
    "justif_supervision" TEXT,
    "grado_responsabilidad" INTEGER NOT NULL,
    "puntos_responsabilidad" INTEGER NOT NULL,
    "justif_responsabilidad" TEXT,
    "grado_condiciones" INTEGER NOT NULL,
    "puntos_condiciones" INTEGER NOT NULL,
    "justif_condiciones" TEXT,
    "grado_consecuencia_error" INTEGER NOT NULL,
    "puntos_consecuencia_error" INTEGER NOT NULL,
    "justif_consecuencia_error" TEXT,
    "grado_requisitos" INTEGER NOT NULL,
    "puntos_requisitos" INTEGER NOT NULL,
    "justif_requisitos" TEXT,
    "puntos_totales" INTEGER NOT NULL,
    "evaluador_id" TEXT NOT NULL,
    "aprobado_por" TEXT,
    "fecha_evaluacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_aprobacion" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "estado" TEXT NOT NULL DEFAULT 'borrador',

    CONSTRAINT "Evaluacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EncuestaSalarios" (
    "id" TEXT NOT NULL,
    "puesto_id" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "salario_minimo" DECIMAL(18,2) NOT NULL,
    "salario_promedio" DECIMAL(18,2) NOT NULL,
    "salario_maximo" DECIMAL(18,2) NOT NULL,
    "mediana" DECIMAL(18,2) NOT NULL,
    "moda" DECIMAL(18,2) NOT NULL,
    "fuente" TEXT,
    "fecha_encuesta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EncuestaSalarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValorPunto" (
    "id" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "total_salarios" DECIMAL(18,2) NOT NULL,
    "total_puntos" INTEGER NOT NULL,
    "valor_punto_exacto" DECIMAL(18,2) NOT NULL,
    "valor_punto_aplicado" DECIMAL(18,2) NOT NULL,
    "puestos_clave_usados" INTEGER NOT NULL,
    "calculado_por" TEXT NOT NULL,
    "aprobado_por" TEXT,
    "fecha_vigencia_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_vigencia_fin" TIMESTAMP(3),

    CONSTRAINT "ValorPunto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AsignacionSalario" (
    "id" TEXT NOT NULL,
    "puesto_id" TEXT NOT NULL,
    "evaluacion_id" TEXT NOT NULL,
    "valor_punto_id" TEXT NOT NULL,
    "puntos_totales" INTEGER NOT NULL,
    "salario_calculado" DECIMAL(18,2) NOT NULL,
    "salario_ajustado" DECIMAL(18,2),
    "justif_ajuste" TEXT,
    "salario_minimo_legal" DECIMAL(18,2) NOT NULL,
    "cumple_minimo_legal" BOOLEAN NOT NULL,
    "coherencia_jerarquica" BOOLEAN NOT NULL,
    "alerta" TEXT,
    "partida_presupuestaria" TEXT,
    "periodo" TEXT NOT NULL,
    "fecha_asignacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AsignacionSalario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndiceSalarial" (
    "id" TEXT NOT NULL,
    "puesto_id" TEXT NOT NULL,
    "codigo_clase_msc" TEXT,
    "categoria" TEXT NOT NULL,
    "grado" TEXT,
    "salario_vigente" DECIMAL(18,2) NOT NULL,
    "tipo_indice" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,

    CONSTRAINT "IndiceSalarial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalarioMinimoLegal" (
    "id" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "monto" DECIMAL(18,2) NOT NULL,
    "periodo" TEXT NOT NULL,
    "decreto_mtss" TEXT,
    "fecha_vigencia" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalarioMinimoLegal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NormaLegal" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "articulo" TEXT,
    "resumen" TEXT,
    "url_fuente" TEXT,
    "ambito" TEXT NOT NULL,
    "afecta_modulo" TEXT,
    "fecha_vigencia" TIMESTAMP(3),

    CONSTRAINT "NormaLegal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Auditoria" (
    "id" TEXT NOT NULL,
    "tabla" TEXT NOT NULL,
    "registro_id" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "datos_antes" JSONB,
    "datos_despues" JSONB,
    "usuario_id" TEXT,
    "ip_origen" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegracionERP" (
    "id" TEXT NOT NULL,
    "tipo_evento" TEXT NOT NULL,
    "modulo_destino" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "respuesta_erp" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegracionERP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManualEnriquecido" (
    "id" TEXT NOT NULL,
    "cargo_id" TEXT,
    "nombre_oficial" TEXT,
    "nombre_pdf" TEXT NOT NULL,
    "funciones" JSONB NOT NULL,
    "requisitos_academicos" TEXT,
    "requisitos_experiencia" TEXT,
    "area_sugerida" TEXT,
    "clase_manual" TEXT,
    "estrato" TEXT,
    "version_label" TEXT,
    "fecha_vinculacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManualEnriquecido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManualHistorico" (
    "id" TEXT NOT NULL,
    "version_label" TEXT NOT NULL,
    "fecha_archivo" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_json" JSONB NOT NULL,

    CONSTRAINT "ManualHistorico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogoPuesto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "clase" TEXT NOT NULL,
    "estrato" TEXT NOT NULL,
    "naturaleza" TEXT NOT NULL,
    "cargo_contenido" TEXT NOT NULL,
    "funciones" JSONB NOT NULL,
    "requisitos_academicos" TEXT,
    "requisitos_experiencia" TEXT,
    "requisitos_supervision" TEXT,
    "requisitos_legales" TEXT,
    "conocimientos_deseables" JSONB NOT NULL,
    "condiciones_personales" JSONB NOT NULL,
    "area" TEXT,
    "version" INTEGER NOT NULL,
    "fecha_importacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "es_vigente" BOOLEAN NOT NULL DEFAULT false,
    "reemplazado_por" TEXT,

    CONSTRAINT "CatalogoPuesto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "ManualEnriquecido_cargo_id_idx" ON "ManualEnriquecido"("cargo_id");

-- CreateIndex
CREATE INDEX "CatalogoPuesto_clase_idx" ON "CatalogoPuesto"("clase");

-- CreateIndex
CREATE INDEX "CatalogoPuesto_es_vigente_idx" ON "CatalogoPuesto"("es_vigente");

-- CreateIndex
CREATE INDEX "CatalogoPuesto_version_idx" ON "CatalogoPuesto"("version");

-- CreateIndex
CREATE INDEX "CatalogoPuesto_area_idx" ON "CatalogoPuesto"("area");

-- AddForeignKey
ALTER TABLE "Evaluacion" ADD CONSTRAINT "Evaluacion_puesto_id_fkey" FOREIGN KEY ("puesto_id") REFERENCES "Puesto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluacion" ADD CONSTRAINT "Evaluacion_evaluador_id_fkey" FOREIGN KEY ("evaluador_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluacion" ADD CONSTRAINT "Evaluacion_aprobado_por_fkey" FOREIGN KEY ("aprobado_por") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EncuestaSalarios" ADD CONSTRAINT "EncuestaSalarios_puesto_id_fkey" FOREIGN KEY ("puesto_id") REFERENCES "Puesto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValorPunto" ADD CONSTRAINT "ValorPunto_calculado_por_fkey" FOREIGN KEY ("calculado_por") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValorPunto" ADD CONSTRAINT "ValorPunto_aprobado_por_fkey" FOREIGN KEY ("aprobado_por") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsignacionSalario" ADD CONSTRAINT "AsignacionSalario_puesto_id_fkey" FOREIGN KEY ("puesto_id") REFERENCES "Puesto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsignacionSalario" ADD CONSTRAINT "AsignacionSalario_evaluacion_id_fkey" FOREIGN KEY ("evaluacion_id") REFERENCES "Evaluacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsignacionSalario" ADD CONSTRAINT "AsignacionSalario_valor_punto_id_fkey" FOREIGN KEY ("valor_punto_id") REFERENCES "ValorPunto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndiceSalarial" ADD CONSTRAINT "IndiceSalarial_puesto_id_fkey" FOREIGN KEY ("puesto_id") REFERENCES "Puesto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auditoria" ADD CONSTRAINT "Auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
