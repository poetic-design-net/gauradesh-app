'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DayOfWeek, DailyProgram, TempleProgram } from '@/lib/db/temples';
import { Plus, Trash2, Clock, FileText } from 'lucide-react';

interface TempleProgramFormProps {
  programs: TempleProgram;
  onChange: (programs: TempleProgram) => void;
}

const DAYS: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export function TempleProgramForm({ programs, onChange }: TempleProgramFormProps) {
  const formatDayName = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  const addProgram = (day: DayOfWeek) => {
    const updatedPrograms = { ...programs };
    updatedPrograms[day] = [
      ...updatedPrograms[day],
      { time: '', activity: '' },
    ];
    onChange(updatedPrograms);
  };

  const removeProgram = (day: DayOfWeek, index: number) => {
    const updatedPrograms = { ...programs };
    updatedPrograms[day] = updatedPrograms[day].filter((_, i) => i !== index);
    onChange(updatedPrograms);
  };

  const updateProgram = (day: DayOfWeek, index: number, field: keyof DailyProgram, value: string) => {
    const updatedPrograms = { ...programs };
    updatedPrograms[day] = updatedPrograms[day].map((program, i) => {
      if (i === index) {
        return { ...program, [field]: value };
      }
      return program;
    });
    onChange(updatedPrograms);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Temple Programs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {DAYS.map((day) => (
            <div key={day} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{formatDayName(day)}</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addProgram(day)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Program
                </Button>
              </div>

              {programs[day].map((program, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="time"
                        value={program.time}
                        onChange={(e) => updateProgram(day, index, 'time', e.target.value)}
                        className="w-32"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        value={program.activity}
                        onChange={(e) => updateProgram(day, index, 'activity', e.target.value)}
                        placeholder="Program activity..."
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive/90"
                    onClick={() => removeProgram(day, index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {programs[day].length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  No programs scheduled for {formatDayName(day)}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
