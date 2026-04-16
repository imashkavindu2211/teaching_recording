import { supabase } from './src/lib/supabase';

async function checkDesc() {
  const { data, error } = await supabase.from('classes').select('description').limit(1);
  if (error) {
    console.error('Error fetching description column:', error.message);
  } else {
    console.log('Success!', data);
  }
}
checkDesc();
