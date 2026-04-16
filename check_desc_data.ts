import { supabase } from './src/lib/supabase';

async function checkDesc() {
  const { data, error } = await supabase.from('classes').select('*').limit(5);
  if (error) {
    console.error('Error fetching description:', error.message);
  } else {
    data.forEach(d => console.log('ID:', d.id, 'Desc:', d.description));
  }
}
checkDesc();
