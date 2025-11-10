package com.logiflow.server.dtos.delivery;

public class DeliveryConfirmationDto {
    private Integer tripId;
    private String confirmationType; // SIGNATURE, PHOTO, OTP
    private String signatureData; // Base64 encoded signature image
    private String photoData; // Base64 encoded photo
    private String otpCode;
    private String recipientName;
    private String notes;

    public DeliveryConfirmationDto() {}

    // Getters and Setters
    public Integer getTripId() {
        return tripId;
    }

    public void setTripId(Integer tripId) {
        this.tripId = tripId;
    }

    public String getConfirmationType() {
        return confirmationType;
    }

    public void setConfirmationType(String confirmationType) {
        this.confirmationType = confirmationType;
    }

    public String getSignatureData() {
        return signatureData;
    }

    public void setSignatureData(String signatureData) {
        this.signatureData = signatureData;
    }

    public String getPhotoData() {
        return photoData;
    }

    public void setPhotoData(String photoData) {
        this.photoData = photoData;
    }

    public String getOtpCode() {
        return otpCode;
    }

    public void setOtpCode(String otpCode) {
        this.otpCode = otpCode;
    }

    public String getRecipientName() {
        return recipientName;
    }

    public void setRecipientName(String recipientName) {
        this.recipientName = recipientName;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
