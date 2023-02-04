import React from 'react';
import { SingleSelect, NumberSelector, RadioList, Checkbox, TextBox } from '@veupathdb/wdk-client/lib/Components';
import { FeaturesList, ComponentsList } from './SequenceFormElements';
import * as ComponentUtils from '@veupathdb/wdk-client/lib/Utils/ComponentUtils';
import * as ReporterUtils from '@veupathdb/wdk-client/lib/Views/ReporterForm/reporterUtils';
import createSequenceForm from './SequenceFormFactory';

let util = Object.assign({}, ComponentUtils, ReporterUtils);


/*
 * Taken from SequenceGeneReporterForm and adapted:
 * - similar to the protein region toggle in choice
 * - has "nucleotides" as unit, like in sequence region toggle
 */
let anchorValues = [
  { value: 'DownstreamFromStart', display: 'Downstream from Start' },
  { value: 'UpstreamFromEnd', display: 'Upstream from End' }
];

let SequenceRegionRange = props => {
  let { label, anchor, sign, offset, formState, getUpdateHandler } = props;
  return (
    <React.Fragment>
      <span>{label}</span>
      <SingleSelect name={anchor} value={formState[anchor]}
          onChange={getUpdateHandler(anchor)} items={anchorValues}/>
      <NumberSelector name={offset} value={formState[offset]}
          start={0} end={10000} step={1}
          onChange={getUpdateHandler(offset)} size="6"/>
      nucleotides
    </React.Fragment>
  );
};
/*
 * Taken from BedAndSequenceGeneReporterForm and adapted:
 * - no reverse & complement checkbox here, because we have a global "strand" toggle
 */
let GenomicSequenceRegionInputs = props => {
  let { formState, getUpdateHandler } = props;
  return (
    <div>
      <div
        style={{
          display: 'inline-grid',
          gridTemplateColumns: 'repeat(5, auto)',
          alignItems: 'center',
          gridRowGap: '0.25em',
          gridColumnGap: '0.5em',
          marginLeft: '0.75em'
        }}
      >
        <SequenceRegionRange label="Begin at" anchor="upstreamAnchor" sign="upstreamSign"
          offset="upstreamOffset" formState={formState} getUpdateHandler={getUpdateHandler}/>
        <SequenceRegionRange label="End at" anchor="downstreamAnchor" sign="downstreamSign"
          offset="downstreamOffset" formState={formState} getUpdateHandler={getUpdateHandler}/>
      </div>
    </div>
  );
};

let strands = [
  {  value: "forward", display: 'Forward' },
  {  value: "reverse", display: 'Reverse' }
];

let sequenceFeatureOptions = [
  { value: 'low_complexity', display: 'Low Complexity Regions' },
  { value: 'repeats', display: 'Repeats' },
  { value: 'tandem', display: 'Tandem Repeats' },
  { value: 'centromere', display: 'Centromere' }
];
let resultTypes = [
  { value: 'genomic_range', display: 'Sequence Region' },
  { value: 'genomic_features', display: 'Sequence Features' },
];

/** @type import('./Types').ReporterFormComponent */
const formBeforeCommonOptions = (props) => {
  let { formState, updateFormState, onSubmit, includeSubmit } = props;
  let getUpdateHandler = fieldName => util.getChangeHandler(fieldName, updateFormState, formState);
  let typeUpdateHandler = function(newTypeValue) {
    updateFormState(Object.assign({}, formState, { type: newTypeValue }));
  };
  let getTypeSpecificParams = () => {
    switch(formState.type) {
      case 'genomic_range':
        return <GenomicSequenceRegionInputs formState={formState} getUpdateHandler={getUpdateHandler}/>;
      case 'genomic_features':
        return <FeaturesList field="genomicFeature" features={sequenceFeatureOptions} formState={formState} getUpdateHandler={getUpdateHandler} />;
    }
  };
  return (
    <React.Fragment>
      <h3>Choose the type of result:</h3>
      <div style={{marginLeft:"2em"}}>
        <RadioList name="resultType" value={formState.resultType}
          onChange={typeUpdateHandler} items={resultTypes}
        />
        <h3>Type-specific Params</h3>
        {getTypeSpecificParams()}
      </div>
      <h3>Strand:</h3>
      <div style={{marginLeft:"2em"}}>
        <RadioList name="strand" value={formState.strand} items={strands}
            onChange={getUpdateHandler('strand')}/>
      </div>
    </React.Fragment>
  );
};

let formAfterSubmitButton = (props) => {
  return (
    <React.Fragment>
    </React.Fragment>
  );
};
let getFormInitialState = () => ({
  resultType: resultTypes[0].value,
  strand: strands[0].value,
  startAnchor: anchorValues[0].value,
  startOffset: 0,
  endAnchor: anchorValues[1].value,
  endOffset: 0,
  sequenceFeature: sequenceFeatureOptions[0].value,
});

let SequenceGenomicSequenceReporterForm = createSequenceForm(formBeforeCommonOptions, formAfterSubmitButton, getFormInitialState, 'Sequences');
let BedGenomicSequenceReporterForm = createSequenceForm(formBeforeCommonOptions, formAfterSubmitButton, getFormInitialState, 'Coordinates');
export {SequenceGenomicSequenceReporterForm, BedGenomicSequenceReporterForm};



