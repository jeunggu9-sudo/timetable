const http = require('http');
const fs = require('fs');

const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/instructors/off-days-template',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  if (res.statusCode === 200) {
    const chunks = [];
    
    res.on('data', (chunk) => {
      chunks.push(chunk);
    });
    
    res.on('end', () => {
      const buffer = Buffer.concat(chunks);
      console.log('Downloaded file size:', buffer.length);
      
      fs.writeFileSync('downloaded-template.xlsx', buffer);
      console.log('File saved as downloaded-template.xlsx');
    });
  } else {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log('Error response:', data);
    });
  }
});

req.on('error', (e) => {
  console.error(`Request error: ${e.message}`);
});

req.end();