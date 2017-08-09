import React from 'react';
import PropTypes from 'prop-types';
import { zip } from 'lodash';
import FilterParamNew from './FilterParamNew';
import FlatVocabParam from './FlatVocabParam';
import StringParam from './StringParam';
import DateParam from './DateParam';
import DateRangeParam from './DateRangeParam';
import NumberParam from './NumberParam';
import NumberRangeParam from './NumberRangeParam'
import { Icon, Loading, Sticky, Tooltip } from 'wdk-client/Components';
import { Seq } from 'wdk-client/IterableUtils';

/**
 * QuestionWizard component
 */
export default function QuestionWizard(props) {
  const {
    question,
    paramValues,
    activeGroup
  } = props;

  return (
    <div className={makeClassName() + ' show-scrollbar'}>
      <div className={makeClassName('HeadingContainer')}>
        <h1 className={makeClassName('Heading')}>{question.displayName}</h1>
        {/* FIXME Remove when we get this from the model */}
        <div className={makeClassName('HackyStudyLink')}>
          <i className="fa fa-info-circle" aria-hidden="true"></i> Learn about the <a href="/a/app/record/dataset/DS_61ac5d073c" target="_blank">MAL-ED Study</a>
        </div>
      </div>
      <Navigation {...props} />
      {activeGroup == null ? (
        <div className={makeClassName('ActiveGroupContainer')}>
          <p className={makeClassName('HelpText')}>
            {question.summary}
          </p>
        </div>
      ) : (
        <ActiveGroup {...props} />
      )}
      <input type="hidden" name="questionFullName" value={question.name}/>
      <input type="hidden" name="questionSubmit" value="Get Answer"/>
      {question.parameters.map(param => (
        <input key={param.name} type="hidden" name={`value(${param.name})`} value={paramValues[param.name]}/>
      ))}
    </div>
  )
}

QuestionWizard.propTypes = {
  question: PropTypes.object.isRequired,
  customName: PropTypes.string,
  paramValues: PropTypes.object.isRequired,
  paramUIState: PropTypes.object.isRequired,
  groupUIState: PropTypes.object.isRequired,
  recordClass: PropTypes.object.isRequired,
  activeGroup: PropTypes.object,
  initialCount: PropTypes.number,
  onActiveGroupChange: PropTypes.func.isRequired,
  onActiveOntologyTermChange: PropTypes.func.isRequired,
  onParamValueChange: PropTypes.func.isRequired,
  onUpdateInvalidGroupCounts: PropTypes.func.isRequired
};

/**
 * Parameters for the active group
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

  const defaultValuesMap = new Map(question.parameters.map(p => [p.name, p.defaultValue]));
  const isDefaults = activeGroup.parameters.every(pName => paramValues[pName] === defaultValuesMap.get(pName));
  const { accumulatedTotal, loading } = groupUIState[activeGroup.name];
  const { accumulatedTotal: prevAccumulatedTotal, loading: prevLoading } = Seq.of({ accumulatedTotal: initialCount })
    .concat(Seq.from(question.groups)
      .takeWhile(group => group !== activeGroup)
      .map(group => groupUIState[group.name]))
    .last();

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
              prevLoading ? <Loading radius={2} className={makeClassName('GroupLoading')}/> : prevAccumulatedTotal
            } {recordClass.displayNamePlural} to {
              loading ? <Loading radius={2} className={makeClassName('GroupLoading')}/> : accumulatedTotal
            }
          </div>
        )}
        {activeGroup.description && (
          <div className={makeClassName('ActiveGroupDescription')}>{activeGroup.description}</div>
        )}
      </div>

      <div
        className={makeClassName('ParamContainer')}
        onKeyPress={event => {
          if (event.key === 'Enter') {
            event.preventDefault();
          }
        }}
      >
        {activeGroup.parameters.map(paramName => {
          const param = question.parameters.find(p => p.name === paramName);

          if (!param.isVisible) return null;

          const ParamComponent = findParamComponent(param);
          return (
            <div key={paramName} className={makeClassName('Param', param.type)}>
              <div className={makeClassName('ParamLabel', param.type)}>
                <label>{param.displayName}</label>
              </div>
              <div className={makeClassName('ParamHelp', param.type)}>
                <Tooltip content={param.help}>
                  <Icon type="help"/>
                </Tooltip>
              </div>
              <div className={makeClassName('ParamControl', param.type)}>
                <ParamComponent
                  param={param}
                  value={paramValues[param.name]}
                  uiState={paramUIState[param.name]}
                  onActiveOntologyTermChange={onActiveOntologyTermChange}
                  onParamValueChange={onParamValueChange}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

ActiveGroup.propTypes = QuestionWizard.propTypes;


export const paramPropTypes = {
  param: PropTypes.object.isRequired,
  value: PropTypes.string.isRequired,
  uiState: PropTypes.object.isRequired,
  onActiveOntologyTermChange: PropTypes.func.isRequired,
  onParamValueChange: PropTypes.func.isRequired,
  autoFocus: PropTypes.bool
}

/**
 * GroupList component
 */
