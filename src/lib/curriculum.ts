// StudyVance AI Explorers — Level 1 curriculum data (all 6 missions).
export type MissionId = 'm1' | 'm2' | 'm3' | 'm4' | 'm5' | 'm6';
export type MissionCard = {
  id: MissionId; title: string; hook: string; shortOutcome: string;
  color: 'navy' | 'turquoise' | 'sunshine'; icon: string; badge: string;
  estimatedMinutes: number; order: number;
};
export function isMissionUnlocked(missionId: MissionId, missions: Record<string, any> | undefined): boolean {
  if (missionId === 'm1') return true;
  const order = MISSIONS.find((m) => m.id === missionId)?.order ?? 99;
  if (order <= 1) return true;
  const prevId = MISSIONS.find((m) => m.order === order - 1)?.id;
  if (!prevId) return true;
  return missions?.[prevId]?.status === 'completed';
}
export const MISSIONS: MissionCard[] = [
  { id: 'm1', title: 'Meet AI', hook: 'Can a computer learn to recognise a cat?', shortOutcome: 'Explain AI simply. Spot when AI is used. Apply one privacy rule.', color: 'turquoise', icon: '🤖', badge: '/assets/badges/badge-m1.png', estimatedMinutes: 40, order: 1 },
  { id: 'm2', title: 'Ask Better Questions', hook: 'Can you make this instruction clearer?', shortOutcome: 'Build a prompt with TASK + DETAILS + FORMAT.', color: 'sunshine', icon: '💬', badge: '/assets/badges/badge-m2.png', estimatedMinutes: 40, order: 2 },
  { id: 'm3', title: 'Become an AI Detective', hook: 'The computer says it is true. Is that enough?', shortOutcome: 'Check claims with evidence. Read, Compare, Decide, Correct.', color: 'navy', icon: '🔍', badge: '/assets/badges/badge-m3.png', estimatedMinutes: 45, order: 3 },
  { id: 'm4', title: 'Create Something', hook: 'Can you rescue this story?', shortOutcome: 'Plan a kind fictional story with character, setting, problem, solution.', color: 'turquoise', icon: '✏️', badge: '/assets/badges/badge-m4.png', estimatedMinutes: 50, order: 4 },
  { id: 'm5', title: 'Learn with AI', hook: 'Should AI give you the answer or help you find it?', shortOutcome: 'Ask for hints, check methods, solve independently.', color: 'sunshine', icon: '💡', badge: '/assets/badges/badge-m5.png', estimatedMinutes: 45, order: 5 },
  { id: 'm6', title: 'Finish and Present', hook: 'Show what you can create!', shortOutcome: 'Complete your story. Truthfully note your own contribution.', color: 'navy', icon: '🏆', badge: '/assets/badges/badge-m6.png', estimatedMinutes: 50, order: 6 },
];
export type LessonScene = { id: string; title: string; illustration: string; audio: string; video: string; transcript: string; caption: string; };
export type QuizQuestion = { id: string; question: string; options: string[]; correctIndex: number; explanation: string; };
export type SortCard = { id: string; label: string; image: string; category: 'ai' | 'ordinary'; why: string; };
export type PrivacyItem = { id: string; text: string; isPersonal: boolean; reason: string; };
export type PrivacyPrompt = { id: string; title: string; unsafePrompt: string; items: PrivacyItem[]; safeVersion: string; };

