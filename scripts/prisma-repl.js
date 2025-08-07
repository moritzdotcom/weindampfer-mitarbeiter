require('dotenv').config(); // lädt .env
const repl = require('repl');

// Pfad ggf. anpassen je nach Buildstruktur
const { PrismaClient } = require('../generated/prisma/client');
const prisma = new PrismaClient();

const r = repl.start('> ');
r.context.prisma = prisma;

console.log('🟢 Prisma ist in der REPL als "prisma" verfügbar.');
