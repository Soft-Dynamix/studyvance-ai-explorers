import { db } from '../src/lib/db';
async function main() {
  const sessions = await db.session.findMany();
  console.log(`Sessions in DB: ${sessions.length}`);
  for (const s of sessions) {
    console.log(`  token: ${s.token.substring(0,20)}... learnerId: ${s.learnerId} expires: ${s.expiresAt}`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