export const MISSION1_LESSON: LessonScene[] = [
  { id: 'scene-1', title: 'The big question', illustration: '/assets/illustrations/m1-scene1.png', audio: '/assets/audio/m1-scene1.wav', video: '/assets/video/m1-scene1.mp4', transcript: "Hello explorer! Today we have a big question. Can a computer learn to recognise a cat? Think about it. When you see a cat, how do you know it is a cat? You look at its pointy ears. You see its whiskers. You notice its small nose. You learned what a cat looks like by seeing many cats. Now, a computer can learn the same way. Artificial Intelligence, or AI, is software that learns from examples. We show the computer thousands of pictures of cats. We label each one. We say, this is a cat. The computer looks at all these pictures and starts to notice patterns. Pointy ears. Whiskers. A small nose. Then, when we show it a brand new picture, it can guess. It says, I think this is a cat. But remember, it is not magic. It only learned from the examples we gave it. If we only showed it black cats, it might not recognise an orange cat. The examples matter.", caption: 'AI is software that learns from examples.' },
  { id: 'scene-2', title: 'AI or ordinary program?', illustration: '/assets/illustrations/m1-scene2.png', audio: '/assets/audio/m1-scene2.wav', video: '/assets/video/m1-scene2.mp4', transcript: "Now let us look at the difference between AI and ordinary programs. Some things just follow fixed steps that a person wrote down. A calculator follows fixed steps to add numbers. One plus one always equals two. A kitchen timer follows fixed steps to count down. It always behaves the same way. These are ordinary programs. They never learn anything new. But AI is different. When a computer is trained on lots of animal pictures and then guesses this is a cat, that is AI. It learned from examples. When a text tool reads many stories and then writes a new story, that is also AI. Some products mix ordinary programs and AI together. The big question is: did it learn from examples, or did it just follow fixed steps?", caption: 'Did it learn from examples, or just follow fixed steps?' },
  { id: 'scene-3', title: 'The privacy rule', illustration: '/assets/illustrations/m1-scene3.png', audio: '/assets/audio/m1-scene3.wav', video: '/assets/video/m1-scene3.mp4', transcript: "Now, the most important rule in our academy. AI can be useful, but it can also make mistakes. A confident answer is not proof. Just because the computer sounds sure does not mean it is right. And we must always protect our private information. Never tell an AI tool your real full name. Never share your home address. Never share your phone number. Never share your password. And never share another childs photo. If you want to write a story, use a made-up name, like Pip the robot rabbit. Be kind. Be safe. Be truthful. Now let us practice with a game!", caption: 'A confident answer is not proof. Protect your private info.' },
];
export const SORT_CARDS: SortCard[] = [
  { id: 'calc', label: 'A basic calculator adds 2 + 2 by following fixed steps.', image: '/assets/illustrations/sort-calculator.png', category: 'ordinary', why: 'A calculator follows fixed steps written by a person. It does not learn from examples.' },
  { id: 'timer', label: 'A kitchen timer counts down from 5 minutes.', image: '/assets/illustrations/sort-timer.png', category: 'ordinary', why: 'A timer just follows fixed counting steps. It always behaves the same way.' },
  { id: 'cat', label: 'A model trained on labelled animal pictures predicts: "this is a cat".', image: '/assets/illustrations/sort-cat.png', category: 'ai', why: 'It was trained on many labelled examples and learned patterns to make a prediction on a new picture.' },
  { id: 'story', label: 'A text system learns patterns from many stories and writes a new story.', image: '/assets/illustrations/sort-story.png', category: 'ai', why: 'It learned patterns from many example stories and uses those patterns to create something new.' },
];
export const PRIVACY_PROMPTS: PrivacyPrompt[] = [
  { id: 'p1', title: 'The story prompt', unsafePrompt: 'Write a story about a child named Thabo Mthembu who lives at 12 Acacia Road, Hillcrest. His phone number is 082 555 0199 and his password is Sparky2024. Include a photo of his friend Sipho.', safeVersion: 'Write a story about a fictional child named Pip who lives in a fictional town. Include a fictional friend named Moon. Do not use any real names, addresses, phone numbers, passwords, or photos.', items: [
    { id: 'i1', text: 'Thabo Mthembu (real full name)', isPersonal: true, reason: 'Real full names can identify a real person. Use a fictional name like Pip.' },
    { id: 'i2', text: '12 Acacia Road, Hillcrest (home address)', isPersonal: true, reason: 'A home address is private. Never share it with an AI tool.' },
    { id: 'i3', text: '082 555 0199 (phone number)', isPersonal: true, reason: 'Phone numbers are private. Never share them with an AI tool.' },
    { id: 'i4', text: 'Sparky2024 (password)', isPersonal: true, reason: 'A password is a secret. Never type it into any AI tool.' },
    { id: 'i5', text: 'A photo of his friend Sipho', isPersonal: true, reason: 'Another child\'s photo is identifying. Use a fictional character instead.' },
    { id: 'i6', text: 'A friendly robot rabbit named Pip (fictional character)', isPersonal: false, reason: 'Fictional names are safe and fun to use in stories.' },
    { id: 'i7', text: 'A fictional town called Starville', isPersonal: false, reason: 'Made-up places are safe to include in stories.' },
  ] },
];
export const MISSION1_QUIZ: QuizQuestion[] = [
  { id: 'q1', question: 'What is the simplest way to describe Artificial Intelligence (AI)?', options: ['Software that learns patterns from examples', 'A robot that can do anything a human can do', 'A very fast calculator', 'A computer that is always right'], correctIndex: 0, explanation: 'AI is software that learns patterns from examples. It is not magic and it is not always right.' },
  { id: 'q2', question: 'Which one is an example of AI (not ordinary programmed behaviour)?', options: ['A calculator that adds 2 + 2', 'A kitchen timer that counts down 5 minutes', 'A model trained on labelled animal pictures that predicts "this is a cat"', 'A digital clock showing the time'], correctIndex: 2, explanation: 'The animal-picture model learned patterns from many labelled examples. The calculator, timer and clock just follow fixed steps.' },
  { id: 'q3', question: '"AI is always right because computers never make mistakes." Is this true?', options: ['Yes, computers never make mistakes so AI is always right', 'No. AI can make mistakes, and a confident answer is not proof', 'Only sometimes, when the computer is very fast', 'Yes, but only for big expensive computers'], correctIndex: 1, explanation: 'AI can make mistakes. A confident-sounding answer is not proof. Always check important things carefully.' },
  { id: 'q4', question: 'Which piece of information is SAFE to include in a prompt to an AI tool?', options: ['Your real full name', 'Your home address', 'A fictional character name like "Pip the robot rabbit"', 'Your password'], correctIndex: 2, explanation: 'Fictional names are safe and fun. Never share real names, addresses, phone numbers, passwords, or other people\'s photos.' },
  { id: 'q5', question: 'A confident AI answer is the same as proof. True or false?', options: ['True — if AI says it confidently, it must be correct', 'False — a confident answer is not proof; AI can be wrong', 'True, but only for science questions', 'It depends on the colour of the answer'], correctIndex: 1, explanation: 'A confident answer is not proof. AI can sound sure and still be wrong. Check important facts with trusted sources.' },
];
export const QUIZ_PASS_THRESHOLD = 4;
export const MISSION1_PORTFOLIO_PROMPTS = [
  { id: 'ai_can', label: 'AI can…', placeholder: 'e.g. recognise a cat in a photo', example: 'recognise patterns in pictures, like cats or dogs' },
  { id: 'ai_may', label: 'AI may…', placeholder: 'e.g. sometimes give a wrong answer', example: 'sometimes make mistakes, even when it sounds confident' },
  { id: 'privacy_rule', label: 'One privacy rule is…', placeholder: 'e.g. never share my home address with an AI tool', example: 'never share my real name, address, phone number, or password with an AI tool' },
];

