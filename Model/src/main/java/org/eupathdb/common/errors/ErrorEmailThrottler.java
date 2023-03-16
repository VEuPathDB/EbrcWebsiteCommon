package org.eupathdb.common.errors;

import org.apache.log4j.Logger;
import org.gusdb.fgputil.TokenBucketPermitDistributor;
import org.gusdb.wdk.model.WdkModel;

import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.AddressException;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Properties;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Wraps {@link TokenBucketPermitDistributor}, keeping track of how many times an e-mail was throttled. Sends an e-mail
 * once per hour summarizing throttles.
 */
public class ErrorEmailThrottler {
  private static final Logger LOG = Logger.getLogger(ErrorEmailThrottler.class);
  private static final String WDK_PROP_EMAIL_BURST_THROTTLE_SIZE_KEY = "EMAIL_BURST_THROTTLE_SIZE";
  private static final String WDK_PROP_EMAIL_SUSTAINED_THROTTLE_KEY= "EMAIL_SUSTAINED_THROTTLE_RATE_PER_SECOND";
  private static final double DEFAULT_EMAIL_BURST_THROTTLE_SIZE = 500.0;
  private static final double DEFAULT_EMAIL_SUSTAINED_THROTTLE_RATE = 1.0 / Duration.ofMinutes(10).getSeconds();

  private final AtomicLong throttledSinceLastReport = new AtomicLong();
  private final TokenBucketPermitDistributor permitDistributor;
  private final ScheduledExecutorService scheduledExecutorService;
  private final List<String> adminEmails;
  private final String projectId;

  public ErrorEmailThrottler(WdkModel wdkModel) {
    double burstSize = Optional.ofNullable(wdkModel.getProperties().get(WDK_PROP_EMAIL_BURST_THROTTLE_SIZE_KEY))
        .map(Double::parseDouble)
        .orElse(DEFAULT_EMAIL_BURST_THROTTLE_SIZE);
    double sustainedRate = Optional.ofNullable(wdkModel.getProperties().get(WDK_PROP_EMAIL_SUSTAINED_THROTTLE_KEY))
        .map(Double::parseDouble)
        .orElse(DEFAULT_EMAIL_SUSTAINED_THROTTLE_RATE);
    permitDistributor = new TokenBucketPermitDistributor(sustainedRate, burstSize);
    scheduledExecutorService = Executors.newSingleThreadScheduledExecutor();
    scheduledExecutorService.scheduleAtFixedRate(this::sendThrottlingReport, 0L, 1, TimeUnit.HOURS);
    wdkModel.registerClosable(scheduledExecutorService::shutdown);
    adminEmails = wdkModel.getModelConfig().getAdminEmails();
    projectId = wdkModel.getProjectId();
  }

  /**
   * Acquires a permit from the underlying permit distributor and increments a counter if no permits are available.
   * @return true if allowed, false if not
   */
  public boolean shouldThrottle() {
    if (permitDistributor.tryAcquire()) {
      return false; // Permit acquired successfully, no need to throttle.
    } else {
      throttledSinceLastReport.incrementAndGet();
      return true;
    }
  }

  /**
   * Sends a throttling e-mail report to admins and resets the throttle counter to zero.
   */
  private void sendThrottlingReport() {
    if (throttledSinceLastReport.get() == 0L) {
      return;
    }
    Properties props = new Properties();
    props.put("mail.smtp.host", "localhost");

    try {
      Session session = Session.getDefaultInstance(props, null);
      session.setDebug(false);

      Message msg = new MimeMessage(session);
      InternetAddress addressFrom = new InternetAddress("projectId@" + projectId);

      List<InternetAddress> addressList = new ArrayList<>();
      for (String address : adminEmails) {
        try {
          addressList.add(new InternetAddress(address));
        } catch (AddressException ae) {
          // ignore bad address
        }
      }
      InternetAddress[] addressTo = addressList.toArray(new InternetAddress[0]);

      msg.setRecipients(Message.RecipientType.TO, addressTo);
      msg.setFrom(addressFrom);
      msg.setSubject("Error E-Mails Throttled");
      msg.setContent(String.format("Prevented %d e-mails from being sent due to excessive error load. Check the error " +
          "logs to see any throttled e-mails.", throttledSinceLastReport.getAndSet(0L)), "text/plain");
      Transport.send(msg);
    } catch (MessagingException me) {
      LOG.error(me);
    }
  }
}
