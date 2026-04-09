const http = require('http');

const data = JSON.stringify({
  url: 'https://www.amazon.in/Apple-iPhone-15-256-GB/dp/B0CHX1W1XY'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/compare-price',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', d => { body += d; });
  res.on('end', () => { console.log('Response:', body); });
});

req.on('error', error => { console.error('Error:', error); });
req.write(data);
req.end();
