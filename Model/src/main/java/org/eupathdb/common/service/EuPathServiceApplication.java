package org.eupathdb.common.service;

import java.util.Set;

import org.eupathdb.common.service.brc.BrcService;
import org.eupathdb.common.service.contact.ContactUsService;
import org.gusdb.fgputil.SetBuilder;
import org.gusdb.wdk.service.WdkServiceApplication;

public class EuPathServiceApplication extends WdkServiceApplication {

  @Override
  public Set<Class<?>> getClasses() {
    return new SetBuilder<Class<?>>()
    .addAll(super.getClasses())
    .add(BrcService.class)
    .add(ContactUsService.class)
    .toSet();
  }
}
