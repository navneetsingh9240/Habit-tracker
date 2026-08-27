const { PrismaClient } = require('@prisma/client');
const path = require('path');
const dotenv = require('dotenv');

// Ensure dotenv loads .env from the backend root folder explicitly
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

module.exports = prisma;
