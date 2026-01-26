export interface Student {
  id: string;
  name: string;
  batch: string;
  wpm: number;
  accuracy: number;
  errors: number;
  finalScore: number;
  timestamp: string;
  rank?: number;
}

export interface Batch {
  batchId: string;
  batchName: string;
  students: string[];
  createdAt: string;
}

export interface ComparisonResult {
  winner: Student | null;
  metrics: {
    metric: string;
    studentA: number | string;
    studentB: number | string;
    winner: 'A' | 'B' | 'Tie';
  }[];
  explanation: string;
  motivationForLoser: string;
}
