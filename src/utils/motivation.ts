import { Student, ComparisonResult } from '@/types';

/**
 * Generate motivation message for the student who lost
 */
export function getMotivationMessage(student: Student, opponent: Student): string {
  const scoreDiff = Math.abs(student.finalScore - opponent.finalScore);
  const isCloseLoss = scoreDiff < 3;

  if (isCloseLoss) {
    return "🔥 Bahut close match tha! Thoda sa improvement aur tum jeet sakte the. Keep practicing!";
  }

  if (student.accuracy < opponent.accuracy) {
    return "🎯 Accuracy par kaam karo. Speed ke saath correctness bhi important hai. Focus on typing correctly first.";
  }

  if (student.wpm < opponent.wpm) {
    return "⚡ Speed practice badhao! Daily 30 minutes typing practice se speed definitely improve hogi.";
  }

  if (student.errors > opponent.errors) {
    return "✨ Errors kam karne ki koshish karo. Slow down a bit, accuracy badhao, phir speed se speed.";
  }

  return "💪 Bahut accha attempt tha! Consistent practice se next time better performance hogi.";
}

/**
 * Generate detailed winner explanation
 */
export function generateWinnerExplanation(winner: Student, loser: Student): string {
  const reasons: string[] = [];

  if (winner.finalScore > loser.finalScore) {
    reasons.push(`Higher Final Score (${winner.finalScore} vs ${loser.finalScore})`);
  }

  if (winner.accuracy > loser.accuracy) {
    reasons.push(`Better Accuracy (${winner.accuracy}% vs ${loser.accuracy}%)`);
  }

  if (winner.wpm > loser.wpm) {
    reasons.push(`Faster Typing Speed (${winner.wpm} WPM vs ${loser.wpm} WPM)`);
  }

  if (winner.errors < loser.errors) {
    reasons.push(`Fewer Errors (${winner.errors} vs ${loser.errors})`);
  }

  if (reasons.length === 0) {
    return "Complete tie - Results are identical!";
  }

  return reasons.join(' • ');
}

/**
 * Compare two students and generate full comparison result
 */
export function compareStudents(studentA: Student, studentB: Student): ComparisonResult {
  const metrics = [
    {
      metric: 'WPM (Speed)',
      studentA: studentA.wpm,
      studentB: studentB.wpm,
      winner: studentA.wpm > studentB.wpm ? 'A' : studentA.wpm < studentB.wpm ? 'B' : 'Tie' as 'A' | 'B' | 'Tie',
    },
    {
      metric: 'Accuracy',
      studentA: `${studentA.accuracy}%`,
      studentB: `${studentB.accuracy}%`,
      winner: studentA.accuracy > studentB.accuracy ? 'A' : studentA.accuracy < studentB.accuracy ? 'B' : 'Tie' as 'A' | 'B' | 'Tie',
    },
    {
      metric: 'Errors',
      studentA: studentA.errors,
      studentB: studentB.errors,
      winner: studentA.errors < studentB.errors ? 'A' : studentA.errors > studentB.errors ? 'B' : 'Tie' as 'A' | 'B' | 'Tie',
    },
    {
      metric: 'Final Score',
      studentA: studentA.finalScore,
      studentB: studentB.finalScore,
      winner: studentA.finalScore > studentB.finalScore ? 'A' : studentA.finalScore < studentB.finalScore ? 'B' : 'Tie' as 'A' | 'B' | 'Tie',
    },
  ];

  let winner: Student | null = null;
  let loser: Student | null = null;

  if (studentA.finalScore > studentB.finalScore) {
    winner = studentA;
    loser = studentB;
  } else if (studentB.finalScore > studentA.finalScore) {
    winner = studentB;
    loser = studentA;
  } else if (studentA.accuracy > studentB.accuracy) {
    winner = studentA;
    loser = studentB;
  } else if (studentB.accuracy > studentA.accuracy) {
    winner = studentB;
    loser = studentA;
  } else if (studentA.errors < studentB.errors) {
    winner = studentA;
    loser = studentB;
  } else if (studentB.errors < studentA.errors) {
    winner = studentB;
    loser = studentA;
  }

  const explanation = winner && loser
    ? generateWinnerExplanation(winner, loser)
    : "Complete tie! Both students performed identically. Re-test may be required.";

  const motivationForLoser = winner && loser
    ? getMotivationMessage(loser, winner)
    : "Great effort from both participants!";

  return {
    winner,
    metrics,
    explanation,
    motivationForLoser,
  };
}
