import https from 'https';

const options = {
  hostname: 'api.gate.io',
  port: 443,
  path: '/api/v4/wallet/total_balance',
  method: 'GET',
  headers: {
    Host: 'api.gate.io',
    'User-Agent': 'Mozilla/5.0',
  },
  agent: new https.Agent({
    rejectUnauthorized: false // ❗ отключаем SSL-проверку
  })
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('BODY:', data);
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.end();
