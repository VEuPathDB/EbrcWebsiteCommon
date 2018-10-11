import { ValidatedInput } from '../../components';

import './ContactUsAttachments.scss';

const ContactUsAttachments = ({ 
  changeFile,
  addFile,
  removeFile,
  validatedAttachmentMetadata
}) => 
  <div className="contact-us-files">
    Optionally, attach up to three screenshots to your message (maximum 5Mb per file).
    <br />
    <br />
    {
      validatedAttachmentMetadata.map(({ id, validity }, index) =>
        <div key={id}>
          <ValidatedInput
            validity={validity}
            onChange={event => changeFile(index, event.target.files)}
            type="file"
          />
          <span className="remove-file">
            <a href="#" onClick={e => {
              e.preventDefault();
              removeFile(index);
            }}>
              Remove file
            </a>
          </span>
        </div>
      )
    }
    {
      validatedAttachmentMetadata.length < 3 &&
      (
        <div className={validatedAttachmentMetadata.length === 0 
          ? "" 
          : "add-another-file"
        } >
          <a href="#" onClick={e => { 
            e.preventDefault();
            addFile();
          }}>{
            validatedAttachmentMetadata.length === 0
              ? 'Add a file'
              : 'Add another file'
          }</a>
        </div>
      )
    }
  </div>;

export default ContactUsAttachments;
