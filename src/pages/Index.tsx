import { useState } from 'react';
import { Header } from '@/components/Common/Header';
import { StatsOverview } from '@/components/Common/StatsOverview';
import { CreateBatchModal } from '@/components/Batch/CreateBatchModal';
import { BatchSelector } from '@/components/Batch/BatchSelector';
import { StudentEntryForm } from '@/components/Student/StudentEntryForm';
import { StudentDetailModal } from '@/components/Student/StudentDetailModal';
import { TopWinnersPanel } from '@/components/Ranking/TopWinnersPanel';
import { RankingTable } from '@/components/Ranking/RankingTable';
import { ComparisonPanel } from '@/components/Comparison/ComparisonPanel';
import { useCompetition } from '@/store/CompetitionContext';
import { Button } from '@/components/ui/button';
import { Student } from '@/types';
import { ArrowLeftRight } from 'lucide-react';

const Index = () => {
  const { getRankedStudents, activeBatchId, deleteStudent, batches } = useCompetition();
  
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareStudent, setCompareStudent] = useState<Student | null>(null);

  const rankedStudents = getRankedStudents(activeBatchId);

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowDetailModal(true);
  };

  const handleCompareFromDetail = (student: Student) => {
    setShowDetailModal(false);
    setCompareStudent(student);
    setShowCompareModal(true);
  };

  const handleDeleteStudent = (id: string) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      deleteStudent(id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <StatsOverview />

        {/* Actions Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <CreateBatchModal />
          <StudentEntryForm />
          <div className="flex-1" />
          <BatchSelector />
          <Button 
            variant="outline" 
            onClick={() => setShowCompareModal(true)}
            className="gap-2"
            disabled={rankedStudents.length < 2}
          >
            <ArrowLeftRight className="h-4 w-4" />
            Compare
          </Button>
        </div>

        {/* Empty State for No Batches */}
        {batches.length === 0 && (
          <div className="text-center py-16 bg-card rounded-xl border">
            <div className="max-w-md mx-auto">
              <h2 className="text-xl font-semibold mb-2">Welcome! Let's Get Started</h2>
              <p className="text-muted-foreground mb-6">
                Create your first batch to start adding students and tracking competition results.
              </p>
              <CreateBatchModal />
            </div>
          </div>
        )}

        {/* Results Section */}
        {batches.length > 0 && (
          <div className="space-y-6">
            <TopWinnersPanel students={rankedStudents} />
            
            <div className="card-elevated p-4">
              <h2 className="text-lg font-semibold mb-4">
                Full Rankings
                {activeBatchId && (
                  <span className="text-muted-foreground font-normal text-sm ml-2">
                    (Filtered)
                  </span>
                )}
              </h2>
              <RankingTable
                students={rankedStudents}
                onViewStudent={handleViewStudent}
                onDeleteStudent={handleDeleteStudent}
              />
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <StudentDetailModal
        student={selectedStudent}
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onCompare={handleCompareFromDetail}
      />

      <ComparisonPanel
        initialStudent={compareStudent}
        open={showCompareModal}
        onClose={() => {
          setShowCompareModal(false);
          setCompareStudent(null);
        }}
      />
    </div>
  );
};

export default Index;
