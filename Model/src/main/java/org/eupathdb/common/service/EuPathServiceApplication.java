package org.eupathdb.common.service;

import java.util.Set;

import org.eupathdb.common.service.announce.SiteMessagesService;
import org.eupathdb.common.service.brc.BrcService;
import org.eupathdb.common.service.contact.ContactUsService;
import org.eupathdb.common.service.publicstrats.InvalidPublicStratsEmailerService;
import org.eupathdb.common.service.sitemap.SitemapService;
import org.eupathdb.common.service.testrunner.TestRunnerService;
import org.gusdb.fgputil.SetBuilder;
import org.gusdb.wdk.service.WdkServiceApplication;
import org.gusdb.wdk.service.provider.ExceptionMapper;

public class EuPathServiceApplication extends WdkServiceApplication {

  @Override
  public Set<Class<?>> getClasses() {
    return new SetBuilder<Class<?>>()
    .addAll(super.getClasses())
    .add(BrcService.class)
    .add(ContactUsService.class)
    .add(SiteMessagesService.class)
    .add(SitemapService.class)
    .add(TestRunnerService.class)
    .add(InvalidPublicStratsEmailerService.class)
    .replace(ExceptionMapper.class, EbrcExceptionMapper.class)
    .toSet();
  }
}
