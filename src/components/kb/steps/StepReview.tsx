import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Button } from '../../ui/Button';
import { formatDate } from '../../../lib/utils';
import { validateCrossFieldRules, validateRequiredFields, validateEntryIdFormat } from '../../../lib/kb/validation';
import { kbApi } from '../../../services/kbApi';

export function StepReview() {
  const { handleSubmit, formState: { errors, isSubmitting }, getValues } = useFormContext();
  const formData = useWatch();
  const [validationErrors, setValidationErrors] = React.useState<any[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState('');

  // Run validation
  React.useEffect(() => {
    const data = getValues();
    const crossFieldErrors = validateCrossFieldRules(data);
    const requiredErrors = validateRequiredFields(data, data.type || '');
    const entryIdErrors = validateEntryIdFormat(data.entry_id || '', data.type || '');
    
    setValidationErrors([...crossFieldErrors, ...requiredErrors, ...entryIdErrors]);
  }, [formData, getValues]);

  const handleSaveDraft = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      const data = getValues();
      const response = await kbApi.saveDraft(data);
      
      if (response.success) {
        setSaveMessage('Draft saved successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('Failed to save draft');
      }
    } catch (error) {
      setSaveMessage('Error saving draft');
    } finally {
      setIsSaving(false);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const response = await kbApi.submitForReview(data);
      if (response.success) {
        alert('Entry submitted for review successfully!');
      } else {
        alert('Failed to submit entry for review');
      }
    } catch (error) {
      alert('Error submitting entry');
    }
  };

  const onPublish = async (data: any) => {
    try {
      const response = await kbApi.publishEntry(data);
      if (response.success) {
        alert('Entry published successfully!');
      } else {
        alert('Failed to publish entry');
      }
    } catch (error) {
      alert('Error publishing entry');
    }
  };

  const errorCount = validationErrors.filter(e => e.type === 'error').length;
  const warningCount = validationErrors.filter(e => e.type === 'warning').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Review & Publish</h2>
        <p className="text-muted-foreground">Review your entry and submit for review or publish directly.</p>
      </div>

      {/* Validation Summary */}
      {(errorCount > 0 || warningCount > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-medium text-red-900 mb-2">
            Validation Issues ({errorCount} errors, {warningCount} warnings)
          </h3>
          <ul className="text-sm text-red-800 space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index} className={`${error.type === 'warning' ? 'text-yellow-800' : ''}`}>
                • {error.field}: {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-medium text-gray-900 mb-4">Preview</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-lg">{formData.title || 'Untitled Entry'}</h4>
            <p className="text-sm text-gray-600">{formData.canonical_citation || 'No citation'}</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {formData.type || 'Unknown Type'}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {formData.status || 'Unknown Status'}
            </span>
            {formData.visibility?.gli && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                GLI
              </span>
            )}
            {formData.visibility?.cpa && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                CPA
              </span>
            )}
          </div>
          
          <div className="text-sm text-gray-600">
            <p><strong>Effective:</strong> {formData.effective_date ? formatDate(formData.effective_date) : 'Not set'}</p>
            {formData.amendment_date && (
              <p><strong>Amended:</strong> {formatDate(formData.amendment_date)}</p>
            )}
            <p><strong>Last Reviewed:</strong> {formData.last_reviewed ? formatDate(formData.last_reviewed) : 'Not set'}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-700">{formData.summary || 'No summary provided'}</p>
          </div>
          
          {formData.tags && formData.tags.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Tags:</p>
              <div className="flex flex-wrap gap-1">
                {formData.tags.map((tag: string, index: number) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={handleSaveDraft}
          disabled={isSaving}
          variant="outline"
          className="flex-1"
        >
          {isSaving ? 'Saving...' : 'Save Draft'}
        </Button>
        
        <Button
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting || errorCount > 0}
          variant="secondary"
          className="flex-1"
        >
          {isSubmitting ? 'Submitting...' : 'Submit for Review'}
        </Button>
        
        <Button
          onClick={handleSubmit(onPublish)}
          disabled={isSubmitting || errorCount > 0}
          className="flex-1"
        >
          {isSubmitting ? 'Publishing...' : 'Publish Directly'}
        </Button>
      </div>

      {saveMessage && (
        <div className={`p-3 rounded-lg text-sm ${
          saveMessage.includes('successfully') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {saveMessage}
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">Next Steps</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• <strong>Save Draft:</strong> Save your work without submitting</li>
          <li>• <strong>Submit for Review:</strong> Send to reviewers for approval</li>
          <li>• <strong>Publish Directly:</strong> Make immediately available (requires permissions)</li>
        </ul>
      </div>
    </div>
  );
}

