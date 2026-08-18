require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function cleanDB() {
  console.log("Fetching superadmins...");
  const { data: sa, error } = await supabaseAdmin
    .from('superadmins')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error fetching superadmins:", error);
  } else {
    console.log("Superadmins schema:", sa.length > 0 ? Object.keys(sa[0]) : "No superadmins found, but query succeeded");
    console.log("Superadmins data:", sa);
  }
}

cleanDB();
