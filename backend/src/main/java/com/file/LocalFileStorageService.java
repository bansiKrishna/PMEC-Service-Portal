package com.file;


import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.UUID;

@Service
public class LocalFileStorageService implements FileStorageService {

    private final Path templateDirectory =
            Paths.get("uploads/bonafide/templates");

    private final Path signatureDirectory =
            Paths.get("uploads/signatures");

    private final Path certificateDirectory =
            Paths.get("uploads/certificates");

    public LocalFileStorageService() {

        try {
            Files.createDirectories(templateDirectory);
            Files.createDirectories(signatureDirectory);
            Files.createDirectories(certificateDirectory);

        } catch (IOException e) {
            throw new RuntimeException(
                    "Could not initialize upload directories",
                    e
            );
        }
    }

    @Override
    public String saveTemplate(MultipartFile file)
            throws IOException {

        return saveTemplate(
                file.getBytes(),
                file.getOriginalFilename()
        );
    }

    @Override
    public String saveTemplate(byte[] content, String originalFileName)
            throws IOException {

        String extension = getExtension(originalFileName);

        String fileName =
                UUID.randomUUID() + extension;

        Path destination =
                templateDirectory.resolve(fileName);

        Files.write(
                destination,
                content,
                StandardOpenOption.CREATE_NEW
        );

        return destination.toString();
    }

    @Override
    public String saveSignature(MultipartFile file)
            throws IOException {

        String extension = getExtension(file.getOriginalFilename());

        String fileName =
                UUID.randomUUID() + extension;

        Path destination =
                signatureDirectory.resolve(fileName);

        Files.copy(
                file.getInputStream(),
                destination
        );

        return destination.toString();
    }

    @Override
    public String saveCertificate(
            byte[] pdf,
            String fileName) throws IOException {

        Path destination =
                certificateDirectory.resolve(fileName);

        Files.write(
                destination,
                pdf,
                StandardOpenOption.CREATE,
                StandardOpenOption.TRUNCATE_EXISTING
        );

        return destination.toString();
    }

    @Override
    public byte[] readFile(String filePath)
            throws IOException {

        return Files.readAllBytes(
                Paths.get(filePath)
        );
    }

    @Override
    public void deleteFile(String filePath) {

        try {
            Files.deleteIfExists(
                    Paths.get(filePath)
            );

        } catch (IOException ignored) {
        }
    }

    private String getExtension(String fileName) {

        if (fileName == null || !fileName.contains(".")) {
            return "";
        }

        return fileName.substring(
                fileName.lastIndexOf(".")
        );
    }
}