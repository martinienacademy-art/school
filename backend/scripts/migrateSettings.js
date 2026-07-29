const token = process.env.SUPABASE_TOKEN; // sbp_...
const ref = process.env.SUPABASE_REF;    // ex: xdlsyxxbwvveeozxjuip

async function run() {
  // 1. Get all schools
  const getSchoolsSql = `SELECT slug FROM public.schools;`;
  
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: getSchoolsSql })
  });
  
  const schools = await res.json();
  console.log("Schools found:", schools);
  
  if (!Array.isArray(schools)) {
    console.error("Failed to fetch schools:", schools);
    return;
  }

  // 2. Add column official_header to app_settings_[slug]
  for (const school of schools) {
    const slug = school.slug;
    const alterSql = `
      CREATE TABLE IF NOT EXISTS "public"."app_settings_${slug}" (
        id TEXT PRIMARY KEY,
        app_name TEXT,
        school_name TEXT,
        school_year TEXT,
        school_logo TEXT,
        school_stamp TEXT,
        message_remerciement TEXT,
        message_rappel TEXT,
        official_header TEXT,
        tranches JSONB DEFAULT '[]'::jsonb,
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `;
    
    console.log(`Altering table for ${slug}...`);
    const alterRes = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: alterSql })
    });
    
    const alterText = await alterRes.text();
    console.log(`Status ${alterRes.status}:`, alterText);
  }
}

run().catch(console.error);
