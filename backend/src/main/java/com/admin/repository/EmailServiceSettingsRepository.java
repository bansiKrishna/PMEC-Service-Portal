package com.admin.repository;

import com.admin.entity.EmailServiceSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailServiceSettingsRepository extends JpaRepository<EmailServiceSettings, Integer> {
}
