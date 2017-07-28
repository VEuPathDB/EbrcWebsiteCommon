import { RecordAttribute } from 'wdk-client/Components';

export function RecordMainSection(DefaultComponent) {
  return function EbrcRecordMainSection(props) {
    return (
      <div>
        <DefaultComponent {...props}/>
        {!props.depth && ('attribution' in props.record.attributes) && (
          <div>
            <h3>Record Attribution</h3>
            <RecordAttribute
              attribute={props.recordClass.attributesMap.attribution}
              record={props.record}
              recordClass={props.recordClass}
            />
          </div>
        )}
      </div>
    );
  };
}
