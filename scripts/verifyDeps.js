const fs = require('fs');
const cp = require('child_process');
function check(folder){
  try{
    const pkg = JSON.parse(fs.readFileSync(folder + '/package.json'));
    const npmLs = JSON.parse(cp.execSync('npm ls --json --depth=0', {cwd: folder}).toString());
    const installed = npmLs.dependencies || {};
    const declared = Object.keys(pkg.dependencies||{});
    const missing = declared.filter(d => !installed[d]);
    return {folder,declared,installed:Object.keys(installed),missing};
  }catch(e){
    return {folder,error:e.message};
  }
}
const root = check(process.cwd());
const backend = check(process.cwd() + '/backend');
console.log(JSON.stringify({root,backend},null,2));
