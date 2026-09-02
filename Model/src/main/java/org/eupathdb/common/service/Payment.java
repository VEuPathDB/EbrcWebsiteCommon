package org.eupathdb.common.service;

import org.apache.log4j.Logger;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.json.JsonMapper;

@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public class Payment {

  private static final Logger LOG = Logger.getLogger(Payment.class);

  // payment information
  @JsonProperty("referenceNumber")
  private String _referenceNumber;

  @JsonProperty("paymentDateTimeISO8601")
  private String _paymentDateTimeISO8601;

  @JsonProperty("amount")
  private String _amount;

  // payer information (billing name/address/email collected via Unified Checkout)
  @JsonProperty("firstName")
  private String _firstName;

  @JsonProperty("lastName")
  private String _lastName;

  @JsonProperty("address1")
  private String _address1;

  @JsonProperty("address2")
  private String _address2;

  @JsonProperty("city")
  private String _city;

  @JsonProperty("postalCode")
  private String _postalCode;

  @JsonProperty("state")
  private String _state;

  @JsonProperty("country")
  private String _country;

  @JsonProperty("email")
  private String _email;

  public Payment() {
  }

  public Payment setReferenceNumber(String referenceNumber) {
    _referenceNumber = referenceNumber;
    return this;
  }

  public String getReferenceNumber() {
    return _referenceNumber;
  }

  public Payment setPaymentDateTimeISO8601(String paymentDateTimeISO8601) {
    _paymentDateTimeISO8601 = paymentDateTimeISO8601;
    return this;
  }

  public String getPaymentDateTimeISO8601() {
    return _paymentDateTimeISO8601;
  }

  public Payment setAmount(String amount) {
    _amount = amount;
    return this;
  }

  public String getAmount() {
    return _amount;
  }

  public Payment setFirstName(String firstName) {
    _firstName = firstName;
    return this;
  }

  public String getFirstName() {
    return _firstName;
  }

  public Payment setLastName(String lastName) {
    _lastName = lastName;
    return this;
  }

  public String getLastName() {
    return _lastName;
  }

  public Payment setAddress1(String address1) {
    _address1 = address1;
    return this;
  }

  public String getAddress1() {
    return _address1;
  }

  public Payment setAddress2(String address2) {
    _address2 = address2;
    return this;
  }

  public String getAddress2() {
    return _address2;
  }

  public Payment setCity(String city) {
    _city = city;
    return this;
  }

  public String getCity() {
    return _city;
  }

  public Payment setPostalCode(String postalCode) {
    _postalCode = postalCode;
    return this;
  }

  public String getPostalCode() {
    return _postalCode;
  }

  public Payment setState(String state) {
    _state = state;
    return this;
  }

  public String getState() {
    return _state;
  }

  public Payment setCountry(String country) {
    _country = country;
    return this;
  }

  public String getCountry() {
    return _country;
  }

  public Payment setEmail(String email) {
    _email = email;
    return this;
  }

  public String getEmail() {
    return _email;
  }

  public String toJson() {
    try {
      return JsonMapper.builder().build().writeValueAsString(this);
    }
    catch (JsonProcessingException e) {
      LOG.error(e);
      return "<bad_object>";
    }
  }
}
