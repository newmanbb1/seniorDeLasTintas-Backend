import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';
import { config } from 'dotenv';

// Cargar variables de entorno si existe .env
config();

interface CliOptions {
  limit: number;
  delay: number;
  dryRun: boolean;
  code?: string;
  category?: string;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    limit: 0, // 0 = sin límite (todos los pendientes)
    delay: 1000, // 1s entre búsquedas
    dryRun: false,
  };

  for (const arg of args) {
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1], 10) || 0;
    } else if (arg.startsWith('--delay=')) {
      options.delay = parseInt(arg.split('=')[1], 10) || 1000;
    } else if (arg.startsWith('--code=')) {
      options.code = arg.split('=')[1];
    } else if (arg.startsWith('--category=')) {
      options.category = arg.split('=')[1];
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Uso: node dist/scripts/fetch-supply-images.js [opciones]

Opciones:
  --limit=N       Limita la cantidad de productos a procesar (ej: --limit=10). 0 = todos.
  --dry-run       Modo prueba: busca imágenes pero NO descarga ni modifica la BD.
  --delay=MS      Milisegundos de pausa entre búsquedas (por defecto: 1000).
  --code=CODE     Procesa solo un producto específico por su código (ej: --code=ST-0005).
  --category=CAT  Procesa solo productos de una categoría específica.
  --help          Muestra esta ayuda.
      `);
      process.exit(0);
    }
  }

  return options;
}

function resolveUploadsDir(): string {
  const containerPath = '/app/uploads/images/supplies';
  const localPath = path.resolve(process.cwd(), 'uploads/images/supplies');

  if (fs.existsSync('/app/uploads')) {
    if (!fs.existsSync(containerPath)) {
      fs.mkdirSync(containerPath, { recursive: true });
    }
    return containerPath;
  }

  if (!fs.existsSync(localPath)) {
    fs.mkdirSync(localPath, { recursive: true });
  }
  return localPath;
}

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

async function searchBing(query: string): Promise<string[]> {
  try {
    const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&first=1&scenario=ImageBasicHover`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': BROWSER_UA,
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(9000),
    });

    if (!res.ok) return [];

    const html = await res.text();
    const murls = [
      ...html.matchAll(/(?:&quot;|")murl(?:&quot;|")\s*:\s*(?:&quot;|")([^"&]+)/g),
    ].map((m) => m[1]);
    const turls = [
      ...html.matchAll(/(?:&quot;|")turl(?:&quot;|")\s*:\s*(?:&quot;|")([^"&]+)/g),
    ].map((m) => m[1]);

    const candidates: string[] = [];
    const max = Math.max(murls.length, turls.length);
    for (let i = 0; i < Math.min(max, 6); i++) {
      if (murls[i]) candidates.push(murls[i]);
      if (turls[i]) candidates.push(turls[i]);
    }
    return candidates;
  } catch {
    return [];
  }
}

async function searchDuckDuckGo(query: string): Promise<string[]> {
  try {
    const url = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&t=h_&iar=images&iax=images&ia=images`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': BROWSER_UA,
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(9000),
    });
    const text = await res.text();
    const match =
      text.match(/vqd=([0-9-]+)/) || text.match(/vqd=["']([0-9-]+)["']/);
    if (!match) return [];

    const vqd = match[1];
    const apiUrl = `https://duckduckgo.com/i.js?l=wt-wt&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,&p=1`;
    const imgRes = await fetch(apiUrl, {
      headers: {
        'User-Agent': BROWSER_UA,
        Referer: 'https://duckduckgo.com/',
      },
      signal: AbortSignal.timeout(9000),
    });
    if (!imgRes.ok) return [];
    const data = (await imgRes.json()) as {
      results?: Array<{ image: string; thumbnail: string }>;
    };
    if (!data.results || !Array.isArray(data.results)) return [];
    return data.results.map((r) => r.image || r.thumbnail).filter(Boolean);
  } catch {
    return [];
  }
}

async function findCandidatesForQuery(query: string): Promise<{ candidates: string[]; engine: string }> {
  // 1. Motor principal: Bing (robusto, no bloquea IPs de centros de datos, CDN Microsoft ultra rápido)
  const bingResults = await searchBing(query);
  if (bingResults.length > 0) {
    return { candidates: bingResults, engine: 'Bing' };
  }

  // 2. Fallback: DuckDuckGo
  const ddgResults = await searchDuckDuckGo(query);
  if (ddgResults.length > 0) {
    return { candidates: ddgResults, engine: 'DuckDuckGo' };
  }

  return { candidates: [], engine: 'None' };
}

async function downloadValidImage(
  candidateUrls: string[],
  destDir: string,
  baseFilename: string,
): Promise<{ filename: string; size: number } | null> {
  for (const url of candidateUrls.slice(0, 8)) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(url, {
        headers: {
          'User-Agent': BROWSER_UA,
          Accept:
            'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) continue;

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.startsWith('image/')) continue;

      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Descartar imágenes demasiado pequeñas (< 3 KB suele ser icono) o gigantes (> 8 MB)
      if (buffer.length < 3000 || buffer.length > 8 * 1024 * 1024) continue;

      let ext = 'jpg';
      if (contentType.includes('png')) ext = 'png';
      else if (contentType.includes('webp')) ext = 'webp';
      else if (contentType.includes('jpeg')) ext = 'jpg';

      const filename = `${baseFilename}.${ext}`;
      const fullPath = path.join(destDir, filename);
      fs.writeFileSync(fullPath, buffer);
      return { filename, size: buffer.length };
    } catch {
      continue;
    }
  }

  return null;
}

