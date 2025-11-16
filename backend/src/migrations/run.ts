import pool from '../config/database';
import fs from 'fs';
import path from 'path';

async function runMigrations() {
  try {
    console.log('🔄 Running migrations on Supabase...');
    
    // Verificar conexión
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to Supabase database');
    
    const migrationFile = path.join(__dirname, '001_create_tables.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    // Ejecutar migración
    await pool.query(sql);
    
    console.log('✅ Migrations completed successfully');
    console.log('📊 Tables created: users, creator_tokens, subscriptions, user_settings');
    console.log('💡 You can verify in Supabase Dashboard → Table Editor');
    
    await pool.end();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Migration error:', error.message);
    if (error.code === '42P07') {
      console.log('ℹ️  Tables already exist. This is OK.');
      process.exit(0);
    } else {
      console.error('Full error:', error);
      process.exit(1);
    }
  }
}

runMigrations();

