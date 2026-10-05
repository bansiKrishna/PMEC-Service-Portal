package com.file;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface FileStorageService {
    String saveTemplate(MultipartFile file) throws IOException;

    String saveTemplate(byte[] content, String fileName) throws IOException;

    String saveSignature(MultipartFile file) throws IOException;

    String saveCertificate(byte[] pdf, String fileName) throws IOException;

    byte[] readFile(String filePath) throws IOException;

    void deleteFile(String filePath);
}