function cleanQuery(name: string, brand?: string): string {
  let q = name
    .replace(/[&/\\#,+()$~%.'":*?<>{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (brand && brand !== 'Genérico' && !q.toLowerCase().includes(brand.toLowerCase())) {
    q = `${q} ${brand}`;
  }
  return q;
}

function simplifyQuery(name: string): string {
  // Quita palabras genéricas para una segunda búsqueda si la primera no devuelve resultados
  return name
    .replace(/\b(original|compatible|nuevo|remplazo|pack|juego|unidad|para|de|del|en)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const options = parseArgs();
  console.log('====================================================');
  console.log('🔎 SCRIPT DE ASIGNACIÓN AUTOMÁTICA DE IMÁGENES');
  console.log('   (Motor dual: Bing Images + DuckDuckGo con CDN)');
  console.log('====================================================');
  console.log(`Modo Dry-Run (sin escribir): ${options.dryRun ? 'SÍ (simulación)' : 'NO (escribirá cambios)'}`);
  console.log(`Límite de productos: ${options.limit > 0 ? options.limit : 'Sin límite (todos los pendientes)'}`);
  console.log(`Delay entre peticiones: ${options.delay}ms`);
  if (options.code) console.log(`Filtro por código: ${options.code}`);
  if (options.category) console.log(`Filtro por categoría: ${options.category}`);
  console.log('----------------------------------------------------');

  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'TintasDB',
  });

  const uploadsDir = resolveUploadsDir();
  console.log(`Directorio de destino de imágenes: ${uploadsDir}\n`);

  try {
    // 1. Consultar ÚNICAMENTE productos que NO tengan imágenes (images es NULL o array vacío)
    let query = `
      SELECT id, code, name, brand, category, images
      FROM supply
      WHERE (images IS NULL OR cardinality(images) = 0 OR images = '{}')
    `;
    const params: any[] = [];

    if (options.code) {
      params.push(options.code);
      query += ` AND code = $${params.length}`;
    }

    if (options.category) {
      params.push(options.category);
      query += ` AND category ILIKE $${params.length}`;
    }

    query += ` ORDER BY code ASC`;

    if (options.limit > 0) {
      params.push(options.limit);
      query += ` LIMIT $${params.length}`;
    }

    const { rows: supplies } = await pool.query(query, params);

    if (supplies.length === 0) {
      console.log('✨ No hay productos pendientes sin imagen con los filtros indicados.');
      await pool.end();
      return;
    }

    console.log(`📦 Se encontraron ${supplies.length} productos sin imagen para procesar.\n`);

    let updatedCount = 0;
    let notFoundCount = 0;
    let failedCount = 0;

    for (let i = 0; i < supplies.length; i++) {
      const supply = supplies[i];
      const indexStr = `[${i + 1}/${supplies.length}]`;
      const codeStr = supply.code || supply.id.slice(0, 8);
      let searchQuery = cleanQuery(supply.name, supply.brand);

      process.stdout.write(`${indexStr} ${codeStr}: "${supply.name}" `);

      let { candidates, engine } = await findCandidatesForQuery(searchQuery);

      // Si no encuentra nada, probar con consulta simplificada
      if (candidates.length === 0) {
        const altQuery = simplifyQuery(searchQuery);
        if (altQuery !== searchQuery && altQuery.length > 3) {
          const retry = await findCandidatesForQuery(altQuery);
          candidates = retry.candidates;
          engine = retry.engine;
        }
      }

      if (candidates.length === 0) {
        console.log(`-> ⚠️ Sin resultados en Bing ni DDG.`);
        notFoundCount++;
        await sleep(options.delay);
        continue;
      }

      if (options.dryRun) {
        console.log(`-> 🔎 [DRY-RUN / ${engine}] Encontrada: ${candidates[0].slice(0, 65)}...`);
        updatedCount++;
        await sleep(options.delay);
        continue;
      }

      const slug = (supply.code || 'item')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '_');
      const baseFilename = `${slug}-${Date.now()}`;

      const downloadResult = await downloadValidImage(
        candidates,
        uploadsDir,
        baseFilename,
      );

      if (!downloadResult) {
        console.log(`-> ❌ Falló la descarga de los candidatos (${engine}).`);
        failedCount++;
      } else {
        // ACTUALIZAR ÚNICAMENTE LA COLUMNA images, DEJANDO TODO LO DEMÁS INTACTO
        await pool.query(
          `UPDATE supply SET images = $1, updated_at = NOW() WHERE id = $2`,
          [[downloadResult.filename], supply.id],
        );
        const kbSize = (downloadResult.size / 1024).toFixed(1);
        console.log(`-> ✅ [${engine}] Guardado: ${downloadResult.filename} (${kbSize} KB)`);
        updatedCount++;
      }

      if (i < supplies.length - 1) {
        await sleep(options.delay);
      }
    }

    console.log('\n====================================================');
    console.log('📊 RESUMEN FINAL DEL PROCESO');
    console.log('====================================================');
    console.log(`Total productos procesados: ${supplies.length}`);
    console.log(`Imágenes asignadas exitosamente: ${updatedCount}`);
    console.log(`Productos sin imagen en la web: ${notFoundCount}`);
    console.log(`Descargas fallidas: ${failedCount}`);
    console.log('====================================================\n');
  } catch (err: any) {
    console.error('❌ Error crítico en ejecución:', err.message || err);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
