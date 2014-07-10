package org.eupathdb.common.model;

import java.util.HashMap;
import java.util.Map;

import org.gusdb.fgputil.runtime.GusHome;
import org.gusdb.wdk.model.Manageable;
import org.gusdb.wdk.model.WdkModelException;

public final class InstanceManager {

  private static final Map<String, Map<String, Manageable<?>>> instances = new HashMap<>();

  public static <T extends Manageable<T>> T getInstance(Class<T> instanceClass, String projectId)
      throws WdkModelException {
    // get a map of project->instance
    Map<String, Manageable<?>> map;
    synchronized (instanceClass) {
      map = instances.get(instanceClass.getName());
      if (map == null) {
        map = new HashMap<>();
        instances.put(instanceClass.getName(), map);
      }
    }

    // check if the instance exists for the given project
    projectId = projectId.intern();
    synchronized (projectId) {
      @SuppressWarnings("unchecked")
      T instance = (T) map.get(projectId);
      if (instance == null) {
        String gusHome = GusHome.getGusHome();
        try {
          instance = instanceClass.newInstance().getInstance(projectId, gusHome);
        }
        catch (InstantiationException | IllegalAccessException ex) {
          throw new WdkModelException(ex);
        }
        map.put(projectId, instance);
      }
      return instance;
    }
  }

}
