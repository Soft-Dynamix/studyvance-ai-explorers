import { db } from '../src/lib/db';
async function main() {
  const learners = await db.learner.findMany({ where: { active: true }, include: { cohort: true } });
  console.log(`Found ${learners.length} active learners:`);
  for (const l of learners) {
    console.log(`  ${l.nickname} | code: ${l.learnerCode} | cohort: ${l.cohort?.name ?? 'none'}`);
  }
  const tutors = await db.tutor.findMany();
  console.log(`Found ${tutors.length} tutors:`);
  for (const t of tutors) {
    console.log(`  ${t.username} | role: ${t.role}`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
