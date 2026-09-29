const http = require('http');

async function test() {
  const payloads = [
    { name: "A", email: "a@a.com", password: "password123" },
    { name: "Test", email: "b@b.com", password: "pwd" }, // short password
    { email: "c@c.com", password: "password123" }, // missing name
    { name: "Test", email: "invalid", password: "password123" }, // invalid email
    { name: "Test", email: "a@a.com", password: "password123", role: "admin", adminCode: "wrong" }, // wrong admin code
    { name: "   ", email: "spaces@b.com", password: "password123" },
  ];

  for (const p of payloads) {
    const res = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p)
    });
    const body = await res.json();
    console.log(`Status: ${res.status}, Payload: ${JSON.stringify(p)}, Body: ${JSON.stringify(body)}`);
  }
}
test();
