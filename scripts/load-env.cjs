const path = require('node:path');
const { loadEnvConfig } = require('@next/env');

loadEnvConfig(path.join(__dirname, '..'));
