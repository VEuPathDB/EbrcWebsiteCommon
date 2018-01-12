import { find, get, map } from 'lodash';
import { Component } from 'react';
import PropTypes from 'prop-types';
import { AnchoredTooltip, Tooltip, Events } from 'mesa';
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

/**
 * Quick search boxes that appear in header
 */
class QuickSearchItem extends Component {

  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.componentWillUnmount = this.componentWillUnmount.bind(this);
    this.updateTooltipPosition = this.updateTooltipPosition.bind(this);
    this.componentWillReceiveProps = this.componentWillReceiveProps.bind(this);
    this.state = { value: '', tooltipPosition: {} };
  }

  componentDidMount () {
    this.setStateFromProps(this.props);
    this.updateTooltipPosition();
    this.resizeListener = Events.add('resize', this.updateTooltipPosition);
    this.scrollListener = Events.add('scroll', this.updateTooltipPosition);
  }

  componentWillUnmount () {
    Events.remove(this.resizeListener);
    Events.remove(this.scrollListener);
  }

  updateTooltipPosition () {
    if (!this.inputElement) return;
    const { top, left } = Tooltip.getOffset(this.inputElement);
    const right = window.innerWidth - left;
    const tooltipPosition = { top: top - 2, right: right + 6 };
    this.setState({ tooltipPosition });
  }

  componentWillReceiveProps(props) {
    this.setStateFromProps(props);
  }

  getStorageKey(props) {
    return 'ebrc::quicksearch::' + props.reference.name;
  }

  getSearchParam(props) {
    return find(get(props, 'question.parameters'), ({ name }) => name === props.reference.paramName);
  }

  setStateFromProps(props) {
    let value = window.localStorage.getItem(this.getStorageKey(props));
    this.setState({
      value: value != null ? value : get(this.getSearchParam(props), 'defaultValue', '')
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
    // const { tooltipPosition } = this.state;
    const { question, reference, webAppUrl } = this.props;
    const { displayName } = reference;
    const linkName = reference.alternate || reference.name;
    const searchParam = this.getSearchParam(this.props);

    // if searchParam is null, assume not loaded and render non-functioning
    // placeholder search box, otherwise render functioning search box
    return (
      <div className="quick-search-item" style={{ margin: '0 .4em' }} key={reference.name}>
        <form
          name="questionForm"
          method="post"
          action={webAppUrl + '/processQuestionSetsFlat.do'}
          onSubmit={this.handleSubmit}
        >
          <AnchoredTooltip
            // corner="right-top"
            // position={tooltipPosition}
            style={{ maxWidth: '275px', boxSizing: 'border-box' }}
            renderHtml={true}
            content={reference.help}>
            {question == null ? (
              <fieldset>
                <b key="name">
                  <a href={webAppUrl + '/showQuestion.do?questionFullName=' + linkName}>{displayName}: </a>
                </b>
                <input
                  type="text"
                  key="input"
                  className="search-box"
                  value={this.state.value}
                  onChange={this.handleChange}
                  ref={(el) => this.inputElement = el}
                  name=""
                  disabled
                />
                <input
                  name="go"
                  value="go"
                  type="image"
                  key="submit"
                  src={webAppUrl + '/images/mag_glass.png'}
                  alt="Click to search"
                  width="23"
                  height="23"
                  className="img_align_middle"
                  disabled
                />
              </fieldset>
            ) : (
              <fieldset>
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
                  ref={(el) => this.inputElement = el}
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
              </fieldset>
            )}
          </AnchoredTooltip>
        </form>
      </div>
    );
  }
}

QuickSearchItem.propTypes = {
  webAppUrl: PropTypes.string.isRequired,
  question: QuestionPropType,
  reference: ReferencePropType.isRequired,
};

function QuickSearch (props) {
  let { references, questions = {}, webAppUrl } = props;

  return (
    <div id="quick-search" style={{display: 'flex', marginBottom: '12px', marginTop: '16px', height: '26px'}}>
      {questions instanceof Error ? (
        <div style={{ color: 'darkred', marginLeft: 'auto' }}>Error: search temporarily unavailable</div>
      ) : map(references, reference => (
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
  questions: PropTypes.oneOfType([
    PropTypes.objectOf(QuestionPropType),
    PropTypes.instanceOf(Error)
  ]),
};

export default wrappable(QuickSearch);

/**
 * @param {Parameter} parameter
 * @return {boolean}
 */
function isStringParam(parameter) {
  return [ 'StringParam', 'TimestampParam' ].includes(parameter.type);
}