// Mission 2
export const MISSION2_LESSON: LessonScene[] = [
  { id: 'm2-s1', title: 'What makes a good prompt?', illustration: '/assets/illustrations/m2-scene1.png', audio: '/assets/audio/m2-scene1.wav', video: '/assets/video/m2-scene1.mp4', transcript: "A prompt is a question or instruction you give to an AI tool. Think of it like giving instructions to a friend. If you say make me something, your friend will not know what you want. But if you say write three short sentences about a robot rabbit, your friend knows exactly what to do. More words are not always better. What matters is useful details. A great prompt has three parts. First, the TASK. That is what you want the AI to do. Second, the DETAILS. Those are useful specifics like who, what, and for whom. Third, the FORMAT. That is how you want the answer to look. When you use all three parts, the AI gives you what you actually wanted.", caption: 'A great prompt has TASK + DETAILS + FORMAT.' },
  { id: 'm2-s2', title: 'Build it from three parts', illustration: '/assets/illustrations/m2-scene2.png', audio: '/assets/audio/m2-scene2.wav', video: '/assets/video/m2-scene2.mp4', transcript: "Let us build a prompt together. The TASK is: write three short sentences. The DETAILS are: about a made-up robot rabbit helping an animal shelter, for a Grade 4 reader, simple words, friendly tone, no real names. The FORMAT is: three bullet points. Put them together and you get a clear, safe prompt. Now the AI knows exactly what to make, who it is for, and how to lay it out. This is much better than just saying make a story, because the AI does not have to guess what you want.", caption: 'TASK + DETAILS + FORMAT = a clear, safe prompt.' },
  { id: 'm2-s3', title: 'Compare the replies', illustration: '/assets/illustrations/m2-scene3.png', audio: '/assets/audio/m2-scene3.wav', video: '/assets/video/m2-scene3.mp4', transcript: "Not every reply follows the request. Let me show you two replies. Reply A says: Animals are found in many places. They can be large or small. People like animals. Reply B says: A robot rabbit carried blankets to the animal shelter. It helped the keeper fill the water bowls. At sunset, every animal had a cosy place to rest. Reply B follows the brief better. It is about a robot rabbit at an animal shelter, it uses simple words, and it has three sentences. Also remember: if you asked for bullet points, a long paragraph does not meet the request.", caption: 'Check the reply against the request.' },
];
export type PromptPart = { id: string; text: string };
export type PromptCategory = { id: 'task' | 'details' | 'format'; label: string; hint: string; options: PromptPart[] };
export const MISSION2_PROMPT_CATEGORIES: PromptCategory[] = [
  { id: 'task', label: 'TASK', hint: 'What do you want the AI to do?', options: [{ id: 't1', text: 'Write three short sentences' }, { id: 't2', text: 'Tell me about space' }, { id: 't3', text: 'Make a story' }] },
  { id: 'details', label: 'DETAILS', hint: 'Useful specifics', options: [{ id: 'd1', text: 'about a fictional robot rabbit helping an animal shelter, for a Grade 4 reader, simple words, friendly tone, no real names' }, { id: 'd2', text: 'about planets, for a Grade 6 reader, three facts only' }, { id: 'd3', text: 'about a kitten who learns to share, no magic, kind ending' }] },
  { id: 'format', label: 'FORMAT', hint: 'How should the answer look?', options: [{ id: 'f1', text: 'three bullet points' }, { id: 'f2', text: 'one short paragraph' }, { id: 'f3', text: 'a list of three facts' }] },
];
export const MISSION2_BEST_PROMPT = ['t1', 'd1', 'f1'];
export type ReplyComparison = { id: string; brief: string; replyA: string; replyB: string; correct: 'A' | 'B'; why: string };
export const MISSION2_COMPARISONS: ReplyComparison[] = [
  { id: 'c1', brief: 'Write three short sentences for a Grade 4 reader about a fictional robot rabbit helping an animal shelter. Use simple words and a friendly tone. Do not include real names.', replyA: 'Animals are found in many places. They can be large or small. People like animals.', replyB: 'A robot rabbit carried blankets to the animal shelter. It helped the keeper fill the water bowls. At sunset, every animal had a cosy place to rest.', correct: 'B', why: 'Reply B follows the brief: it is about a fictional robot rabbit at an animal shelter, uses simple friendly words, has three sentences, and includes no real names.' },
];
export const MISSION2_QUIZ: QuizQuestion[] = [
  { id: 'm2q1', question: 'What are the three parts of a great prompt?', options: ['TASK + DETAILS + FORMAT', 'Words + Words + Words', 'Question + Answer + Reply', 'Copy + Paste + Send'], correctIndex: 0, explanation: 'A great prompt has a TASK (what to do), DETAILS (useful specifics), and FORMAT (how to lay it out).' },
  { id: 'm2q2', question: 'Which prompt is clearer?', options: ['"Make a story"', '"Write three short sentences for a Grade 4 reader about a fictional robot rabbit helping an animal shelter, simple words, friendly tone, no real names"', '"Give me something good"', '"Story please"'], correctIndex: 1, explanation: 'The second prompt has a clear task, useful details, and an implied format. The others are too vague.' },
  { id: 'm2q3', question: 'You asked for three bullet points. The AI gives you one long paragraph. What should you check?', options: ['Whether the paragraph sounds nice', 'Whether the reply matches the FORMAT you asked for', 'Whether the AI used big words', 'Nothing — any reply is fine'], correctIndex: 1, explanation: 'Always check whether the reply matches the format you requested.' },
  { id: 'm2q4', question: 'Which detail should you NOT include in a prompt?', options: ['A friendly tone', 'The grade level of the reader', 'Your real home address', 'That the story should be fictional'], correctIndex: 2, explanation: 'Never include real personal information like your home address in a prompt.' },
  { id: 'm2q5', question: 'Does using more words always make a prompt better?', options: ['Yes, longer prompts are always better', 'No — useful details matter, not just more words', 'Yes, but only if you use big words', 'No, one word is always enough'], correctIndex: 1, explanation: 'More words are not automatically better. Useful, relevant details are what make a prompt clear.' },
];
export const MISSION2_PORTFOLIO_PROMPTS = [
  { id: 'task', label: 'TASK — what do you want the AI to do?', placeholder: 'e.g. Write three short sentences', example: 'Write three short sentences about a fictional character' },
  { id: 'details', label: 'DETAILS — useful specifics', placeholder: 'e.g. about a robot rabbit, for Grade 4, friendly tone', example: 'about a robot rabbit helping an animal shelter, simple words, kind tone' },
  { id: 'format', label: 'FORMAT — how should the answer look?', placeholder: 'e.g. three bullet points', example: 'three bullet points' },
];

