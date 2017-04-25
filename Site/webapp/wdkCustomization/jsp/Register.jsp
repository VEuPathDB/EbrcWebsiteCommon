<%@ taglib prefix="imp" tagdir="/WEB-INF/tags/imp" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<c:set var="wdkModel" value="${applicationScope.wdkModel}"/>

<imp:pageFrame title="${wdkModel.displayName} :: Registration">
  <imp:register/>
</imp:pageFrame>