function Navigation(props) {
  const {
    activeGroup,
    question,
    customName,
    showHelpText,
    groupUIState,
    recordClass,
    initialCount,
    onActiveGroupChange,
    onUpdateInvalidGroupCounts
  } = props;
  const { groups } = question;
  const invalid = Object.values(groupUIState).some(uiState => uiState.valid === false);

  const finalCountState = Seq.of({ accumulatedTotal: initialCount })
    .concat(Seq.from(groups)
      .map(group => groupUIState[group.name])
      .filter(groupState => 'valid' in groupState))
    .last();

  // A Map from a group to its previous group
  const prevGroupMap = new Map(zip(groups.slice(1), groups.slice(0, -1)));

  return (
    <Sticky
      className={makeClassName('NavigationContainer')}
      fixedClassName={makeClassName('NavigationContainer', 'fixed')}
    >
      <div className={makeClassName('NavigationIconContainer')}>
        <button
          type="button"
          title="See search overview"
          className={makeClassName('Icon', recordClass.name)}
          onClick={() => onActiveGroupChange(null)}
        />
      </div>
      <div className={makeClassName('ParamGroupSeparator')}>
        <div className={makeClassName('ParamGroupArrow')}/>
        <ParamGroupCount
          title={`All ${recordClass.displayNamePlural}`}
          count={initialCount}
          isActive={activeGroup == groups[0]}
        />
      </div>

      {Seq.from(groups).flatMap(group => [(
        <div
          key={group.name}
          className={makeClassName('ParamGroup', group === activeGroup && 'active')}
        >
          <button
            type="button"
            title={`Filter ${recordClass.displayNamePlural} by ${group.displayName}`}
            className={makeClassName(
              'ParamGroupButton',
              group == activeGroup && 'active'
            )}
            onClick={() => onActiveGroupChange(group)}
          >
            {group.displayName}
          </button>
          {showHelpText && activeGroup == null && group === groups[0] && (
            <div className={makeClassName('GetStarted')}>
              Click to get started. <em>(skipping ahead is ok)</em>
            </div>
          )}
        </div>
      ), group !== groups[groups.length - 1] && (
        <div key={group.name + '__sep'} className={makeClassName('ParamGroupSeparator')}>
          <div className={makeClassName('ParamGroupArrow')}/>
          <ParamGroupCount
            title={`${recordClass.displayNamePlural} selected from previous steps.`}
            count={groupUIState[group.name].accumulatedTotal}
            isLoading={groupUIState[group.name].loading}
            isValid={groupUIState[group.name].valid}
            isActive={(group === activeGroup || group === prevGroupMap.get(activeGroup))}
          />
        </div>
      )])}
      <div className={makeClassName('SubmitContainer')}>
        <button
          className={makeClassName('SubmitButton')}
          title="View the results of your search for further analysis."
        >
          { finalCountState.accumulatedTotal == null || finalCountState.loading ? <Loading radius={4} className={makeClassName('ParamGroupCountLoading')}/>
          : finalCountState.valid === false ? `View ? ${recordClass.displayNamePlural}`
          : `View ${finalCountState.accumulatedTotal} ${recordClass.displayNamePlural}` }
        </button>
        <input className={makeClassName('CustomNameInput')} defaultValue={customName} type="text" name="customName" placeholder="Name this search"/>
      </div>
      {invalid && (
        <div className={makeClassName('InvalidCounts')}>
          <button
            type="button"
            className="wdk-Link"
            onClick={onUpdateInvalidGroupCounts}
            title="Recompute invalid counts above"
          >
            <Icon className="fa fa-refresh"/> Refresh counts
          </button>
        </div>
      )}
    </Sticky>
  )
}

Navigation.propTypes = QuestionWizard.propTypes;

/**
 * Param component
 */
function Param(props) {
  return (
    <div className={makeClassName('Param')}>
      {props.param.displayName} {props.param.defaultValue}
    </div>
  )
}

Param.propTypes = paramPropTypes;

/** Render count or loading */
function ParamGroupCount(props) {
  return (
    <div title={props.title}
      className={makeClassName(
        'ParamGroupCount',
        props.isValid === false && 'invalid',
        props.isActive && 'active'
      )}
    >
      {props.isLoading === true ? (
        <Loading radius={2} className={makeClassName('ParamGroupCountLoading')}/>
      ) : (props.isValid === false ? '?' : props.count)}
    </div>
  )
}

ParamGroupCount.propTypes = {
  title: PropTypes.string,
  count: PropTypes.number,
  isValid: PropTypes.bool,
  isLoading: PropTypes.bool,
  isActive: PropTypes.bool
};

/**
 * Lookup Param component by param type
 */
function findParamComponent(param) {
  switch(param.type) {
    case 'FilterParamNew': return FilterParamNew;
    case 'StringParam': return StringParam;
    case 'EnumParam': return FlatVocabParam;
    case 'FlatVocabParam': return FlatVocabParam;
    case 'DateParam': return DateParam;
    case 'DateRangeParam': return DateRangeParam;
    case 'NumberParam': return NumberParam;
    case 'NumberRangeParam': return NumberRangeParam;
    default: return Param;
  }
}

/**
 * Make a className string
 */
function makeClassName(element = '', ...modifiers) {
  const className = 'ebrc-QuestionWizard' + element;
  const modifiedClassNames = modifiers.filter(modifier => modifier).map(function(modifier) {
    return ' ' + className + '__' + modifier;
  }).join('');

  return className + modifiedClassNames;
}