// Mission 3
export const MISSION3_LESSON: LessonScene[] = [
  { id: 'm3-s1', title: 'Claim vs evidence', illustration: '/assets/illustrations/m3-scene1.png', audio: '/assets/audio/m3-scene1.wav', video: '/assets/video/m3-scene1.mp4', transcript: "A claim is something a person or a computer says is true. For example, someone might say the Moon makes its own light. That is a claim. But is it true? Evidence is the information we use to check the claim. The computer says it is true. But is that enough? No! A confident answer is not proof. Just because a computer sounds sure does not mean it is right. To be a real AI detective, you must check claims against evidence. Do not just trust them because they sound sure. You need your own facts to compare.", caption: 'A claim is not the same as evidence. Check it!' },
  { id: 'm3-s2', title: 'The Moon fact sheet', illustration: '/assets/illustrations/m3-scene2.png', audio: '/assets/audio/m3-scene2.wav', video: '/assets/video/m3-scene2.mp4', transcript: "Here are four facts from our Moon fact sheet. Fact A: The Moon reflects sunlight. It does not make light itself. Fact B: The Moon orbits Earth. That means it goes around and around our planet. Fact C: Earth has one natural moon. Just one. Fact D: The Moon has no breathable air for people. People need life-support equipment to visit the Moon. Keep these four facts in mind. You will use them to check five claims next.", caption: 'Four Moon facts to use as your evidence.' },
  { id: 'm3-s3', title: 'Read, Compare, Decide, Correct', illustration: '/assets/illustrations/m3-scene3.png', audio: '/assets/audio/m3-scene3.wav', video: '/assets/video/m3-scene3.mp4', transcript: "To check a claim, follow four simple steps. Step one: Read the claim carefully. Step two: Compare it to your evidence. Step three: Decide. Is the claim supported by the evidence, contradicted by the evidence, or is there not enough information? Step four: Correct the claim if it is wrong. Remember, asking the same AI again is not independent proof. If you ask twice and it says the same thing, that does not make it true. You still need your own evidence.", caption: 'Read, Compare, Decide, Correct.' },
];
export const MISSION3_MOON_FACTS = [
  { id: 'A', text: 'The Moon reflects sunlight.' },
  { id: 'B', text: 'The Moon orbits Earth.' },
  { id: 'C', text: 'Earth has one natural moon.' },
  { id: 'D', text: 'The Moon has no breathable air for people; people need life-support equipment.' },
];
export type ClaimCheck = { id: string; claim: string; answer: 'supported' | 'contradicted' | 'not-enough'; evidence?: string; explanation: string };
export const MISSION3_CLAIMS: ClaimCheck[] = [
  { id: 'cl1', claim: 'The Moon makes its own light.', answer: 'contradicted', evidence: 'A', explanation: 'Fact A says the Moon reflects sunlight. It does not make its own light.' },
  { id: 'cl2', claim: 'The Moon orbits Earth.', answer: 'supported', evidence: 'B', explanation: 'Fact B says exactly this. The claim is supported.' },
  { id: 'cl3', claim: 'Earth has two natural moons.', answer: 'contradicted', evidence: 'C', explanation: 'Fact C says Earth has one natural moon, not two.' },
  { id: 'cl4', claim: 'People can breathe normally on the Moon without equipment.', answer: 'contradicted', evidence: 'D', explanation: 'Fact D says the Moon has no breathable air and people need life-support equipment.' },
  { id: 'cl5', claim: 'A purple dragon lives on the Moon.', answer: 'not-enough', evidence: undefined, explanation: 'Our fact sheet says nothing about dragons. There is not enough information. We label the dragon as fiction.' },
];
export const MISSION3_QUIZ: QuizQuestion[] = [
  { id: 'm3q1', question: 'What is the difference between a claim and evidence?', options: ['They are the same thing', 'A claim is what someone says is true; evidence is the information we use to check it', 'A claim is always true', 'Evidence is what the computer says'], correctIndex: 1, explanation: 'A claim is a statement that something is true. Evidence is the information we use to check it.' },
  { id: 'm3q2', question: 'The Moon makes its own light. According to the fact sheet, this is:', options: ['Supported', 'Contradicted', 'Not enough information', 'Partly true'], correctIndex: 1, explanation: 'Fact A says the Moon reflects sunlight — it does not make its own light.' },
  { id: 'm3q3', question: 'Asking the same AI the same question again is:', options: ['Independent proof', 'Not independent proof — you still need your own evidence', 'Always enough to trust the answer', 'The same as checking a textbook'], correctIndex: 1, explanation: 'Asking the same AI again is not independent proof. It may just repeat the same mistake.' },
  { id: 'm3q4', question: '"A purple dragon lives on the Moon." What should a detective say?', options: ['Supported', 'Contradicted', 'Not enough information; label it as fiction', 'Proven'], correctIndex: 2, explanation: 'The fact sheet says nothing about dragons. There is not enough information.' },
  { id: 'm3q5', question: 'Which is the correct order for checking a claim?', options: ['Decide, Read, Compare, Correct', 'Read, Compare, Decide, Correct', 'Correct, Read, Decide, Compare', 'Compare, Correct, Read, Decide'], correctIndex: 1, explanation: 'Read, Compare, Decide, then Correct if it is wrong.' },
];
export const MISSION3_PORTFOLIO_PROMPTS = [{ id: 'rewrite', label: 'Rewrite the flawed Moon paragraph using only supported facts', placeholder: 'Write 2-3 sentences using only facts A, B, C and D.', example: 'The Moon reflects sunlight and orbits Earth. Earth has one natural moon.' }];

