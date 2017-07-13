import * as Wdk from 'wdk-client';

let util = Object.assign({}, Wdk.ComponentUtils, Wdk.ReporterUtils);
let { RadioList, Checkbox } = Wdk.Components;

let FastaOrthoSequenceReporterForm = props => {

  let { formState, updateFormState, onSubmit } = props;
  let getUpdateHandler = fieldName => util.getChangeHandler(fieldName, updateFormState, formState);

  return (
    <div>
      <h3>Output options:</h3>
      <div style={{marginLeft: '2em'}}>
        <div style={{display: 'block'}}>
          <Checkbox value={formState.includeOrganism} onChange={getUpdateHandler('includeOrganism')} /> Only include results with organisms
        </div>
        <div style={{display: 'block'}}>
          <Checkbox value={formState.includeDescription} onChange={getUpdateHandler('includeDescription')} /> Only include results with descriptions
        </div>
      </div>
      <hr/>
      <h3>Download Type:</h3>
      <div style={{marginLeft:"2em"}}>
        <RadioList value={formState.attachmentType} items={util.attachmentTypes}
            onChange={getUpdateHandler('attachmentType')}/>
      </div>
      <div style={{margin:'0.8em'}}>
        <input type="submit" value="Download" onClick={onSubmit}/>
      </div>
    </div>
  );
};


FastaOrthoSequenceReporterForm.getInitialState = () => ({
  formState: {
    attachmentType: 'plain',
    includeOrganism: false,
    includeDescription: false
  },
  formUiState: {}
});

export default FastaOrthoSequenceReporterForm;
