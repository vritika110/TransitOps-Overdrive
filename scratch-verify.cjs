const http = require('http');

const request = (options) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    req.end();
  });
};

async function verify() {
  console.log("1. Testing /api/state with Logistics Client");
  const stateRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/state',
    method: 'GET',
    headers: { 'x-user-role': 'Logistics Client', 'x-user-emp': 'CLI-001' }
  });
  console.log(`Status: ${stateRes.status}`);
  console.log(`Data: ${stateRes.data}`);
  console.log("---");

  console.log("2. Testing /api/trips/track/:token with a valid token");
  // Assuming there is a trip with token tracking-token-1
  const trackRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/trips/track/tracking-token-1',
    method: 'GET'
  });
  console.log(`Status: ${trackRes.status}`);
  console.log(`Data: ${trackRes.data}`);
  console.log("---");
}

verify().catch(console.error);