// Mission 4
export const MISSION4_LESSON: LessonScene[] = [
  { id: 'm4-s1', title: 'Plan your story', illustration: '/assets/illustrations/m4-scene1.png', audio: '/assets/audio/m4-scene1.wav', video: '/assets/video/m4-scene1.mp4', transcript: "Every good story has four parts. First, a character. That is who the story is about. Second, a setting. That is where the story happens. Third, a problem. That is what goes wrong. And fourth, a kind solution. That is how the problem gets fixed in a nice way. Before you write your story, plan these four parts. For our practice story, we will use a made-up robot rabbit at an animal shelter. No real names. No magic. And a kind ending where the problem is solved nicely.", caption: 'Character + Setting + Problem + Kind solution.' },
  { id: 'm4-s2', title: 'Review the draft', illustration: '/assets/illustrations/m4-scene2.png', audio: '/assets/audio/m4-scene2.wav', video: '/assets/video/m4-scene2.mp4', transcript: "Here is a practice draft that breaks the brief. Pip the robot rabbit worked at an animal shelter. One morning, a kitten blanket was missing. Pip shouted at the kitten for losing it. Then a magic wand appeared and made a hundred blankets. The kitten flew into space. Everyone clapped. The brief was: a kind story at an animal shelter, no magic. Can you spot where it breaks the brief? Pip shouts, that is not kind. A magic wand appears, that is magic. The kitten flies into space, that is not a real solution.", caption: 'Spot where the draft breaks the brief.' },
  { id: 'm4-s3', title: 'Truthful assistance note', illustration: '/assets/illustrations/m4-scene3.png', audio: '/assets/audio/m4-scene3.wav', video: '/assets/video/m4-scene3.mp4', transcript: "When you create something, you must truthfully say what help you used. Did you use the prepared practice draft? Did a teacher run a live AI for you? Or did you write your own first draft without AI? The app must never claim AI was used if it was not. Your own work matters. Be honest about what is yours and what help you got. This is called a truthful assistance note.", caption: 'Be truthful about what help you used.' },
];
export const MISSION4_DRAFT_BRIEF = 'Kind story at an animal shelter, no magic, fictional characters only.';
export const MISSION4_PRACTICE_DRAFT = 'Pip the robot rabbit worked at an animal shelter. One morning, a kitten\'s blanket was missing. Pip shouted at the kitten for losing it. Then a magic wand appeared and made a hundred blankets. The kitten flew into space. Everyone clapped.';
export const MISSION4_DRAFT_ISSUES = [
  { id: 'i1', snippet: 'Pip shouted at the kitten for losing it.', problem: 'Not kind — Pip should help, not shout.' },
  { id: 'i2', snippet: 'A magic wand appeared and made a hundred blankets.', problem: 'Magic — the brief said no magic.' },
  { id: 'i3', snippet: 'The kitten flew into space.', problem: 'Not a kind, realistic solution.' },
];
export const MISSION4_STORY_FIELDS = [
  { id: 'character', label: 'Character', placeholder: 'e.g. Pip, a robot rabbit', example: 'Pip, a friendly robot rabbit' },
  { id: 'setting', label: 'Setting', placeholder: 'e.g. an animal shelter', example: 'an animal shelter in Starville' },
  { id: 'problem', label: 'Problem', placeholder: 'e.g. a kitten\'s blanket is missing', example: 'a kitten\'s blanket goes missing' },
  { id: 'solution', label: 'Kind solution', placeholder: 'e.g. Pip helps find the blanket', example: 'Pip helps search and shares spare blankets' },
];
export const MISSION4_QUIZ: QuizQuestion[] = [
  { id: 'm4q1', question: 'What are the four planning parts of a story?', options: ['Character, Setting, Problem, Kind solution', 'Beginning, Middle, End, Title', 'Words, Sentences, Paragraphs, Pages', 'Name, Place, Time, Date'], correctIndex: 0, explanation: 'Plan your character, setting, problem, and kind solution.' },
  { id: 'm4q2', question: 'In the practice draft, what breaks the brief?', options: ['Pip works at an animal shelter', 'A kitten\'s blanket is missing', 'Pip shouts at the kitten AND a magic wand appears', 'Everyone clapped'], correctIndex: 2, explanation: 'Pip shouting is not kind, and the magic wand breaks the no-magic rule.' },
  { id: 'm4q3', question: 'What is a "truthful assistance note"?', options: ['A note that says AI was used', 'An honest statement of what help you used', 'A signature', 'A note from your tutor'], correctIndex: 1, explanation: 'A truthful assistance note honestly states what help you used and what is your own work.' },
  { id: 'm4q4', question: 'Which detail should NOT be in your story?', options: ['A fictional robot rabbit', 'A kind solution', 'A real classmate\'s full name and address', 'A setting in a fictional town'], correctIndex: 2, explanation: 'Never include real personal details. Use fictional characters and places.' },
  { id: 'm4q5', question: 'Does the quality of your drawing affect whether you pass?', options: ['Yes — you must be a great artist', 'No — drawing quality is not graded', 'Yes — only perfect drawings count', 'No — you do not need to draw'], correctIndex: 1, explanation: 'Drawing quality is not graded. What matters is that you tried.' },
];

