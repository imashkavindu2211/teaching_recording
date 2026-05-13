const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const lines = envFile.split('\n');
const env = {};
lines.forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function findTables() {
  const commonTables = ['subaccounts', 'sub_accounts', 'subscriptions', 'subscribers', 'enrollments', 'classes_subscribers'];
  for (const table of commonTables) {
    const { error } = await supabase.from(table).select('*').limit(0);
    if (error && error.hint) {
      console.log(`Table ${table} hint: ${error.hint}`);
    }
  }
}

findTables();
