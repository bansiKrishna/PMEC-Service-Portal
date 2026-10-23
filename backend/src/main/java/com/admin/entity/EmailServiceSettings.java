package com.admin.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "email_service_settings")
@Getter
@Setter
@NoArgsConstructor
public class EmailServiceSettings {

    @Id
    private Integer id;

    @Column(name = "gmail_address", nullable = false, length = 254)
    private String gmailAddress;

    @Column(name = "encrypted_app_password", nullable = false, columnDefinition = "text")
    private String encryptedAppPassword;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