// Mission 5
export const MISSION5_LESSON: LessonScene[] = [
  { id: 'm5-s1', title: 'Hint or answer?', illustration: '/assets/illustrations/m5-scene1.png', audio: '/assets/audio/m5-scene1.wav', video: '/assets/video/m5-scene1.mp4', transcript: "Should AI give you the answer, or help you find it? Think about this. If AI just gives you the full answer to copy, you do not learn anything. You just copy. But if AI gives you one hint and then lets you try, you build your own skill. A hint is like a stepping stone. It helps you cross a river without carrying you. The best way to learn is: ask for a hint, try it yourself, then check your work. This way, the skill becomes yours forever.", caption: 'A hint helps you learn. Copying does not.' },
  { id: 'm5-s2', title: 'Check the method', illustration: '/assets/illustrations/m5-scene2.png', audio: '/assets/audio/m5-scene2.wav', video: '/assets/video/m5-scene2.mp4', transcript: "Let us check a maths example. 24 divided by 3. The correct answer is 8, because 3 times 8 equals 24. But someone says: 24 divided by 3 equals 7, because 3 times 7 equals 24. Is that right? Let us check. 3 times 7 is 21, not 24. So the method is wrong, even though it sounded confident. Always check the working, not just the final number. Then try a similar problem on your own. 18 divided by 3 equals 6, because 3 times 6 equals 18.", caption: 'Check the working. 3 x 7 = 21, not 24.' },
  { id: 'm5-s3', title: 'Read with evidence', illustration: '/assets/illustrations/m5-scene3.png', audio: '/assets/audio/m5-scene3.wav', video: '/assets/video/m5-scene3.mp4', transcript: "Here is a short passage. Lebo took a small watering can to the school garden. The soil near the beans felt dry. Lebo watered the soil slowly, then placed a label beside each row. Before leaving, Lebo closed the gate to keep the goats out. Now ask: what felt dry? The soil near the beans. Why close the gate? To keep the goats out. Was the gate left open? No, the passage says Lebo closed it. Does the passage say the watering can was red? No, there is not enough information. Good detectives read carefully.", caption: 'Only answer what the passage actually says.' },
];
export const MISSION5_MATH_PROBLEM = { question: '24 ÷ 3 = ?', correctAnswer: 8, check: '3 × 8 = 24', wrongExplanation: '24 ÷ 3 = 7 because 3 × 7 = 24', wrongCheck: '3 × 7 = 21 (not 24!)', independentProblem: '18 ÷ 3 = ?', independentAnswer: 6, independentCheck: '3 × 6 = 18' };
export const MISSION5_PASSAGE = 'Lebo took a small watering can to the school garden. The soil near the beans felt dry. Lebo watered the soil slowly, then placed a label beside each row. Before leaving, Lebo closed the gate to keep the goats out.';
export const MISSION5_PASSAGE_QUESTIONS = [
  { id: 'pq1', question: 'What felt dry?', options: ['The watering can', 'The soil near the beans', 'The gate', 'The labels'], correctIndex: 1, explanation: 'The passage says "the soil near the beans felt dry."' },
  { id: 'pq2', question: 'Why did Lebo close the gate?', options: ['To keep the goats out', 'To lock the shed', 'Because it was raining', 'To water the beans'], correctIndex: 0, explanation: 'The passage says Lebo closed the gate "to keep the goats out."' },
  { id: 'pq3', question: 'True or false: the gate was left open.', options: ['True', 'False'], correctIndex: 1, explanation: 'False. The passage says Lebo closed the gate.' },
  { id: 'pq4', question: 'Does the passage say the watering can was red?', options: ['Yes, it was red', 'No, it was blue', 'Not enough information', 'Yes, it was green'], correctIndex: 2, explanation: 'The passage never mentions the colour. There is not enough information.' },
];
export const MISSION5_QUIZ: QuizQuestion[] = [
  { id: 'm5q1', question: 'Which is better for learning?', options: ['Give me the complete answer to copy', 'Give me one hint, then let me try', 'Both are the same', 'Neither'], correctIndex: 1, explanation: 'A hint helps you build your own skill. Copying does not help you learn.' },
  { id: 'm5q2', question: 'Someone says "24 ÷ 3 = 7 because 3 × 7 = 24." What is wrong?', options: ['Nothing', '3 × 7 = 21, not 24; the correct answer is 8 (3 × 8 = 24)', 'Not a real question', 'The answer should be 10'], correctIndex: 1, explanation: '3 × 7 = 21, not 24. The correct answer is 8, because 3 × 8 = 24.' },
  { id: 'm5q3', question: 'Why is asking the same AI again NOT independent proof?', options: ['Because AI is always wrong', 'Because it may just repeat the same mistake', 'Because asking twice is not allowed', 'Because AI gets worse'], correctIndex: 1, explanation: 'Asking the same AI again may just repeat the same mistake.' },
  { id: 'm5q4', question: 'The passage does not mention the colour of the can. What should you say?', options: ['It was red', 'It was blue', 'There is not enough information', 'It was green'], correctIndex: 2, explanation: 'When the passage does not say something, say "not enough information."' },
  { id: 'm5q5', question: 'What is 18 ÷ 3?', options: ['5', '6', '7', '8'], correctIndex: 1, explanation: '18 ÷ 3 = 6, because 3 × 6 = 18.' },
];
export const MISSION5_PORTFOLIO_PROMPTS = [
  { id: 'hint_helped', label: 'One way a hint helped me', placeholder: 'e.g. The hint reminded me to check 3 × 8 = 24', example: 'The hint told me to check by multiplying' },
  { id: 'did_independently', label: 'One skill I did by myself', placeholder: 'e.g. I solved 18 ÷ 3 = 6 on my own', example: 'I solved 18 ÷ 3 = 6 by myself' },
];

