/**
 * Script para aplicar migrations do Supabase
 * Uso: node scripts/apply-migration.js 007_fix_infinite_recursion.sql
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Erro: SUPABASE_URL e SUPABASE_SERVICE_KEY devem estar definidas');
  console.error('   Certifique-se de que o arquivo .env.local está configurado corretamente');
  process.exit(1);
}

// Criar cliente Supabase com service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function applyMigration(migrationFile) {
  try {
    console.log(`📦 Aplicando migration: ${migrationFile}\n`);

    // Ler arquivo SQL
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', migrationFile);
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Conteúdo da migration:');
    console.log('─'.repeat(80));
    console.log(sql.substring(0, 500) + '...\n');
    console.log('─'.repeat(80));

    // Executar SQL
    console.log('\n🚀 Executando SQL...\n');
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Se o RPC não existe, tentar executar diretamente
      if (error.code === '42883') {
        console.log('⚠️  RPC exec_sql não encontrado, tentando executar via query...\n');

        // Dividir SQL em statements (separados por ;)
        const statements = sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
          if (statement.length === 0) continue;

          console.log(`Executando: ${statement.substring(0, 60)}...`);
          const { error: stmtError } = await supabase.rpc('exec', { query: statement });

          if (stmtError) {
            // Tentar via query direta
            const pool = await import('pg').then(m => m.Pool);
            const pgClient = new pool.default({
              connectionString: SUPABASE_URL.replace('https://', 'postgresql://postgres:') + '/postgres'
            });

            await pgClient.query(statement);
            await pgClient.end();
          }
        }
      } else {
        throw error;
      }
    }

    console.log('\n✅ Migration aplicada com sucesso!\n');

  } catch (error) {
    console.error('\n❌ Erro ao aplicar migration:');
    console.error(error);
    process.exit(1);
  }
}

// Executar
const migrationFile = process.argv[2] || '007_fix_infinite_recursion.sql';
applyMigration(migrationFile);
