import React from 'react';
import { Control, useFieldArray, useFormContext } from 'react-hook-form';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Textarea } from '../../ui/Textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../ui/Accordion';
import { Trash2, Plus, ChevronDown } from 'lucide-react';

interface Props {
  control: Control<any>;
  path?: string; // default 'phases'
}

export default function IncidentWizard({ control, path = 'phases' }: Props) {
  const { register } = useFormContext();
  const { fields: phases, append: addPhase, remove: removePhase } = useFieldArray({ name: path, control });
  
  const totalSteps = phases.reduce((acc, phase: any) => acc + (phase.steps?.length || 0), 0);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Phases: {phases.length}, Steps: {totalSteps}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => addPhase({ name: '', steps: [{ text: '', legal_bases: [] }] })}
          className="h-11 px-5 rounded-xl"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Phase
        </Button>
      </div>
      
      <Accordion type="multiple" className="space-y-3">
        {phases.map((p, pi) => (
          <AccordionItem key={p.id} value={`phase-${pi}`} className="border rounded-xl">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <span className="font-semibold">Phase {pi + 1}:</span>
                  <Input
                    className="w-64 h-9 px-3 text-sm rounded-lg"
                    placeholder="Phase name"
                    {...register(`${path}.${pi}.name`)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); removePhase(pi); }}
                    className="h-8 w-8 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <ChevronDown className="h-4 w-4 transition-transform" />
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <Steps control={control} path={`${path}.${pi}.steps`} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

function Steps({ control, path }: any) {
  const { register } = useFormContext();
  const { fields, append, remove } = useFieldArray({ name: path, control });
  
  return (
    <div className="space-y-4">
      {fields.map((s, si) => (
        <Card key={s.id} className="border rounded-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Step {si + 1}</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => remove(si)}
                className="h-8 w-8 rounded-lg"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium">Step Text</label>
              <Textarea
                className="mt-1 min-h-[88px] px-4 text-base rounded-xl"
                placeholder="Describe the step..."
                {...register(`${path}.${si}.text`)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Condition (optional)</label>
                <Input
                  className="mt-1 h-11 px-4 text-base rounded-xl"
                  placeholder="When this step applies..."
                  {...register(`${path}.${si}.condition`)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Deadline (optional)</label>
                <Input
                  className="mt-1 h-11 px-4 text-base rounded-xl"
                  placeholder="e.g., within 12 hours"
                  {...register(`${path}.${si}.deadline`)}
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Evidence Required</label>
              <Input
                className="mt-1 h-11 px-4 text-base rounded-xl"
                placeholder="comma-separated evidence items"
                onChange={(e) => register(`${path}.${si}.evidence_required`).onChange({ 
                  target: { value: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) } 
                })}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Failure State (optional)</label>
              <Input
                className="mt-1 h-11 px-4 text-base rounded-xl"
                placeholder="What happens if this step fails..."
                {...register(`${path}.${si}.failure_state`)}
              />
            </div>
          </CardContent>
        </Card>
      ))}
      
      <Button
        type="button"
        variant="outline"
        onClick={() => append({ text: '', legal_bases: [] })}
        className="w-full h-11 px-5 rounded-xl"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Step
      </Button>
    </div>
  );
}