// Mission 6
export const MISSION6_LESSON: LessonScene[] = [
  { id: 'm6-s1', title: 'Polish your story', illustration: '/assets/illustrations/m6-scene1.png', audio: '/assets/audio/m6-scene1.wav', video: '/assets/video/m6-scene1.mp4', transcript: "It is time to finish your story. Read your first draft again. Find at least two sentences you can improve. Maybe make them clearer, kinder, or more descriptive. Keep your first draft and your final draft, so you can see how your thinking grew. Your story should be 6 to 8 sentences long. It should have a made-up character, a setting, a problem, and a kind solution. And at least one matching drawing. Drawing quality is not graded, so just do your best.", caption: 'Keep your first draft. Improve at least two sentences.' },
  { id: 'm6-s2', title: 'Independent skills check', illustration: '/assets/illustrations/m6-scene2.png', audio: '/assets/audio/m6-scene2.wav', video: '/assets/video/m6-scene2.mp4', transcript: "Before you finish Level 1, let us check five skills on your own. One: can AI make mistakes? Two: which is a safe prompt choice, and which is your password? Three: can you improve Make a story using task, details, and format? Four: can you correct the two moons claim using the Moon fact sheet? Five: can you explain why a hint helps more than copying? These five checks show what you can do on your own.", caption: 'Five skills to show on your own.' },
  { id: 'm6-s3', title: 'Present your work', illustration: '/assets/illustrations/m6-scene3.png', audio: '/assets/audio/m6-scene3.wav', video: '/assets/video/m6-scene3.mp4', transcript: "When you are ready, show your story portfolio to your tutor. Your portfolio has your first and final drafts, your drawing, and your truthful assistance note. Your tutor will review it and decide if you are ready for Level 2, or if you should practise a bit more. Remember, finishing Level 1 does not automatically mean you are ready for Level 2. That is your tutors decision, based on your evidence. Either way, you are now an AI Explorer!", caption: 'Show your portfolio. Your tutor decides.' },
];
export const MISSION6_SKILLS_CHECK = [
  { id: 'sc1', prompt: '1. Can AI make mistakes?', options: ['No, AI is always right', 'Yes, AI can make mistakes — a confident answer is not proof', 'Only old AI makes mistakes', 'Only new AI makes mistakes'], correctIndex: 1, explanation: 'AI can make mistakes. A confident answer is not proof.' },
  { id: 'sc2', prompt: '2. Which is a SAFE prompt choice, and which is your PASSWORD?', options: ['Safe prompt: "Write a story about a fictional robot rabbit." Password: "Sparky2024" — never type it into an AI tool.', 'Safe prompt: "Sparky2024." Password: "Write a story."', 'Both are safe', 'Neither is safe'], correctIndex: 0, explanation: 'A fictional story prompt is safe. Your password must never be typed into an AI tool.' },
  { id: 'sc3', prompt: '3. Improve "Make a story" using TASK + DETAILS + FORMAT.', options: ['Make a story please', 'Write three short sentences for a Grade 4 reader about a fictional robot rabbit, simple words, friendly tone, no real names, as three bullet points', 'Story now', 'Give me a story about my real address'], correctIndex: 1, explanation: 'The improved prompt has a clear task, useful details, a format, and no personal info.' },
  { id: 'sc4', prompt: '4. Correct the "Earth has two natural moons" claim.', options: ['The claim is correct', 'Earth has one natural moon (Fact C), so the claim is wrong', 'Earth has three moons', 'Not enough information'], correctIndex: 1, explanation: 'Fact C says Earth has one natural moon. The claim is wrong.' },
  { id: 'sc5', prompt: '5. Why does a hint help more than copying?', options: ['It does not', 'A hint helps you build your own skill; copying teaches you nothing', 'A hint is faster', 'A hint is shorter'], correctIndex: 1, explanation: 'A hint helps you learn. Copying teaches you nothing.' },
];
export const MISSION6_RUBRIC = [
  { id: 'r1', label: 'Clear instructions', description: 'The story is easy to follow.' },
  { id: 'r2', label: 'Checking', description: 'The learner checks claims and methods.' },
  { id: 'r3', label: 'Story and revision', description: 'The story has character, setting, problem, kind solution, and at least two improved sentences.' },
  { id: 'r4', label: 'Privacy', description: 'No real personal details are included.' },
  { id: 'r5', label: 'Own contribution', description: 'The assistance note truthfully states what is the learner\'s own work.' },
];
export const MISSION6_QUIZ: QuizQuestion[] = [
  { id: 'm6q1', question: 'How many sentences should your final Level 1 story be?', options: ['1-2', '3-4', '6-8', '20+'], correctIndex: 2, explanation: 'The Level 1 story should be 6 to 8 sentences long.' },
  { id: 'm6q2', question: 'What must you keep so you can show your revision?', options: ['Only the final draft', 'Both the first draft AND the final draft', 'Only the drawing', 'Only the note'], correctIndex: 1, explanation: 'Keep both your first and final drafts.' },
  { id: 'm6q3', question: 'How many sentences should you improve?', options: ['At least one', 'At least two', 'All of them', 'None'], correctIndex: 1, explanation: 'Improve at least two sentences.' },
  { id: 'm6q4', question: 'Does finishing Level 1 automatically mean you are ready for Level 2?', options: ['Yes, always', 'No — your tutor reviews your rubric first', 'Yes, if you finish fast', 'Yes, if you get 10/10'], correctIndex: 1, explanation: 'Your tutor reviews your evidence and decides.' },
  { id: 'm6q5', question: 'What must your portfolio include?', options: ['Only the final story', 'First draft, final draft, at least one drawing, and a truthful assistance note', 'Only the drawing', 'Only the note'], correctIndex: 1, explanation: 'Your portfolio has first draft, final draft, drawing, and assistance note.' },
];

