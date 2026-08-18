require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: sa, error } = await supabaseAdmin.from('superadmins').select('*');
  console.log("Superadmins:", sa);
  console.log("Error:", error);
  process.exit(0);
}

check();
