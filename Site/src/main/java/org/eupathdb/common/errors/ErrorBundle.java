package org.eupathdb.common.errors;

import java.util.List;

import org.apache.log4j.Logger;

public class ErrorBundle {
    
    private static final Logger LOG = Logger.getLogger(ErrorBundle.class);
    
    private Exception _pageException;
    private Exception _requestException;
    private Exception _passedException;
    private List<String> _actionErrors;

    public ErrorBundle(Exception pageException, Exception requestException,
            Exception actionException, List<String> actionErrors) {
        _pageException = pageException;
        _requestException = requestException;
        _passedException = actionException;
        _actionErrors = actionErrors;
        LOG.debug("Created bundle with exceptions: " +
                _pageException + ", " +
                _requestException + ", " +
                _passedException + ", " +
                actionErrors.size());
    }

    public Exception getPageException() { return _pageException; }
    public Exception getRequestException() { return _requestException; }
    public Exception getActionException() { return _passedException; }
    public List<String> getActionErrors() { return _actionErrors; }

    public boolean hasErrors() {
        return (_pageException != null ||
                _requestException != null ||
                _passedException != null ||
                !_actionErrors.isEmpty());
    }
}
