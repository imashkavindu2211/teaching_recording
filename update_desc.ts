import { supabase } from './src/lib/supabase';

async function updateDesc() {
  const { data, error } = await supabase.from('classes').update({ description: 'Testing the description visible on UI' }).eq('id', '1773780928866').select();
  if (error) {
    console.error('Error updating description:', error.message);
  } else {
    console.log('Update success!', data);
  }
}
updateDesc();
