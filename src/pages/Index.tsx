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
import { AnalyticsDashboard } from '@/components/Analytics/AnalyticsDashboard';
import { CSVImportModal } from '@/components/Import/CSVImportModal';
import { useCompetition } from '@/store/CompetitionContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Student } from '@/types';
import { exportResultsToPDF } from '@/utils/pdfExport';
import { ArrowLeftRight, FileDown, BarChart3, Trophy } from 'lucide-react';

const Index = () => {
  const { getRankedStudents, activeBatchId, deleteStudent, batches, getBatchById } = useCompetition();
  
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareStudent, setCompareStudent] = useState<Student | null>(null);

  const rankedStudents = getRankedStudents(activeBatchId);
  const activeBatch = activeBatchId ? getBatchById(activeBatchId) : null;

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

  const handleExportPDF = () => {
    exportResultsToPDF(rankedStudents, activeBatch?.batchName);
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
          <CSVImportModal />
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
          <Button 
            variant="outline" 
            onClick={handleExportPDF}
            className="gap-2"
            disabled={rankedStudents.length === 0}
          >
            <FileDown className="h-4 w-4" />
            Export PDF
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

        {/* Main Content with Tabs */}
        {batches.length > 0 && (
          <Tabs defaultValue="rankings" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="rankings" className="gap-2">
                <Trophy className="h-4 w-4" />
                Rankings
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="rankings" className="space-y-6">
              <TopWinnersPanel students={rankedStudents} />
              
              <div className="card-elevated p-4">
                <h2 className="text-lg font-semibold mb-4">
                  Full Rankings
                  {activeBatchId && (
                    <span className="text-muted-foreground font-normal text-sm ml-2">
                      (Filtered by {activeBatch?.batchName})
                    </span>
                  )}
                </h2>
                <RankingTable
                  students={rankedStudents}
                  onViewStudent={handleViewStudent}
                  onDeleteStudent={handleDeleteStudent}
                />
              </div>
            </TabsContent>

            <TabsContent value="analytics">
              <AnalyticsDashboard />
            </TabsContent>
          </Tabs>
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
