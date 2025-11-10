package com.logiflow.server.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "delivery_confirmations")
public class DeliveryConfirmation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "confirmation_id")
    private Integer confirmationId;

    @ManyToOne
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @Column(name = "confirmation_type", nullable = false, length = 20)
    private String confirmationType; // SIGNATURE, PHOTO, OTP

    @Column(name = "signature_data", columnDefinition = "TEXT")
    private String signatureData; // Base64 encoded signature image

    @Column(name = "photo_data", columnDefinition = "TEXT")
    private String photoData; // Base64 encoded photo

    @Column(name = "otp_code", length = 10)
    private String otpCode;

    @Column(name = "recipient_name", length = 255)
    private String recipientName;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "confirmed_at", nullable = false)
    private LocalDateTime confirmedAt;

    @Column(name = "confirmed_by")
    private Integer confirmedBy; // Driver user ID

    // Constructors
    public DeliveryConfirmation() {
        this.confirmedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Integer getConfirmationId() {
        return confirmationId;
    }

    public void setConfirmationId(Integer confirmationId) {
        this.confirmationId = confirmationId;
    }

    public Trip getTrip() {
        return trip;
    }

    public void setTrip(Trip trip) {
        this.trip = trip;
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

    public LocalDateTime getConfirmedAt() {
        return confirmedAt;
    }

    public void setConfirmedAt(LocalDateTime confirmedAt) {
        this.confirmedAt = confirmedAt;
    }

    public Integer getConfirmedBy() {
        return confirmedBy;
    }

    public void setConfirmedBy(Integer confirmedBy) {
        this.confirmedBy = confirmedBy;
    }
}
