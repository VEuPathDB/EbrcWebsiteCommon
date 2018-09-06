const ContactUsBase = ({ children }) => (
  <div id="contentwrapper">
    <div id="contentcolumn2">
      <div className="innertube">
        <div style={{ padding: '1em' }}>
          {children}
        </div>
      </div>
    </div>
  </div>
);

export default ContactUsBase;
