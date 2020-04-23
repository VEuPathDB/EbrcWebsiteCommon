import * as React from 'react';
import { Link } from 'wdk-client/Components';
import { Props } from 'wdk-client/Components/PageStatus/Error';

export function Error(DefaultComponent: React.ComponentType<Props>) {
  return function VEuPathError(props: Props) {
    return (
      <DefaultComponent message={props.message}>
        {
          props.children ||
          <p>
            Something went wrong. Please try again later, and <Link to="/contact-us" target="_blank">contact us</Link> if the problem persists.
            <br />
            {props.message}
          </p>
        }
      </DefaultComponent>
    );
  }
};
