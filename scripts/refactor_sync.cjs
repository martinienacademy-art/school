const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../backend/controllers/syncController.js');
let content = fs.readFileSync(file, 'utf-8');

// 1. Update tbl function
content = content.replace(
    /const tbl = \(name\) => `\$\{name\}_\$\{schoolSlug\}`;/g,
    "const tbl = (name) => name;"
);

// 2. Update .delete() calls to include .eq('school_slug', schoolSlug)
// Match: .delete().neq(
// Replace: .delete().eq('school_slug', req.user.schoolSlug || schoolSlug).neq(
content = content.replace(
    /\.delete\(\)\.neq\(/g,
    ".delete().eq('school_slug', schoolSlug).neq("
);

// Match: .delete().eq(
// Replace: .delete().eq('school_slug', req.user.schoolSlug || schoolSlug).eq(
content = content.replace(
    /\.delete\(\)\.eq\(/g,
    ".delete().eq('school_slug', schoolSlug).eq("
);

// 3. Update select() calls to include .eq('school_slug', schoolSlug)
// Match: let q = supabase.from(tbl(name)).select('*');
content = content.replace(
    /let q = supabase\.from\(tbl\(name\)\)\.select\('\*'\);/g,
    "let q = supabase.from(tbl(name)).select('*').eq('school_slug', schoolSlug);"
);

// Match: .select('id').in('id',
content = content.replace(
    /\.select\('id'\)\.in\('id',/g,
    ".select('id').eq('school_slug', schoolSlug).in('id',"
);

// Match: .select('parent_id').eq('student_id',
content = content.replace(
    /\.select\('parent_id'\)\.eq\('student_id',/g,
    ".select('parent_id').eq('school_slug', schoolSlug).eq('student_id',"
);

// Match: .select('\*').single\(\) for app_settings
content = content.replace(
    /\.from\(tbl\('app_settings'\)\)\.select\('\*'\)\.single\(\)/g,
    ".from(tbl('app_settings')).select('*').eq('school_slug', schoolSlug).single()"
);

// 4. Upsert/Insert mapping - adding school_slug
// We will find lines with `id:` right after `map(x => ({` and insert school_slug
content = content.replace(
    /id: /g,
    "school_slug: schoolSlug, id: "
);

// Ensure that we didn't break object spreads or specific cases:
// In syncController, there are `.upsert({ id: 1, nom_ecole: ... })`
content = content.replace(
    /upsert\(\{[\n\s]+school_slug: schoolSlug, id: 1,/g,
    "upsert({\n                    school_slug: schoolSlug,\n                    id: 1,"
);

// Fix remaining occurrences of dynamic tables hardcoded
content = content.replace(/from\(`presences_\$\{req\.user\.schoolSlug\}`\)/g, "from('presences')");
content = content.replace(/from\(`activity_logs_\$\{req\.user\.schoolSlug\}`\)/g, "from('activity_logs')");
content = content.replace(/from\(`\$\{table\}_\$\{schoolSlug\}`\)/g, "from(table)");
content = content.replace(/from\(`matieres_\$\{req\.user\.schoolSlug\}`\)/g, "from('matieres')");
content = content.replace(/from\(`classe_matieres_\$\{req\.user\.schoolSlug\}`\)/g, "from('classe_matieres')");
content = content.replace(/from\(`notes_\$\{req\.user\.schoolSlug\}`\)/g, "from('notes')");
content = content.replace(/from\(`parent_student_\$\{req\.user\.schoolSlug\}`\)/g, "from('parent_student')");
content = content.replace(/from\(`payments_\$\{req\.user\.schoolSlug\}`\)/g, "from('payments')");
content = content.replace(/from\(`students_\$\{req\.user\.schoolSlug\}`\)/g, "from('students')");
content = content.replace(/from\(`salles_\$\{req\.user\.schoolSlug\}`\)/g, "from('salles')");

// Delete queries using req.user.schoolSlug
content = content.replace(
    /req\.user\.schoolSlug\).eq\(/g,
    "req.user.schoolSlug).eq('school_slug', req.user.schoolSlug).eq("
);
content = content.replace(
    /req\.user\.schoolSlug\).neq\(/g,
    "req.user.schoolSlug).eq('school_slug', req.user.schoolSlug).neq("
);
// Above replace might be broken due to from('table').eq... Wait.
// Let's do it safer:
content = content.replace(
    /from\('([a-z_]+)'\)\.delete\(\)\.eq\(/g,
    "from('$1').delete().eq('school_slug', req.user.schoolSlug || schoolSlug).eq("
);
content = content.replace(
    /from\('([a-z_]+)'\)\.delete\(\)\.neq\(/g,
    "from('$1').delete().eq('school_slug', req.user.schoolSlug || schoolSlug).neq("
);

fs.writeFileSync(file, content);
console.log('syncController.js updated');
