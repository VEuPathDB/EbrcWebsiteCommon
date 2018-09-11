const ContactUsField = ({ label, inputElement }) => (
  <tr className="field">
    <td>
      <b>{label}</b>
    </td>
    <td>
      {inputElement}
    </td>
  </tr>
);

export default ContactUsField;
