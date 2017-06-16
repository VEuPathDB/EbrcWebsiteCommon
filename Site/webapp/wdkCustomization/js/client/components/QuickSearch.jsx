import { find, get, map } from 'lodash';
import { Component } from 'react';
import PropTypes from 'prop-types';
import {Tooltip} from 'wdk-client/Components';
import { wrappable } from 'wdk-client/ComponentUtils';

let ParamPropType = PropTypes.shape({
  defaultValue: PropTypes.string.isRequired,
  help: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  alternate: PropTypes.string
});

let ReferencePropType = PropTypes.shape({
  name: PropTypes.string.isRequired,
  paramName: PropTypes.string.isRequired,
  displayName: PropTypes.string.isRequired,
});

let QuestionPropType = PropTypes.shape({
  name: PropTypes.string,
  parameters: PropTypes.arrayOf(ParamPropType)
});

let tooltipPosition = {
  my: 'top center',
  at: 'bottom center'
};

/**
 * Quick search boxes that appear in header
 */
class QuickSearchItem extends Component {

  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.state = { value: undefined };
  }

  componentDidMount() {
    this.setStateFromProps(this.props);
  }

  componentWillReceiveProps(props) {
    this.setStateFromProps(props);
  }

  getStorageKey(props) {
    return 'ebrc::quicksearch::' + props.reference.name;
  }

  getSearchParam(props) {
    return find(get(props, 'question.parameters'),
      p => p.name === props.reference.paramName);
  }

  setStateFromProps(props) {
    let value = window.localStorage.getItem(this.getStorageKey(props));
    this.setState({
      value: value != null ? value : get(this.getSearchParam(props), 'defaultValue')
    });
  }

  handleChange(event) {
    this.setState({ value: event.target.value });
  }

  // Save value on submit
  handleSubmit() {
    window.localStorage.setItem(this.getStorageKey(this.props), this.state.value);
  }

  render() {
    let { question, reference, webAppUrl } = this.props;
    let { displayName } = reference;
    let linkName = reference.alternate || reference.name;
    let searchParam = this.getSearchParam(this.props);

    // if searchParam is null, assume not loaded and render non-functioning
    // placeholder search box, otherwise render functioning search box
    return (
      <div className="quick-search-item" style={{margin: '0 .4em'}} key={reference.name}>
        <Tooltip content={reference.help} position={tooltipPosition}>
          { question == null ? (
            <div>
              <b><a href={webAppUrl + '/showQuestion.do?questionFullName=' + linkName}>{displayName}: </a></b>
              <input
                type="text"
                className="search-box"
                value={this.state.value}
                onChange={this.handleChange}
                name=""
                disabled
              />
              <input
                name="go"
                value="go"
                type="image"
                src={webAppUrl + '/images/mag_glass.png'}
                alt="Click to search"
                width="23"
                height="23"
                className="img_align_middle"
                disabled
              />
            </div>
          ) : (
            <form
              name="questionForm"
              method="post"
              action={webAppUrl + '/processQuestionSetsFlat.do'}
              onSubmit={this.handleSubmit}
            >
              <input type="hidden" name="questionFullName" value={question.name}/>
              <input type="hidden" name="questionSubmit" value="Get Answer"/>
              {question.parameters.map(parameter => {
                if (parameter === searchParam) return null;
                let { defaultValue, type, name } = parameter;
                let typeTag = isStringParam(type) ? 'value' : 'array';
                return (
                  <input key={`${typeTag}(${name})`} type="hidden" name={name} value={defaultValue}/>
                );
              })}
              <b><a href={webAppUrl + '/showQuestion.do?questionFullName=' + linkName}>{displayName}: </a></b>
              <input
                type="text"
                className="search-box"
                value={this.state.value}
                onChange={this.handleChange}
                name={'value(' + searchParam.name + ')'}
              />
              <input
                name="go"
                value="go"
                type="image"
                src={webAppUrl + '/images/mag_glass.png'}
                alt="Click to search"
                width="23"
                height="23"
                className="img_align_middle"
              />
            </form>
          )}
        </Tooltip>
      </div>
    );
  }

}

QuickSearchItem.propTypes = {
  webAppUrl: PropTypes.string.isRequired,
  question: QuestionPropType,
  reference: ReferencePropType.isRequired,
};

function QuickSearch(props) {
  let { references, questions = {}, webAppUrl } = props;

  return (
    <div id="quick-search" style={{display: 'flex', marginBottom: '12px', marginTop: '16px', height: '26px'}}>
      {map(references, reference => (
        <QuickSearchItem
          key={reference.name}
          question={questions[reference.name]}
          reference={reference}
          webAppUrl={webAppUrl}
        />
      ))}
    </div>
  )
}

QuickSearch.propTypes = {
  webAppUrl: PropTypes.string.isRequired,
  references: PropTypes.arrayOf(ReferencePropType),
  questions: PropTypes.objectOf(QuestionPropType)
};

export default wrappable(QuickSearch);

/**
 * @param {Parameter} parameter
 * @return {boolean}
 */
function isStringParam(parameter) {
  return [ 'StringParam', 'TimestampParam' ].includes(parameter.type);
}
