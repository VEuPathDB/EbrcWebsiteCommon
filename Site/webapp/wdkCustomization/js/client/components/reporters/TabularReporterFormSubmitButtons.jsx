import { wrappable } from 'wdk-client/ComponentUtils';

// by default, no supplemental submit buttons
let TabularReporterFormSubmitButtons = props =>
  <button className="btn" type="submit" onClick={props.onSubmit}>Get {props.recordClass.displayNamePlural}</button>;

export default wrappable(TabularReporterFormSubmitButtons);
