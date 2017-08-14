import { Seq } from 'wdk-client/IterableUtils';
import { Loading } from 'wdk-client/Components';
import { propTypes } from './QuestionWizard';
import Parameters from './Parameters';
import { makeQuestionWizardClassName as makeClassName } from '../util/classNames';
import { wrappable } from 'wdk-client/ComponentUtils';

/**
 * Active group section. Includes heading, help text, summary counts, and parameters.
 */
function ActiveGroup(props) {
  if (props.activeGroup == null) return null;

  const {
    question,
    paramValues,
    paramUIState,
    groupUIState,
    recordClass,
    activeGroup,
    initialCount,
    onActiveOntologyTermChange,
    onParamValueChange
  } = props;

  const paramMap = new Map(question.parameters.map(p => [p.name, p]));
  const isDefaults = activeGroup.parameters.every(pName => paramValues[pName] === paramMap.get(pName).defaultValue);
  const { accumulatedTotal, loading } = groupUIState[activeGroup.name];
  const { accumulatedTotal: prevAccumulatedTotal, loading: prevLoading } = Seq.of({ accumulatedTotal: initialCount })
    .concat(Seq.from(question.groups)
      .takeWhile(group => group !== activeGroup)
      .map(group => groupUIState[group.name]))
    .last();
  const parameters = activeGroup.parameters
    .map(paramName => paramMap.get(paramName))
    .filter(param => param.isVisible);

  const loadingEl = <Loading radius={2} className={makeClassName('GroupLoading')}/>;

  return (
    <div className={makeClassName('ActiveGroupContainer')}>
      <div className={makeClassName('ActiveGroupHeading')}>
        {isDefaults ? (
          <div className={makeClassName('ActiveGroupCount')}>
            No <em>{activeGroup.displayName}</em> filters applied yet
          </div>
        ) : (
          <div className={makeClassName('ActiveGroupCount')}>
            Your <em>{activeGroup.displayName}</em> filters reduce {
              (prevLoading ? loadingEl : prevAccumulatedTotal)
            } {recordClass.displayNamePlural} to {
              (loading ? loadingEl : accumulatedTotal)
            }
          </div>
        )}
        {activeGroup.description && (
          <div className={makeClassName('ActiveGroupDescription')}>{activeGroup.description}</div>
        )}
      </div>
      <Parameters
        group={activeGroup}
        parameters={parameters}
        paramValues={paramValues}
        paramUIState={paramUIState}
        onActiveOntologyTermChange={onActiveOntologyTermChange}
        onParamValueChange={onParamValueChange}
      />
    </div>
  );
}

ActiveGroup.propTypes = propTypes;

export default wrappable(ActiveGroup);
