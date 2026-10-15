// Tests sign real tokens, so give them a random secret that satisfies the
// startup rules. It is generated per run and never stored.
process.env.JWT_SECRET = require('node:crypto').randomBytes(32).toString('hex');
