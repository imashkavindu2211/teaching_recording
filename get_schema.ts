import { supabase } from './src/lib/supabase';

async function getSchema() {
  const { data, error } = await supabase.from('classes').select('*').limit(1);
  if (error) {
    console.error('Error fetching data:', error.message);
  } else {
    console.log('Class keys:', Object.keys(data[0] || {}));
  }
}
getSchema();
