#!/usr/bin/env node

/**
 * Script para gerar par de chaves VAPID para Web Push Notifications
 *
 * Execute: node scripts/generate-vapid-keys.js
 *
 * As chaves geradas devem ser adicionadas às variáveis de ambiente:
 * - VAPID_PUBLIC_KEY (frontend e backend)
 * - VAPID_PRIVATE_KEY (apenas backend)
 * - VITE_VAPID_PUBLIC_KEY (frontend - .env.local)
 */

import webpush from 'web-push';

console.log('\n🔑 Gerando par de chaves VAPID...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('✅ Chaves geradas com sucesso!\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n📝 Adicione estas variáveis de ambiente:\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('Backend (Vercel Environment Variables):');
console.log('----------------------------------------');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);

console.log('\n\nFrontend (.env.local):');
console.log('----------------------');
console.log(`VITE_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('⚠️  IMPORTANTE:');
console.log('   - Guarde a chave privada em segredo');
console.log('   - Não commite as chaves no Git');
console.log('   - Configure na Vercel via: vercel env add VAPID_PUBLIC_KEY');
console.log('   - Configure na Vercel via: vercel env add VAPID_PRIVATE_KEY');
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
