import { capitalize, groupBy, uniq } from 'lodash';
import * as React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'wdk-client/Components';
import { Props } from 'wdk-client/Components/PageStatus/Error';
import { UnhandledError } from 'wdk-client/Actions/UnhandledErrorActions';
import { RootState } from 'wdk-client/Core/State/Types';

export function Error(DefaultComponent: React.ComponentType<Props>) {
  return function VEuPathError(props: Props) {
    const errors = useSelector((state: RootState) => state.unhandledErrors.errors)
    const errorTypes = uniq(errors.map(e => e.type));
    const groupedErrors = groupBy(errors, 'type');

    const contactUsMessage = errorTypes.map(errorType => {
      const typedErrors: UnhandledError[] | undefined = groupedErrors[errorType];
      if (typedErrors == null) return '';
      return '# ' + capitalize(errorType) +' errors: ' + typedErrors.map(te => te.id).join(', ');
    }).join('\n')

    const contactUsLink = <Link to={`/contact-us?ctx=${encodeURIComponent(contactUsMessage)}`} target="_blank">contact us</Link>;

    return (
      <DefaultComponent message={props.message}>
        {
          props.children || (<>
            <ul style={{ fontSize: '1.2em', margin: '1em 2em' }}>
              <li>Please try again.</li>
              <li>If the problem persists, {contactUsLink}.</li>
            </ul>
            <div>{props.message}</div>
          </>)
        }
      </DefaultComponent>
    );
  }
};
