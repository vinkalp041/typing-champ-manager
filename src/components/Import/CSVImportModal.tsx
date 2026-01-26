import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCompetition } from '@/store/CompetitionContext';
import { calculateFinalScore } from '@/utils/scoring';
import Papa from 'papaparse';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Download } from 'lucide-react';

interface ParsedStudent {
  name: string;
  batch: string;
  wpm: number;
  accuracy: number;
  errors: number;
  valid: boolean;
  error?: string;
}

export function CSVImportModal() {
  const [open, setOpen] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedStudent[]>([]);
  const [defaultBatch, setDefaultBatch] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { addStudent, batches } = useCompetition();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed: ParsedStudent[] = results.data.map((row: any) => {
          const name = (row.name || row.Name || row.NAME || '').trim();
          const batch = (row.batch || row.Batch || row.BATCH || defaultBatch || '').trim();
          const wpm = parseFloat(row.wpm || row.WPM || row.speed || row.Speed || 0);
          const accuracy = parseFloat(row.accuracy || row.Accuracy || row.ACCURACY || 0);
          const errors = parseInt(row.errors || row.Errors || row.ERRORS || 0);

          let valid = true;
          let error = '';

          if (!name) {
            valid = false;
            error = 'Missing name';
          } else if (isNaN(wpm) || wpm < 0 || wpm > 300) {
            valid = false;
            error = 'Invalid WPM';
          } else if (isNaN(accuracy) || accuracy < 0 || accuracy > 100) {
            valid = false;
            error = 'Invalid accuracy';
          }

          return { name, batch, wpm, accuracy, errors: isNaN(errors) ? 0 : errors, valid, error };
        });

        setParsedData(parsed);
      },
      error: (error) => {
        console.error('CSV Parse Error:', error);
      },
    });
  };

  const handleImport = () => {
    setImporting(true);
    
    const validStudents = parsedData.filter(s => s.valid && s.batch);
    
    validStudents.forEach((student) => {
      addStudent({
        name: student.name,
        batch: student.batch,
        wpm: student.wpm,
        accuracy: student.accuracy,
        errors: student.errors,
      });
    });

    setImporting(false);
    setParsedData([]);
    setDefaultBatch('');
    setOpen(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validCount = parsedData.filter(s => s.valid && (s.batch || defaultBatch)).length;
  const invalidCount = parsedData.filter(s => !s.valid).length;
  const noBatchCount = parsedData.filter(s => s.valid && !s.batch && !defaultBatch).length;

  const downloadTemplate = () => {
    const csv = 'name,batch,wpm,accuracy,errors\nRahul Kumar,Batch 1,52,92,8\nPriya Singh,Batch 1,48,95,5\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Upload className="h-4 w-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Students from CSV
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Download */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
            <div className="text-sm">
              <p className="font-medium">Need a template?</p>
              <p className="text-muted-foreground text-xs">Download our CSV template with correct columns</p>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
              <Download className="h-4 w-4" />
              Template
            </Button>
          </div>

          {/* File Input */}
          <div>
            <label className="text-sm font-medium mb-2 block">Select CSV File</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:font-medium hover:file:bg-primary/90 file:cursor-pointer"
            />
          </div>

          {/* Default Batch Selector */}
          {parsedData.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Default Batch (for rows without batch)</label>
              <Select value={defaultBatch} onValueChange={setDefaultBatch}>
                <SelectTrigger>
                  <SelectValue placeholder="Select default batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((batch) => (
                    <SelectItem key={batch.batchId} value={batch.batchName}>
                      {batch.batchName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Preview Stats */}
          {parsedData.length > 0 && (
            <div className="p-4 rounded-lg border bg-card">
              <h4 className="font-medium mb-3">Preview ({parsedData.length} rows found)</h4>
              
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{validCount} valid</span>
                </div>
                {invalidCount > 0 && (
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>{invalidCount} invalid</span>
                  </div>
                )}
                {noBatchCount > 0 && (
                  <div className="flex items-center gap-2 text-warning">
                    <AlertCircle className="h-4 w-4" />
                    <span>{noBatchCount} need batch</span>
                  </div>
                )}
              </div>

              {/* Preview Table */}
              <div className="mt-4 max-h-[200px] overflow-auto border rounded">
                <table className="w-full text-xs">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="p-2 text-left">Status</th>
                      <th className="p-2 text-left">Name</th>
                      <th className="p-2 text-left">Batch</th>
                      <th className="p-2 text-right">WPM</th>
                      <th className="p-2 text-right">Acc%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 10).map((student, i) => (
                      <tr key={i} className={student.valid ? '' : 'bg-destructive/10'}>
                        <td className="p-2">
                          {student.valid ? (
                            <CheckCircle2 className="h-3 w-3 text-success" />
                          ) : (
                            <span className="text-destructive text-xs">{student.error}</span>
                          )}
                        </td>
                        <td className="p-2">{student.name || '-'}</td>
                        <td className="p-2">{student.batch || defaultBatch || '-'}</td>
                        <td className="p-2 text-right">{student.wpm}</td>
                        <td className="p-2 text-right">{student.accuracy}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 10 && (
                  <p className="p-2 text-center text-muted-foreground text-xs">
                    ... and {parsedData.length - 10} more rows
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={validCount === 0 || importing}
            >
              {importing ? 'Importing...' : `Import ${validCount} Students`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
