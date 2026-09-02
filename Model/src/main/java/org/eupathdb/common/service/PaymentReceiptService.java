package org.eupathdb.common.service;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

import javax.ws.rs.BadRequestException;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.NotFoundException;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;

import org.apache.log4j.Logger;
import org.gusdb.wdk.service.service.AbstractWdkService;

import com.itextpdf.text.Chunk;
import com.itextpdf.text.Document;
import com.itextpdf.text.DocumentException;
import com.itextpdf.text.Element;
import com.itextpdf.text.Font;
import com.itextpdf.text.Image;
import com.itextpdf.text.PageSize;
import com.itextpdf.text.Paragraph;
import com.itextpdf.text.pdf.PdfWriter;

/**
 * Serves a bookmarkable receipt for a previously-persisted payment, looked up
 * by the reference number generated at payment time (see
 * {@link CyberSourceCaptureContextService} / {@link CyberSourcePaymentService}).
 * Supports two representations of the same data via the "format" query
 * param: JSON (default), consumed by the receipt page in React, and PDF, a
 * branded document offered to the payer as a download.
 */
@Path("payment/{referenceNumber}")
public class PaymentReceiptService extends AbstractWdkService {

  private static final Logger LOG = Logger.getLogger(PaymentReceiptService.class);

  private static final String LOGO_RESOURCE_PATH = "/images/veupathdb-logo.png";

  private static final Font TITLE_FONT = new Font(Font.FontFamily.HELVETICA, 18, Font.BOLD);
  private static final Font LABEL_FONT = new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD);
  private static final Font VALUE_FONT = new Font(Font.FontFamily.HELVETICA, 11, Font.NORMAL);

  @GET
  public Response getReceipt(
      @PathParam("referenceNumber") String referenceNumber,
      @QueryParam("format") @DefaultValue("JSON") String format) {

    referenceNumber = CyberSourceUtil.validateReferenceNumber(referenceNumber);
    boolean asPdf = isPdfFormat(format);

    Payment payment;
    try {
      payment = new PaymentPersistence(getWdkModel().getModelConfig()).retrievePayment(referenceNumber);
    }
    catch (RuntimeException e) {
      LOG.warn("Unable to find payment for reference number " + referenceNumber, e);
      throw new NotFoundException("No payment found for reference number: " + referenceNumber);
    }

    LOG.info("Receipt requested\t" + referenceNumber + "\t" + (asPdf ? "PDF" : "JSON"));

    return asPdf ? buildPdfResponse(payment, referenceNumber) : buildJsonResponse(payment);
  }

  private static boolean isPdfFormat(String format) {
    if (format.equalsIgnoreCase("JSON")) return false;
    if (format.equalsIgnoreCase("PDF")) return true;
    throw new BadRequestException("'format' parameter must be either 'JSON' or 'PDF'");
  }

  private static Response buildJsonResponse(Payment payment) {
    return Response.ok(payment.toJson(), MediaType.APPLICATION_JSON).build();
  }

  private static Response buildPdfResponse(Payment payment, String referenceNumber) {
    StreamingOutput streamer = out -> writeReceiptPdf(payment, out);
    return Response.ok(streamer)
        .type("application/pdf")
        .header("Content-Disposition", "attachment; filename=\"receipt-" + referenceNumber + ".pdf\"")
        .build();
  }

  private static void writeReceiptPdf(Payment payment, OutputStream out) throws IOException {
    Document document = new Document(PageSize.LETTER, 54, 54, 54, 54);
    try {
      PdfWriter.getInstance(document, out);
      document.open();

      addLogo(document);

      Paragraph title = new Paragraph("Payment Receipt", TITLE_FONT);
      title.setSpacingBefore(12);
      title.setSpacingAfter(12);
      document.add(title);

      document.add(new Paragraph("Thank you for your payment to VEuPathDB.", VALUE_FONT));
      document.add(new Paragraph(" "));

      addField(document, "Reference Number", payment.getReferenceNumber());
      addField(document, "Date", formatDate(payment.getPaymentDateTimeISO8601()));
      addField(document, "Amount", formatAmount(payment.getAmount()));

      document.add(new Paragraph(" "));
      document.add(new Paragraph("Billed To", LABEL_FONT));

      addLine(document, joinNonBlank(" ", payment.getFirstName(), payment.getLastName()));
      addLine(document, payment.getAddress1());
      addLine(document, payment.getAddress2());
      addLine(document, joinAddressLine(payment.getCity(), payment.getState(), payment.getPostalCode()));
      addLine(document, payment.getCountry());
      addLine(document, payment.getEmail());

      document.close();
    }
    catch (DocumentException e) {
      throw new IOException("Unable to generate payment receipt PDF", e);
    }
  }

  private static void addLogo(Document document) throws DocumentException, IOException {
    try (InputStream logoStream = PaymentReceiptService.class.getResourceAsStream(LOGO_RESOURCE_PATH)) {
      if (logoStream == null) {
        LOG.warn("Payment receipt logo resource not found at " + LOGO_RESOURCE_PATH);
        return;
      }
      Image logo = Image.getInstance(logoStream.readAllBytes());
      logo.scaleToFit(200, 60);
      logo.setAlignment(Element.ALIGN_LEFT);
      document.add(logo);
    }
  }

  private static void addField(Document document, String label, String value) throws DocumentException {
    if (value == null || value.isBlank()) return;
    Paragraph p = new Paragraph();
    p.add(new Chunk(label + ": ", LABEL_FONT));
    p.add(new Chunk(value, VALUE_FONT));
    document.add(p);
  }

  private static void addLine(Document document, String value) throws DocumentException {
    if (value == null || value.isBlank()) return;
    document.add(new Paragraph(value, VALUE_FONT));
  }

  private static String joinNonBlank(String delimiter, String... parts) {
    StringBuilder sb = new StringBuilder();
    for (String part : parts) {
      if (part == null || part.isBlank()) continue;
      if (sb.length() > 0) sb.append(delimiter);
      sb.append(part);
    }
    return sb.length() == 0 ? null : sb.toString();
  }

  private static String joinAddressLine(String city, String state, String postalCode) {
    String cityState = joinNonBlank(", ", city, state);
    return joinNonBlank(" ", cityState, postalCode);
  }

  private static String formatDate(String iso8601) {
    if (iso8601 == null) return null;
    try {
      Instant instant = Instant.parse(iso8601);
      return DateTimeFormatter.ofPattern("MMMM d, yyyy 'at' h:mm a 'UTC'").withZone(ZoneOffset.UTC).format(instant);
    }
    catch (Exception e) {
      return iso8601;
    }
  }

  private static String formatAmount(String amount) {
    return amount == null ? null : "$" + amount;
  }

}
