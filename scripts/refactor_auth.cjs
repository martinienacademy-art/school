const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../backend/controllers/authController.js');
let content = fs.readFileSync(file, 'utf-8');

// 1. parentRegister
content = content.replace(/from\(`profiles_\$\{school_slug\}`\)/g, "from('profiles')");
content = content.replace(
    /\.from\('profiles'\)\n\s*\.select\('id'\)\n\s*\.or/g,
    ".from('profiles')\n            .select('id')\n            .eq('school_slug', school_slug)\n            .or"
);
content = content.replace(
    /\.from\('profiles'\)\n\s*\.insert\(\{/g,
    ".from('profiles')\n            .insert({\n                school_slug: school_slug,"
);

// 2. teacherRegister
content = content.replace(
    /\.from\('profiles'\)\n\s*\.select\('id'\)\n\s*\.eq\('email', cleanEmail\)/g,
    ".from('profiles')\n            .select('id')\n            .eq('school_slug', school_slug)\n            .eq('email', cleanEmail)"
);

// 3. Login
content = content.replace(/from\(`profiles_\$\{schoolSlug\}`\)/g, "from('profiles')");
content = content.replace(
    /\.from\('profiles'\)\n\s*\.select\('\*'\)\n\s*\.or/g,
    ".from('profiles')\n            .select('*')\n            .eq('school_slug', schoolSlug)\n            .or"
);
content = content.replace(
    /supabase\.from\('profiles'\)\.update\(\{ last_login: new Date\(\)\.toISOString\(\) \}\)\.eq\('id', user\.id\)/g,
    "supabase.from('profiles').update({ last_login: new Date().toISOString() }).eq('school_slug', schoolSlug).eq('id', user.id)"
);

// 4. deleteSelfAccount
content = content.replace(
    /\.from\('profiles'\)\n\s*\.delete\(\)\n\s*\.eq\('id', id\)/g,
    ".from('profiles')\n            .delete()\n            .eq('school_slug', schoolSlug)\n            .eq('id', id)"
);

// 5. forgotPassword
content = content.replace(
    /let \{ data: staff \} = await supabase\.from\('profiles'\)\.select\('id, email, nom'\)\.eq\('email', email\)\.single\(\);/g,
    "let { data: staff } = await supabase.from('profiles').select('id, email, nom').eq('school_slug', schoolSlug).eq('email', email).single();"
);

// 6. registerSchool (Remove create_school_tables)
content = content.replace(
    /const \{ error: rpcErr \} = await supabase\.rpc\('create_school_tables', \{ school_slug: cleanSlug \}\);\n\s*if \(rpcErr\) console\.warn\('Warning create_school_tables:', rpcErr\.message\);\n\n\s*await new Promise\(r => setTimeout\(r, 1000\)\);/g,
    "// RPC create_school_tables removed - using unified schema"
);

content = content.replace(/from\(`profiles_\$\{cleanSlug\}`\)/g, "from('profiles')");
content = content.replace(
    /\.from\('profiles'\)\n\s*\.insert\(adminPayload\)/g,
    ".from('profiles')\n            .insert({ ...adminPayload, school_slug: cleanSlug })"
);

content = content.replace(/from\(`app_settings_\$\{cleanSlug\}`\)/g, "from('app_settings')");
content = content.replace(
    /\.from\('app_settings'\)\.upsert\(\{/g,
    ".from('app_settings').upsert({\n                school_slug: cleanSlug,"
);

fs.writeFileSync(file, content);
console.log('authController.js updated');
