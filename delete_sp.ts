
import { supabase } from './src/lib/supabase';

async function checkMonths() {
  const { data, error } = await supabase.from('months').select('*');
  if (error) {
    console.error('Error fetching months:', error);
  } else {
    const systemProtocol = data?.find(m => m.name.includes('SYSTEM_PROTOCOL') || m.id === 'SYSTEM_PROTOCOL');
    if (systemProtocol) {
      console.log('Found SYSTEM_PROTOCOL month:', systemProtocol);
      // Delete it if asked
      const { error: delError } = await supabase.from('months').delete().eq('id', systemProtocol.id);
      if (delError) console.error('Error deleting:', delError);
      else console.log('Deleted successfully.');
    } else {
      console.log('Not found in DB.');
    }
  }
}

checkMonths();
