import { Pool } from 'pg';
import { config } from 'dotenv';
import { RESETEADORES_DATA, ReseteadorItem } from '../modules/seed/reseteadores-data';

// Cargar variables de entorno
config();

export { RESETEADORES_DATA };
export type { ReseteadorItem };

interface CliOptions {
  dryRun: boolean;
  limit: number;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    dryRun: false,
    limit: 0,
  };

  for (const arg of args) {
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1], 10) || 0;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Uso: node dist/scripts/seed-reseteadores-digitales.js [opciones]

Opciones:
  --dry-run       Modo prueba: simula sin escribir en la base de datos.
  --limit=N       Limita la cantidad de ítems a procesar (ej: --limit=10).
  --help          Muestra este mensaje.
      `);
      process.exit(0);
    }
  }

  return options;
}

async function main() {
  const options = parseArgs();
  console.log('====================================================');
  console.log('🛠️  SEED DE RESETEADORES DIGITALES (69 PRODUCTOS)');
  console.log('   Categoría destino: Reseteadores digitales');
  console.log('====================================================');
  console.log(`Modo: ${options.dryRun ? 'DRY-RUN (Simulación)' : 'REAL (Escritura en BD)'}`);
  if (options.limit > 0) console.log(`Límite: ${options.limit} productos`);
  console.log('----------------------------------------------------');

  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'TintasDB',
  });

  const auditUserId =
    process.env.SYSTEM_AUDIT_USER_ID || '00000000-0000-4000-8000-000000000001';

  const client = await pool.connect();

  try {
    if (!options.dryRun) {
      await client.query('BEGIN');
    }

    // 1. Crear o actualizar categoría
    console.log('📁 1. Configurando categoría "Reseteadores digitales"...');
    if (!options.dryRun) {
      await client.query(
        `INSERT INTO category (id, name, description, icon, color, is_active, display_order, created_by)
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, true, 5, $5)
         ON CONFLICT (name) DO UPDATE SET
           description = EXCLUDED.description,
           icon = EXCLUDED.icon,
           color = EXCLUDED.color,
           is_active = true,
           display_order = 5,
           updated_at = NOW(),
           updated_by = $5`,
        [
          'Reseteadores digitales',
          'Software y programas de ajuste (Adjustment Program) para reseteo de almohadillas Epson y Canon.',
          'Cajas reset y chips',
          'sky',
          auditUserId,
        ],
      );
    }
    console.log('✅ Categoría verificada / actualizada con éxito.\n');

    // 2. Procesar suministros
    const targetItems =
      options.limit > 0 ? RESETEADORES_DATA.slice(0, options.limit) : RESETEADORES_DATA;

    console.log(`📦 2. Insertando/Actualizando ${targetItems.length} productos...`);
    let insertedOrUpdated = 0;

    for (let i = 0; i < targetItems.length; i++) {
      const item = targetItems[i];
      const prefix = `[${i + 1}/${targetItems.length}]`;

      if (options.dryRun) {
        console.log(`${prefix} [DRY-RUN] ${item.code}: ${item.name} (Bs ${item.sale_price})`);
        insertedOrUpdated++;
        continue;
      }

      await client.query(
        `INSERT INTO supply (
           id, code, name, category, unit_of_measure, images, is_active,
           sale_price, brand, compatibility, commercial_description, created_by
         ) VALUES (
           uuid_generate_v4(), $1, $2, $3, $4, $5, true, $6, $7, $8, $9, $10
         )
         ON CONFLICT (code) DO UPDATE SET
           name = EXCLUDED.name,
           category = EXCLUDED.category,
           unit_of_measure = EXCLUDED.unit_of_measure,
           images = EXCLUDED.images,
           is_active = true,
           sale_price = EXCLUDED.sale_price,
           brand = EXCLUDED.brand,
           compatibility = EXCLUDED.compatibility,
           commercial_description = EXCLUDED.commercial_description,
           deleted_at = NULL,
           updated_at = NOW(),
           updated_by = $10`,
        [
          item.code,
          item.name,
          item.category,
          item.unit_of_measure,
          item.images,
          item.sale_price,
          item.brand,
          item.compatibility,
          item.commercial_description,
          auditUserId,
        ],
      );

      console.log(`${prefix} OK: ${item.code} - ${item.name}`);
      insertedOrUpdated++;
    }

    // 3. Asignar inventario en todas las sucursales activas
    console.log('\n🏢 3. Asignando stock en inventario para sucursales activas...');
    if (!options.dryRun) {
      const invRes = await client.query(
        `INSERT INTO inventory (id, branch_id, supply_id, current_quantity, minimum_stock, created_by)
         SELECT
           uuid_generate_v4(),
           b.id AS branch_id,
           s.id AS supply_id,
           100 AS current_quantity,
           0 AS minimum_stock,
           $1 AS created_by
         FROM branch b
         CROSS JOIN supply s
         WHERE b.deleted_at IS NULL
           AND s.category = 'Reseteadores digitales'
           AND s.deleted_at IS NULL
         ON CONFLICT (branch_id, supply_id) DO UPDATE SET
           current_quantity = 100,
           minimum_stock = 0,
           updated_at = NOW(),
           updated_by = $1`,
        [auditUserId],
      );
      console.log(`✅ Inventario actualizado (${invRes.rowCount} registros afectados).`);
      await client.query('COMMIT');
    } else {
      console.log('ℹ️ [DRY-RUN] No se modificó el inventario.');
    }

    console.log('\n====================================================');
    console.log(`🎉 Proceso completado exitosamente: ${insertedOrUpdated} productos procesados.`);
    console.log('====================================================');
  } catch (err: any) {
    if (!options.dryRun) {
      await client.query('ROLLBACK');
    }
    console.error('❌ Error ejecutando seed de reseteadores:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
