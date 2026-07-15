import fs from 'fs';
const content = fs.readFileSync('pristine_app.jsx', 'utf16le');
const startMatch = '{/* Text Content Sections */}';
const startIdx = content.indexOf(startMatch);
if (startIdx === -1) {
  console.log("Not found start");
} else {
  const endMatch = "{currentTab === 'messages'";
  const endIdx = content.indexOf(endMatch, startIdx);
  if (endIdx === -1) {
    console.log("Not found end");
  } else {
    // Exact balanced chunk
    let chunk = content.substring(startIdx, endIdx);
    fs.writeFileSync('policyChunk3.txt', chunk, 'utf8');
    console.log("Done");
  }
}
