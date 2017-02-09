package org.eupathdb.common.taglib.wdk;

import java.util.ArrayList;
import javax.servlet.jsp.tagext.TagExtraInfo;
import javax.servlet.jsp.tagext.TagData;
import javax.servlet.jsp.tagext.ValidationMessage;

public class SiteXmlMessagesTEI extends TagExtraInfo {

    private ValidationMessage[] vmsg = null;

    @Override
    public ValidationMessage[] validate(TagData data) {

        ArrayList<ValidationMessage> errors = new ArrayList<ValidationMessage>();
        
        validateRange(errors, data.getAttribute("range"));
        validateStopDateSort(errors, data.getAttribute("stopDateSort"));
        
        if (errors.size() != 0) {
            vmsg = new ValidationMessage[errors.size()];
            errors.toArray(vmsg);
        }
    
        return vmsg;
    }
        
    public void validateRange(ArrayList<ValidationMessage> errors, Object data) {

        if (data == null)
            return;

        String range = ((String)data).toLowerCase();

        if ( ! range.equals("expired") && 
             ! range.equals("all") ) {
            errors.add(
                new ValidationMessage(null,
                "Invalid range value. Valid values are ['expired', 'all']")
            );
        }
        
        if (errors.size() != 0) {
            vmsg = new ValidationMessage[errors.size()];
            errors.toArray(vmsg);
        }
    
    }
        
    public void validateStopDateSort(ArrayList<ValidationMessage> errors, Object data) {

        if (data == null)
            return;
    
        String stopDateSort = ((String)data).toLowerCase();

        if ( ! stopDateSort.equals("asc") && 
             ! stopDateSort.equals("desc") ) {
            errors.add(
                new ValidationMessage(null,
                "Invalid stopDateSort value. Valid values are ['ASC', 'DESC']")
            );
        }
    
        if (errors.size() != 0) {
            vmsg = new ValidationMessage[errors.size()];
            errors.toArray(vmsg);
        }
    
    }
}