package org.eupathdb.common.service.clienterror;

import org.gusdb.wdk.errors.ErrorBundle;
import org.json.JSONObject;

public class ClientError implements ErrorBundle {

  private final String _errorDetailsAsString;

  public ClientError(JSONObject errorJson) {
    _errorDetailsAsString = errorJson.toString(2);
  }

  @Override
  public boolean hasErrors() {
    return true;
  }

  @Override
  public String getDetailedDescription() {
    return _errorDetailsAsString;
  }

}
