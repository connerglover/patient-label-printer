import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Trash2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const PatientList = ({ patients, onRemovePatient }) => {
  const [selectedPatients, setSelectedPatients] = useState(new Set());

  const togglePatientSelection = (index) => {
    const newSelected = new Set(selectedPatients);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedPatients(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedPatients.size === patients.length) {
      setSelectedPatients(new Set());
    } else {
      setSelectedPatients(new Set(patients.map((_, index) => index)));
    }
  };

  const removeSelectedPatients = () => {
    const indicesToRemove = Array.from(selectedPatients).sort((a, b) => b - a);
    indicesToRemove.forEach(index => onRemovePatient(index));
    setSelectedPatients(new Set());
  };

  if (!patients || patients.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No patients loaded. Upload an Excel file to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Patient List ({patients.length} patients)
          </CardTitle>
          {selectedPatients.size > 0 && (
            <Button
              onClick={removeSelectedPatients}
              variant="destructive"
              size="sm"
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Remove Selected ({selectedPatients.size})
            </Button>
          )}
        </div>
        {patients.length > 1 && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              checked={selectedPatients.size === patients.length}
              onCheckedChange={toggleSelectAll}
            />
            <Label htmlFor="select-all" className="text-sm">
              Select all
            </Label>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="divide-y">
          {patients.map((patient, index) => (
            <div
              key={index}
              className={cn(
                "p-6 hover:bg-muted/50 transition-colors",
                selectedPatients.has(index) && "bg-primary/5"
              )}
            >
              <div className="flex items-start gap-4">
                <Checkbox
                  checked={selectedPatients.has(index)}
                  onCheckedChange={() => togglePatientSelection(index)}
                  className="mt-1"
                />
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Name</Label>
                    <p className="font-medium">{patient.name}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Patient ID</Label>
                    <p className="font-medium">{patient.id}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Date of Birth</Label>
                    <p className="font-medium">{patient.dob}</p>
                  </div>
                </div>
                <Button
                  onClick={() => onRemovePatient(index)}
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  title="Remove patient"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PatientList;