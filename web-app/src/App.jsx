import { useState } from 'react';
import FileUpload from './components/FileUpload';
import PatientList from './components/PatientList';
import LabelConfigPanel from './components/LabelConfigPanel';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ExcelParser } from './utils/excelParser';
import { PDFGenerator, LabelConfig } from './utils/pdfGenerator';
import { AlertCircle, CheckCircle2, Download, FileText, Loader2, RotateCcw, X } from 'lucide-react';

function App() {
  const [patients, setPatients] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [config, setConfig] = useState(new LabelConfig());

  const handleFileSelect = async (file) => {
    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const parser = new ExcelParser(file);
      const parsedPatients = await parser.parseFile();
      setPatients(parsedPatients);
      setSuccess(`Successfully loaded ${parsedPatients.length} patients from ${file.name}`);
    } catch (err) {
      setError(`Error parsing file: ${err.message}`);
      console.error('File parsing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemovePatient = (index) => {
    const newPatients = patients.filter((_, i) => i !== index);
    setPatients(newPatients);
  };

  const handleConfigChange = (newConfig) => {
    setConfig(newConfig);
  };

  const handleGeneratePDF = () => {
    if (patients.length === 0) {
      setError('No patients to generate labels for. Please upload an Excel file first.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const generator = new PDFGenerator(patients, config);
      const filename = generator.downloadPDF();
      const totalLabels = patients.length * config.pagesPerPatient;
      setSuccess(`Successfully generated ${totalLabels} labels and downloaded ${filename}`);
    } catch (err) {
      setError(`Error generating PDF: ${err.message}`);
      console.error('PDF generation error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearAll = () => {
    setPatients([]);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            GreenwayXLS2Label
          </h1>
          <p className="text-lg text-muted-foreground">
            Convert patient data from Excel files to printable PDF labels
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <Alert variant="destructive" className="max-w-4xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setError(null)}
                className="h-4 w-4 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="max-w-4xl mx-auto border-green-200 bg-green-50 text-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="flex items-center justify-between">
              <span>{success}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSuccess(null)}
                className="h-4 w-4 p-0 text-green-600 hover:text-green-800"
              >
                <X className="h-3 w-3" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* File Upload */}
        <div className="flex justify-center">
          <FileUpload onFileSelect={handleFileSelect} isProcessing={isProcessing} />
        </div>

        {/* Label Configuration */}
        {patients.length > 0 && (
          <LabelConfigPanel config={config} onConfigChange={handleConfigChange} />
        )}

        {/* Patient List */}
        {patients.length > 0 && (
          <PatientList patients={patients} onRemovePatient={handleRemovePatient} />
        )}

        {/* Action Buttons */}
        {patients.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleGeneratePDF}
              disabled={isProcessing}
              size="lg"
              className="gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Generate PDF Labels ({patients.length * config.pagesPerPatient} labels)
                </>
              )}
            </Button>

            <Button
              onClick={clearAll}
              disabled={isProcessing}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Clear All
            </Button>
          </div>
        )}

        {/* Getting Started */}
        {patients.length === 0 && (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="text-center py-12 space-y-4">
              <FileText className="mx-auto h-16 w-16 text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">
                  Upload an Excel file to get started
                </h3>
                <p className="text-muted-foreground">
                  Your Excel file should contain patient data with names, IDs, and dates of birth. 
                  The application will automatically parse and generate printable labels.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default App;
