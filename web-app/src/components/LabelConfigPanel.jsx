import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Settings, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

const LabelConfigPanel = ({ config, onConfigChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleChange = (field, value) => {
    const newConfig = { ...config };
    
    if (field === 'pageGeometry') {
      newConfig.pageGeometry = value;
    } else {
      newConfig[field] = value;
    }
    
    onConfigChange(newConfig);
  };

  const handleDimensionChange = (dimension, value) => {
    const newGeometry = [...config.pageGeometry];
    newGeometry[dimension] = parseFloat(value) || 0;
    handleChange('pageGeometry', newGeometry);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Label Configuration
              </CardTitle>
              <ChevronDown
                className={cn(
                  "h-5 w-5 transition-transform",
                  isExpanded && "rotate-180"
                )}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pages per Patient */}
              <div className="space-y-2">
                <Label htmlFor="pages-per-patient">Labels per Patient</Label>
                <Input
                  id="pages-per-patient"
                  type="number"
                  min="1"
                  max="10"
                  value={config.pagesPerPatient}
                  onChange={(e) => handleChange('pagesPerPatient', parseInt(e.target.value) || 1)}
                />
                <p className="text-xs text-muted-foreground">
                  Number of duplicate labels to generate for each patient
                </p>
              </div>

              {/* Filename */}
              <div className="space-y-2">
                <Label htmlFor="filename">Output Filename</Label>
                <Input
                  id="filename"
                  type="text"
                  value={config.filename}
                  onChange={(e) => handleChange('filename', e.target.value)}
                  placeholder="Patient_Labels.pdf"
                />
                <p className="text-xs text-muted-foreground">
                  Name of the generated PDF file
                </p>
              </div>
            </div>

            {/* Label Dimensions */}
            <div className="space-y-3">
              <Label>Label Dimensions (inches)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="width" className="text-xs text-muted-foreground">Width</Label>
                  <Input
                    id="width"
                    type="number"
                    min="0.5"
                    max="8.5"
                    step="0.125"
                    value={config.pageGeometry[0]}
                    onChange={(e) => handleDimensionChange(0, e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height" className="text-xs text-muted-foreground">Height</Label>
                  <Input
                    id="height"
                    type="number"
                    min="0.5"
                    max="11"
                    step="0.125"
                    value={config.pageGeometry[1]}
                    onChange={(e) => handleDimensionChange(1, e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Physical dimensions of each label
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Font Size */}
              <div className="space-y-2">
                <Label htmlFor="font-size">Font Size</Label>
                <Input
                  id="font-size"
                  type="number"
                  min="6"
                  max="24"
                  value={config.fontSize}
                  onChange={(e) => handleChange('fontSize', parseInt(e.target.value) || 10)}
                />
                <p className="text-xs text-muted-foreground">
                  Size of text on labels (points)
                </p>
              </div>

              {/* Font Name */}
              <div className="space-y-2">
                <Label htmlFor="font-family">Font Family</Label>
                <select
                  id="font-family"
                  value={config.fontName}
                  onChange={(e) => handleChange('fontName', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="helvetica">Helvetica</option>
                  <option value="times">Times</option>
                  <option value="courier">Courier</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Font family for label text
                </p>
              </div>
            </div>

            {/* Preview Box */}
            <div className="border-t pt-6 space-y-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <Label className="text-sm font-medium">Label Preview</Label>
              </div>
              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <div 
                    className="bg-background border shadow-sm mx-auto flex items-center justify-center text-xs transition-all"
                    style={{
                      width: `${Math.min(config.pageGeometry[0] * 72, 300)}px`,
                      height: `${Math.min(config.pageGeometry[1] * 72, 150)}px`,
                      fontSize: `${Math.min(config.fontSize, 12)}px`,
                      fontFamily: config.fontName === 'helvetica' ? 'Arial, sans-serif' : 
                                 config.fontName === 'times' ? 'Times, serif' : 
                                 'Courier, monospace'
                    }}
                  >
                    <div className="text-center leading-tight transform rotate-90">
                      <div>Name: Sample Patient</div>
                      <div>ID: 12345</div>
                      <div>DOB: 01/01/1990</div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    {config.pageGeometry[0]}" × {config.pageGeometry[1]}" - {config.pagesPerPatient} copy{config.pagesPerPatient !== 1 ? 'ies' : ''} per patient
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default LabelConfigPanel;