const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('./src');
files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    let changed = false;
    
    // Check for remaining imports
    if (content.includes('data/classConfig')) {
        content = content.replace(/import\s+\{([^}]+)\}\s+from\s+['\"].*?data\/classConfig['\"];?/g, (match, imports) => {
            return "import { useStore } from '../store/useStore';";
        });
        changed = true;
    }
    
    // We already fixed some, so only do it if the file was modified or if it still has usages without importing data/classConfig
    // Actually, some files might already have useStore imported. If so, importing it again might cause a duplicate import error.
    // So let's be careful.
});
