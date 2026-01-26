import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Student, Batch } from '@/types';
import { calculateFinalScore, rankStudents } from '@/utils/scoring';

interface State {
  students: Student[];
  batches: Batch[];
  activeBatchId: string | null;
}

type Action =
  | { type: 'ADD_STUDENT'; payload: Omit<Student, 'id' | 'finalScore' | 'timestamp'> }
  | { type: 'DELETE_STUDENT'; payload: string }
  | { type: 'CREATE_BATCH'; payload: { batchName: string } }
  | { type: 'DELETE_BATCH'; payload: string }
  | { type: 'SET_ACTIVE_BATCH'; payload: string | null }
  | { type: 'LOAD_STATE'; payload: State };

const initialState: State = {
  students: [],
  batches: [],
  activeBatchId: null,
};

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_STUDENT': {
      const newStudent: Student = {
        ...action.payload,
        id: generateId(),
        finalScore: calculateFinalScore(action.payload.wpm, action.payload.accuracy),
        timestamp: new Date().toISOString(),
      };

      const updatedStudents = [...state.students, newStudent];
      
      // Update batch with new student
      const updatedBatches = state.batches.map(batch =>
        batch.batchName === newStudent.batch
          ? { ...batch, students: [...batch.students, newStudent.id] }
          : batch
      );

      return {
        ...state,
        students: updatedStudents,
        batches: updatedBatches,
      };
    }

    case 'DELETE_STUDENT': {
      const studentToDelete = state.students.find(s => s.id === action.payload);
      if (!studentToDelete) return state;

      return {
        ...state,
        students: state.students.filter(s => s.id !== action.payload),
        batches: state.batches.map(batch => ({
          ...batch,
          students: batch.students.filter(id => id !== action.payload),
        })),
      };
    }

    case 'CREATE_BATCH': {
      const newBatch: Batch = {
        batchId: generateId(),
        batchName: action.payload.batchName,
        students: [],
        createdAt: new Date().toISOString(),
      };

      return {
        ...state,
        batches: [...state.batches, newBatch],
        activeBatchId: state.activeBatchId || newBatch.batchId,
      };
    }

    case 'DELETE_BATCH': {
      const batchToDelete = state.batches.find(b => b.batchId === action.payload);
      if (!batchToDelete) return state;

      return {
        ...state,
        batches: state.batches.filter(b => b.batchId !== action.payload),
        students: state.students.filter(s => s.batch !== batchToDelete.batchName),
        activeBatchId: state.activeBatchId === action.payload ? null : state.activeBatchId,
      };
    }

    case 'SET_ACTIVE_BATCH':
      return {
        ...state,
        activeBatchId: action.payload,
      };

    case 'LOAD_STATE':
      return action.payload;

    default:
      return state;
  }
}

interface CompetitionContextType extends State {
  addStudent: (student: Omit<Student, 'id' | 'finalScore' | 'timestamp'>) => void;
  deleteStudent: (id: string) => void;
  createBatch: (batchName: string) => void;
  deleteBatch: (batchId: string) => void;
  setActiveBatch: (batchId: string | null) => void;
  getRankedStudents: (batchFilter?: string | null) => Student[];
  getStudentById: (id: string) => Student | undefined;
  getBatchById: (id: string) => Batch | undefined;
}

const CompetitionContext = createContext<CompetitionContextType | undefined>(undefined);

const STORAGE_KEY = 'tcm_competition_data';

export function CompetitionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        dispatch({ type: 'LOAD_STATE', payload: parsed });
      } catch (e) {
        console.error('Failed to load saved state:', e);
      }
    }
  }, []);

  // Save to localStorage on state change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addStudent = (student: Omit<Student, 'id' | 'finalScore' | 'timestamp'>) => {
    dispatch({ type: 'ADD_STUDENT', payload: student });
  };

  const deleteStudent = (id: string) => {
    dispatch({ type: 'DELETE_STUDENT', payload: id });
  };

  const createBatch = (batchName: string) => {
    dispatch({ type: 'CREATE_BATCH', payload: { batchName } });
  };

  const deleteBatch = (batchId: string) => {
    dispatch({ type: 'DELETE_BATCH', payload: batchId });
  };

  const setActiveBatch = (batchId: string | null) => {
    dispatch({ type: 'SET_ACTIVE_BATCH', payload: batchId });
  };

  const getRankedStudents = (batchFilter?: string | null): Student[] => {
    let filtered = state.students;
    if (batchFilter) {
      const batch = state.batches.find(b => b.batchId === batchFilter);
      if (batch) {
        filtered = state.students.filter(s => s.batch === batch.batchName);
      }
    }
    return rankStudents(filtered);
  };

  const getStudentById = (id: string): Student | undefined => {
    return state.students.find(s => s.id === id);
  };

  const getBatchById = (id: string): Batch | undefined => {
    return state.batches.find(b => b.batchId === id);
  };

  return (
    <CompetitionContext.Provider
      value={{
        ...state,
        addStudent,
        deleteStudent,
        createBatch,
        deleteBatch,
        setActiveBatch,
        getRankedStudents,
        getStudentById,
        getBatchById,
      }}
    >
      {children}
    </CompetitionContext.Provider>
  );
}

export function useCompetition() {
  const context = useContext(CompetitionContext);
  if (!context) {
    throw new Error('useCompetition must be used within CompetitionProvider');
  }
  return context;
}
