import React from 'react';
import { useFormContext, Control } from 'react-hook-form';
import { Entry } from '../../../lib/civilify-kb-schemas';
import { ConstitutionProvisionForm } from './ConstitutionProvisionForm';
import { StatuteSectionForm } from './StatuteSectionForm';
import { CityOrdinanceForm } from './CityOrdinanceForm';
import { RuleOfCourtForm } from './RuleOfCourtForm';
import { AgencyCircularForm } from './AgencyCircularForm';
import { DojIssuanceForm } from './DojIssuanceForm';
import { ExecutiveIssuanceForm } from './ExecutiveIssuanceForm';
import { RightsAdvisoryForm } from './RightsAdvisoryForm';

interface TypeSpecificFormProps {
  type: Entry['type'];
}

// Component registry for dynamic form rendering
const COMPONENTS: Record<Entry['type'], React.FC<{control: Control<Entry>}>> = {
  constitution_provision: ConstitutionProvisionForm,
  statute_section: StatuteSectionForm,
  city_ordinance_section: CityOrdinanceForm,
  rule_of_court: RuleOfCourtForm,
  agency_circular: AgencyCircularForm,
  doj_issuance: DojIssuanceForm,
  executive_issuance: ExecutiveIssuanceForm,
  rights_advisory: RightsAdvisoryForm,
};

export function TypeSpecificForm({ type }: TypeSpecificFormProps) {
  const { control } = useFormContext<Entry>();
  
  const Component = COMPONENTS[type];
  
  if (!Component) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Unknown entry type: {type}</p>
      </div>
    );
  }

  return <Component control={control} />;
}

