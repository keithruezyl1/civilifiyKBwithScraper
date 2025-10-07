import React from 'react';
import { Check, FileText, CalendarDays, BookText, Layers, FileCheck } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface Step {
  id: number;
  name: string;
  description: string;
}

interface EntryStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (stepId: number) => void;
}

const getStepIcon = (stepId: number) => {
  switch (stepId) {
    case 1:
      return <FileText className="h-4 w-4" />;
    case 2:
      return <CalendarDays className="h-4 w-4" />;
    case 3:
      return <BookText className="h-4 w-4" />;
    case 4:
      return <Layers className="h-4 w-4" />;
    case 5:
      return <FileCheck className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

export function EntryStepper({ steps, currentStep, onStepClick }: EntryStepperProps) {
  return (
    <aside className="h-full">
      <div>
        <div className="ds-card rounded-2xl shadow-sm border p-5 h-full min-h-[360px] w-full">
          <div className="flex items-center gap-3 mb-8 -mt-1">
            <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Progress</h3>
          </div>
          <ul className="space-y-6">
            {steps.map((step) => {
              const active = currentStep === step.id;
              const complete = currentStep > step.id;
              const icon = getStepIcon(step.id);
              return (
                <li
                  key={step.id}
                  className={cn(
                    "flex items-center gap-5 rounded-token px-4 py-3 my-2 cursor-pointer transition-all duration-200 ring-0",
                    active && "bg-primary/10 outline-none",
                    complete && "opacity-90",
                    !active && !complete && "hover:bg-muted/60"
                  )}
                  onClick={() => onStepClick(step.id)}
                  tabIndex={0}
                >
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 mb-1",
                    active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1 min-h-10 flex flex-col justify-center">
                    <div className={cn(
                      "text-sm font-semibold leading-tight truncate",
                      active ? "text-primary" : "text-foreground"
                    )}>
                      {step.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate leading-relaxed">
                      {step.description}
                    </div>
                  </div>
                  {complete && (
                    <div className="flex-shrink-0">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="mt-7 pt-0">
            <div className="text-sm font-semibold text-foreground mt-3 mb-3">
              Step {currentStep} of {steps.length}
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden mb-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(currentStep / steps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
