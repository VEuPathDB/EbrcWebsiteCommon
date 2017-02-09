package org.eupathdb.common.errors;

import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

public class ValueMaps {

    public static abstract class ValueMap<S,T> {
        public abstract Enumeration<S> getKeys();
        public abstract T getValue(S key);
    }
    
    public static <S,T> Map<S, T> toMap(ValueMap<S,T> valueMap) {
        Map<S, T> map = new HashMap<>();
        Enumeration<S> e = valueMap.getKeys();
        while (e.hasMoreElements()) {
            S key = e.nextElement();
            map.put(key, valueMap.getValue(key));
        }
        return map;
    }
    
    public static class ServletContextValueMap extends ValueMap<String, Object> {
        private ServletContext _context;
        public ServletContextValueMap(ServletContext context) { _context = context; }
        @Override public Enumeration<String> getKeys() { return _context.getAttributeNames(); }
        @Override public Object getValue(String key) { return _context.getAttribute(key); }
    }
    
    public static class RequestAttributeValueMap extends ValueMap<String, Object> {
        private HttpServletRequest _request;
        public RequestAttributeValueMap(HttpServletRequest request) { _request = request; }
        @Override public Enumeration<String> getKeys() { return _request.getAttributeNames(); }
        @Override public Object getValue(String key) { return _request.getAttribute(key); }
    }
    
    public static class SessionAttributeValueMap extends ValueMap<String, Object> {
        private HttpSession _session;
        public SessionAttributeValueMap(HttpSession session) { _session = session; }
        @Override public Enumeration<String> getKeys() { return _session.getAttributeNames(); }
        @Override public Object getValue(String key) { return _session.getAttribute(key); }
    }
}
