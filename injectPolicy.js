import fs from 'fs';

const appPath = 'src/App.jsx';
let appCode = fs.readFileSync(appPath, 'utf8');

const chunk = fs.readFileSync('policyChunk2.txt', 'utf8');

const target = `{editSiteTab === 'policy' && (
              <div>
                
              </div>
            )}`;

if (!appCode.includes(target)) {
  console.log("Could not find target block in App.jsx");
} else {
  const replacement = `{editSiteTab === 'policy' && (
              <div>
                ${chunk}
              </div>
            )}`;
  appCode = appCode.replace(target, replacement);
  fs.writeFileSync(appPath, appCode, 'utf8');
  console.log("Successfully injected policy chunk!");
}