export type MissionContent = { lesson: LessonScene[]; quiz: QuizQuestion[]; portfolioPrompts: { id: string; label: string; placeholder: string; example: string }[] };
export const MISSION_CONTENT: Record<MissionId, MissionContent> = {
  m1: { lesson: MISSION1_LESSON, quiz: MISSION1_QUIZ, portfolioPrompts: MISSION1_PORTFOLIO_PROMPTS },
  m2: { lesson: MISSION2_LESSON, quiz: MISSION2_QUIZ, portfolioPrompts: MISSION2_PORTFOLIO_PROMPTS },
  m3: { lesson: MISSION3_LESSON, quiz: MISSION3_QUIZ, portfolioPrompts: MISSION3_PORTFOLIO_PROMPTS },
  m4: { lesson: MISSION4_LESSON, quiz: MISSION4_QUIZ, portfolioPrompts: MISSION4_STORY_FIELDS },
  m5: { lesson: MISSION5_LESSON, quiz: MISSION5_QUIZ, portfolioPrompts: MISSION5_PORTFOLIO_PROMPTS },
  m6: { lesson: MISSION6_LESSON, quiz: MISSION6_QUIZ, portfolioPrompts: [] },
};

export const AVATARS = [
  { id: 'avatar-1', src: '/assets/avatars/avatar-1.png', label: 'Sky' },
  { id: 'avatar-2', src: '/assets/avatars/avatar-2.png', label: 'Sunny' },
  { id: 'avatar-3', src: '/assets/avatars/avatar-3.png', label: 'Bean' },
  { id: 'avatar-4', src: '/assets/avatars/avatar-4.png', label: 'Star' },
  { id: 'avatar-5', src: '/assets/avatars/avatar-5.png', label: 'Moon' },
  { id: 'avatar-6', src: '/assets/avatars/avatar-6.png', label: 'Wave' },
];
export const WELCOME_AUDIO = '/assets/audio/welcome-intro.wav'
export const WELCOME_VIDEO = '/assets/video/welcome-intro.mp4';
export const WELCOME_TRANSCRIPT = "Hi there! I am Vance, your friendly robot guide. Welcome to StudyVance AI Explorers! Today we start a fun adventure. We will learn what Artificial Intelligence is. We will learn how to stay safe. And we will learn how to think like a real explorer. Are you ready? Let us go!";
