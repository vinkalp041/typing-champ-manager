import { Student } from '@/types';

/**
 * Calculate final score using the formula: wpm * (accuracy / 100)
 */
export function calculateFinalScore(wpm: number, accuracy: number): number {
  return parseFloat((wpm * (accuracy / 100)).toFixed(2));
}

/**
 * Rank students based on finalScore, accuracy, and errors
 * Tie-break order: finalScore DESC → accuracy DESC → errors ASC
 */
export function rankStudents(students: Student[]): Student[] {
  const sorted = [...students].sort((a, b) => {
    // Primary: finalScore DESC
    if (b.finalScore !== a.finalScore) {
      return b.finalScore - a.finalScore;
    }
    // Tie-break 1: accuracy DESC
    if (b.accuracy !== a.accuracy) {
      return b.accuracy - a.accuracy;
    }
    // Tie-break 2: errors ASC
    if (a.errors !== b.errors) {
      return a.errors - b.errors;
    }
    // Complete tie
    return 0;
  });

  return sorted.map((student, index) => ({
    ...student,
    rank: index + 1,
  }));
}

/**
 * Check if two students are in a complete tie (re-test required)
 */
export function isRetestRequired(a: Student, b: Student): boolean {
  return (
    a.finalScore === b.finalScore &&
    a.accuracy === b.accuracy &&
    a.errors === b.errors
  );
}

/**
 * Get rank badge class based on position
 */
export function getRankBadgeClass(rank: number): string {
  switch (rank) {
    case 1:
      return 'rank-gold';
    case 2:
      return 'rank-silver';
    case 3:
      return 'rank-bronze';
    default:
      return 'rank-default';
  }
}
