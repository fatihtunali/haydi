// Test login endpoint directly
const http = require('http');

const data = JSON.stringify({
    email: 'fatihtunali@gmail.com',
    password: '123456'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);

    let body = '';
    res.on('data', (chunk) => {
        body += chunk;
    });

    res.on('end', () => {
        console.log('Response body:', body);
        try {
            const parsed = JSON.parse(body);
            console.log('Parsed:', parsed);
        } catch (e) {
            console.log('Could not parse JSON');
        }
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.write(data);
req.end();
