import React from 'react';
import { CategoriesCheckboxTree, Checkbox, RadioList, ReporterSortMessage } from 'wdk-client/Components';
import * as CategoryUtils from 'wdk-client/Utils/CategoryUtils';
import * as ComponentUtils from 'wdk-client/Utils/ComponentUtils';
import * as ReporterUtils from 'wdk-client/Views/ReporterForm/reporterUtils';
import TabularReporterFormSubmitButtons from './TabularReporterFormSubmitButtons';
import ExcelNote from './ExcelNote';

let util = Object.assign({}, ComponentUtils, ReporterUtils, CategoryUtils);

let TabularReporterForm = props => {

  let { scope, question, recordClass, formState, formUiState, updateFormState, updateFormUiState, onSubmit,  ontology } = props;
  let getUpdateHandler = fieldName => util.getChangeHandler(fieldName, updateFormState, formState);
  let getUiUpdateHandler = fieldName => util.getChangeHandler(fieldName, updateFormUiState, formUiState);

  return (
    <div>
      <ReporterSortMessage scope={scope}/>

      <div className="eupathdb-ReporterForm">
        <div className="eupathdb-ReporterFormGroup eupathdb-ReporterFormGroup__right">
          <CategoriesCheckboxTree
              // title and layout of the tree
              title="Choose Columns"
              searchBoxPlaceholder="Search Columns..."
              tree={util.getAttributeTree(ontology, recordClass.fullName, question)}

              // state of the tree
              selectedLeaves={formState.attributes}
              expandedBranches={formUiState.expandedAttributeNodes}
              searchTerm={formUiState.attributeSearchText}

              // change handlers for each state element controlled by the tree
              onChange={util.getAttributesChangeHandler('attributes', updateFormState, formState, recordClass)}
              onUiChange={getUiUpdateHandler('expandedAttributeNodes')}
              onSearchTermChange={getUiUpdateHandler('attributeSearchText')}
          />
        </div>
        <div className="eupathdb-ReporterFormGroup eupathdb-ReporterFormGroup__left">
          <div>
            <h3>Download Type</h3>
            <div>
              <RadioList value={formState.attachmentType} items={util.tabularAttachmentTypes}
                onChange={getUpdateHandler('attachmentType')}/>
            </div>
          </div>
          <div>
            <h3>Additional Options</h3>
            <div>
              <label>
                <Checkbox value={formState.includeHeader} onChange={getUpdateHandler('includeHeader')}/>
                <span style={{marginLeft:'0.5em'}}>Include header row (column names)</span>
              </label>
            </div>
          </div>
          <div style={{margin:'2em 0'}}>
            <TabularReporterFormSubmitButtons onSubmit={onSubmit} recordClass={recordClass}/>
          </div>
        </div>
      </div>

      <hr/>
      <div style={{margin:'0.5em 2em'}}>
        <ExcelNote/>
      </div>
      <hr/>
    </div>
  );
}

TabularReporterForm.getInitialState = (downloadFormStoreState) => {
  let { scope, question, recordClass, ontology, preferences } = downloadFormStoreState;
  // select all attribs and tables for record page, else column user prefs and no tables
  let allReportScopedAttrs = util.getAllLeafIds(util.getAttributeTree(ontology, recordClass.fullName, question));
  let attribs = util.addPk((scope === 'results' ?
      util.getAttributeSelections(preferences, question, allReportScopedAttrs) :
      allReportScopedAttrs), recordClass);
  return {
    formState: {
      attributes: attribs,
      includeHeader: true,
      attachmentType: "plain"
    },
    formUiState: {
      expandedAttributeNodes: null,
      attributeSearchText: ""
    }
  };
}

export default TabularReporterForm;
