import { renderWithCustomElements } from '../util/customElements';

/**
 * Override RecordHeading, and add record_overview attribute value.
 */
export function RecordHeading(DefaultComponent) {
  return function EbrcRecordHeading(props) {
    return (
      <div>
        <DefaultComponent {...props} />
        {renderWithCustomElements(props.record.attributes.record_overview)}
      </div>
    );
  };
}
