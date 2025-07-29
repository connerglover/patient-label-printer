import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

const FileUpload = ({ onFileSelect, isProcessing }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!validTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.xls') && !file.name.toLowerCase().endsWith('.xlsx')) {
      alert('Please select a valid Excel file (.xls or .xlsx)');
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card
        className={cn(
          "relative border-2 border-dashed transition-colors cursor-pointer",
          dragActive && "border-primary bg-primary/5",
          !dragActive && "border-muted-foreground/25 hover:border-muted-foreground/50",
          isProcessing && "opacity-50 pointer-events-none"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
      >
        <CardContent className="p-6 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xls,.xlsx"
            onChange={handleChange}
            className="hidden"
            disabled={isProcessing}
          />
          
          <div className="space-y-4">
            <div className="mx-auto h-12 w-12 text-muted-foreground">
              <Upload className="h-12 w-12" />
            </div>
            
            <div className="space-y-2">
              {selectedFile ? (
                <p className="text-sm font-medium text-primary">
                  Selected: {selectedFile.name}
                </p>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-primary cursor-pointer">
                      Click to upload
                    </span>{' '}
                    or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Excel files (.xls, .xlsx) only
                  </p>
                </div>
              )}
            </div>
            
            {!selectedFile && (
              <Button
                onClick={onButtonClick}
                disabled={isProcessing}
                size="sm"
              >
                Choose File
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FileUpload;