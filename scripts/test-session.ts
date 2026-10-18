import { db } from '../src/lib/db';
async function main() {
  try {
    const session = await db.session.create({
      data: {
        token: 'test-token-123',
        learnerId: 'cmve46fid0003oou6pqiv65ek',
        expiresAt: new Date(Date.now() + 3600000),
      },
    });
    console.log('Session created:', session.token);
    
    const found = await db.session.findUnique({ where: { token: 'test-token-123' } });
    console.log('Session found:', found?.token);
    
    await db.session.delete({ where: { token: 'test-token-123' } });
    console.log('Session deleted');
  } catch (e) {
    console.error('Error:', e.message);
  }
}
main();
