// Peptalk database with categories matched to common difficulties

export const peptalkDatabase: Record<string, string[]> = {
  overwhelm: [
    "The hardest part is starting. Just take ONE tiny step. That's it! 🥕",
    "You don't need the whole plan. Just the first action. What's the smallest thing you can do right now?",
    "You've been caring for me {feedCount} times today. That shows you CAN follow through. Apply that here! 💚",
    "Break it into tiny pieces. Just 5 minutes. Set a timer. You can do ANYTHING for 5 minutes! ⏰",
    "Start messy, start imperfect. Just START. You can fix it later! 🌟"
  ],
  
  perfectionism: [
    "Done is better than perfect. A messy completed thing beats a perfect unfinished one! 💪",
    "Give yourself permission to be mediocre. You can always improve it later! 🌟",
    "Progress over perfection! Even 10% done is better than 0%. 🐰",
    "You've completed {completedCount} imperfect things already. One more won't hurt! 😊",
    "What would 'good enough' look like? Aim for that, not perfection! 💚"
  ],
  
  fear: [
    "What if it goes RIGHT? Focus on that possibility instead! 🌟",
    "Failure is just feedback. It's how you learn and grow! 💪",
    "The only real failure is not trying. You've got this! 🐰",
    "Even if it doesn't work out, you'll have learned something valuable! 🥕",
    "You're braver than you think. You've already done {completedCount} hard things! 🌟"
  ],
  
  tired: [
    "Just 10 minutes. You can rest after. Even tired you is capable! 💪",
    "Start before you feel ready. Action creates energy! 🌟",
    "You found energy to care for me {feedCount} times today. You have more in the tank! 🥕",
    "What's the laziest way you could do this? Do that version! 😊",
    "Motivation comes AFTER starting, not before! Trust the process! 💚"
  ],
  
  no_time: [
    "You don't need hours. Just 10 focused minutes right now! ⏰",
    "You found time to play with me {playCount} times. You have time for this too! 💚",
    "What can you do in 5 minutes? Even that is progress! 🐰",
    "Set a timer. Work till it beeps. Then you're done! ⏰",
    "Small pockets of time add up. Just start! 🌟"
  ],
  
  phone_anxiety: [
    "Phone anxiety is REAL. But you've been caring for me so well! You CAN follow through. 🥕",
    "The dentist won't judge you. They just want to help! Imagine how relieved you'll feel when it's done. 💚",
    "You don't need to be perfect. Just dial the number. That's it! One tiny action. 🐰",
    "The anticipation is worse than the actual call. It'll be over in 2 minutes! 💪",
    "Just write down what you'll say. Then dial before you overthink it! 🌟"
  ],
  
  forget: [
    "You remembered to care for me {waterCount} times today! Use that same attention for yourself. 💚",
    "What if you put a reminder next to me? Every time you check on me, do this too! 🐰",
    "Set a timer RIGHT NOW for 10 minutes. When it beeps, do this! ⏰",
    "You're not bad at remembering - you just need a system. Let's build one! 🌟",
    "Put it somewhere visible. Sticky note on the fridge. You'll see it! 💪"
  ],
  
  boring: [
    "The boring stuff matters too! You're taking care of your life. That's huge! 💚",
    "Put on your favorite music. Make it as fun as you can! 🎵",
    "You've done {completedCount} boring things already. One more won't kill you! 😊",
    "Race the clock! How fast can you finish this? Game on! ⏰",
    "Future you will be SO grateful you did this boring thing now! 🌟"
  ],
  
  general: [
    "You've been taking such great care of me today! Now care for yourself too. 💚",
    "I believe in you! You've got this! 🐰",
    "One step at a time. Just the next right thing. 🥕",
    "You're stronger than you think. You've already accomplished so much! 🌟",
    "Take a deep breath. You can do hard things. 💪"
  ]
};

// Keywords to match difficulties to categories
const categoryKeywords: Record<string, string[]> = {
  overwhelm: ["don't know where", "overwhelm", "too much", "so much", "where to start", "complicated"],
  perfectionism: ["perfect", "not good enough", "scared it won't be good", "right way", "correctly"],
  fear: ["fail", "mess up", "what if", "scared", "afraid", "nervous", "anxiety", "worried"],
  tired: ["tired", "exhausted", "no energy", "sleepy", "worn out", "drained"],
  no_time: ["no time", "busy", "too much to do", "schedule", "time"],
  phone_anxiety: ["phone", "call", "calling", "dentist", "doctor", "appointment"],
  forget: ["forget", "remember", "remembering", "forgetful"],
  boring: ["boring", "tedious", "dull", "hate doing", "don't want to"],
};

export function matchDifficultyToCategory(difficultyText: string | null): string {
  if (!difficultyText) return 'general';
  
  const lowerText = difficultyText.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return category;
      }
    }
  }
  
  return 'general';
}

export function getRandomPeptalk(
  category: string,
  stats: { feedCount: number; waterCount: number; playCount: number; completedCount: number }
): string {
  const peptalks = peptalkDatabase[category] || peptalkDatabase.general;
  const randomIndex = Math.floor(Math.random() * peptalks.length);
  let peptalk = peptalks[randomIndex];
  
  // Replace placeholders
  peptalk = peptalk.replace(/{feedCount}/g, stats.feedCount.toString());
  peptalk = peptalk.replace(/{waterCount}/g, stats.waterCount.toString());
  peptalk = peptalk.replace(/{playCount}/g, stats.playCount.toString());
  peptalk = peptalk.replace(/{completedCount}/g, stats.completedCount.toString());
  
  return peptalk;
}
