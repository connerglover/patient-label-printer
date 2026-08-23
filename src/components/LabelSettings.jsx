import { useState } from 'react';
import { ChevronDown, Minus, Plus, Settings2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import LabelPreview from '@/components/LabelPreview';
import { FONT_OPTIONS, LABEL_PRESETS } from '@/utils/pdfGenerator';
import { cn } from '@/lib/utils';

const MAX_COPIES = 20;

function matchPreset([width, height]) {
  return (
    LABEL_PRESETS.find((preset) => preset.size[0] === width && preset.size[1] === height)?.id ??
    'custom'
  );
}

export function LabelSettings({ config, onConfigChange }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const activePreset = matchPreset(config.pageGeometry);

  const update = (patch) => onConfigChange({ ...config, ...patch });

  const setDimension = (index, rawValue) => {
    const next = [...config.pageGeometry];
    // Keep the raw string while typing so the field doesn't fight the user;
    // the generator validates before it draws anything.
    next[index] = rawValue === '' ? '' : Number(rawValue);
    update({ pageGeometry: next });
  };

  const setCopies = (value) => {
    update({ pagesPerPatient: Math.min(MAX_COPIES, Math.max(1, value)) });
  };

  return (
    <div className="space-y-6">
      <LabelPreview config={config} />

      {/* Label stock */}
      <div className="space-y-2">
        <Label htmlFor="preset">Label stock</Label>
        <Select
          id="preset"
          value={activePreset}
          onChange={(event) => {
            const preset = LABEL_PRESETS.find((item) => item.id === event.target.value);
            if (preset) update({ pageGeometry: [...preset.size] });
          }}
        >
          {LABEL_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name} — {preset.size[0]}″ × {preset.size[1]}″
            </option>
          ))}
          <option value="custom" disabled={activePreset !== 'custom'}>
            Custom size
          </option>
        </Select>
        <p className="text-xs text-muted-foreground">
          {LABEL_PRESETS.find((preset) => preset.id === activePreset)?.note ??
            'Dimensions set by hand below'}
        </p>
      </div>

      {/* Copies per patient */}
      <div className="space-y-2">
        <Label htmlFor="copies">Labels per patient</Label>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCopies(config.pagesPerPatient - 1)}
            disabled={config.pagesPerPatient <= 1}
            aria-label="One fewer label per patient"
          >
            <Minus />
          </Button>
          <Input
            id="copies"
            type="number"
            min="1"
            max={MAX_COPIES}
            value={config.pagesPerPatient}
            onChange={(event) => setCopies(parseInt(event.target.value, 10) || 1)}
            className="tabular text-center"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCopies(config.pagesPerPatient + 1)}
            disabled={config.pagesPerPatient >= MAX_COPIES}
            aria-label="One more label per patient"
          >
            <Plus />
          </Button>
        </div>
      </div>

      {/* Dimensions */}
      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium">Dimensions (inches)</legend>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="width" className="text-xs font-normal text-muted-foreground">
              Width
            </Label>
            <Input
              id="width"
              type="number"
              min="0.25"
              max="8.5"
              step="0.125"
              value={config.pageGeometry[0]}
              onChange={(event) => setDimension(0, event.target.value)}
              className="tabular"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="height" className="text-xs font-normal text-muted-foreground">
              Height
            </Label>
            <Input
              id="height"
              type="number"
              min="0.25"
              max="11"
              step="0.125"
              value={config.pageGeometry[1]}
              onChange={(event) => setDimension(1, event.target.value)}
              className="tabular"
            />
          </div>
        </div>
      </fieldset>

      {/* Filename */}
      <div className="space-y-2">
        <Label htmlFor="filename">File name</Label>
        <Input
          id="filename"
          type="text"
          value={config.filename}
          onChange={(event) => update({ filename: event.target.value })}
          placeholder="Patient_Labels.pdf"
          spellCheck={false}
        />
      </div>

      {/* Advanced */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-between px-2">
            <span className="flex items-center gap-2">
              <Settings2 />
              Typography &amp; spacing
            </span>
            <ChevronDown className={cn('transition-transform', showAdvanced && 'rotate-180')} />
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down">
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="font-family" className="text-xs font-normal text-muted-foreground">
                  Font
                </Label>
                <Select
                  id="font-family"
                  value={config.fontName}
                  onChange={(event) => update({ fontName: event.target.value })}
                >
                  {FONT_OPTIONS.map((font) => (
                    <option key={font.value} value={font.value}>
                      {font.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="font-size" className="text-xs font-normal text-muted-foreground">
                  Size (pt)
                </Label>
                <Input
                  id="font-size"
                  type="number"
                  min="5"
                  max="24"
                  step="0.5"
                  value={config.fontSize}
                  onChange={(event) => update({ fontSize: Number(event.target.value) || 10 })}
                  className="tabular"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="margin" className="text-xs font-normal text-muted-foreground">
                  Margin (in)
                </Label>
                <Input
                  id="margin"
                  type="number"
                  min="0"
                  max="1"
                  step="0.02"
                  value={config.margin}
                  onChange={(event) => update({ margin: Number(event.target.value) || 0 })}
                  className="tabular"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="line-height" className="text-xs font-normal text-muted-foreground">
                  Line height (in)
                </Label>
                <Input
                  id="line-height"
                  type="number"
                  min="0.1"
                  max="1"
                  step="0.02"
                  value={config.lineHeight}
                  onChange={(event) => update({ lineHeight: Number(event.target.value) || 0.22 })}
                  className="tabular"
                />
              </div>
            </div>

            <p className="text-xs text-pretty text-muted-foreground">
              Text shrinks automatically if a long name won’t fit the label, so nothing clips.
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export default LabelSettings;
