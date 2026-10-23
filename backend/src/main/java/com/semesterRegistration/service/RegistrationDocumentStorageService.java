package com.semesterRegistration.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.UUID;

@Service
public class RegistrationDocumentStorageService {

    public static final long MAX_FILE_SIZE_BYTES = 1024 * 1024;

    private final Path receiptDirectory =
            Path.of("uploads", "semester-registration", "receipts")
                    .toAbsolutePath()
                    .normalize();

    public StoredFile store(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A receipt file is required."
            );
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new ResponseStatusException(
                    HttpStatus.PAYLOAD_TOO_LARGE,
                    "Receipt files cannot exceed 1 MB."
            );
        }

        byte[] contents = file.getBytes();
        DetectedType detectedType = detectType(contents);
        String suppliedType = file.getContentType();
        if (!detectedType.contentType().equalsIgnoreCase(
                suppliedType == null ? "" : suppliedType.trim()
        )) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only valid PDF, JPEG, or PNG receipt files are accepted."
            );
        }

        Files.createDirectories(receiptDirectory);
        String storageName = UUID.randomUUID() + detectedType.extension();
        Path destination = receiptDirectory.resolve(storageName).normalize();
        if (!destination.startsWith(receiptDirectory)) {
            throw new IOException("Invalid receipt storage path.");
        }

        Files.write(
                destination,
                contents,
                StandardOpenOption.CREATE_NEW,
                StandardOpenOption.WRITE
        );
        return new StoredFile(
                destination.toString(),
                detectedType.contentType(),
                contents.length
        );
    }

    public void delete(String storagePath) throws IOException {
        Path path = Path.of(storagePath).toAbsolutePath().normalize();
        if (!path.startsWith(receiptDirectory)) {
            throw new IOException("Receipt path is outside its storage directory.");
        }
        Files.deleteIfExists(path);
    }

    private DetectedType detectType(byte[] contents) {
        if (startsWith(contents, new byte[]{'%', 'P', 'D', 'F', '-'})) {
            return new DetectedType("application/pdf", ".pdf");
        }
        if (startsWith(
                contents,
                new byte[]{(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A}
        )) {
            return new DetectedType("image/png", ".png");
        }
        if (startsWith(
                contents,
                new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF}
        )) {
            return new DetectedType("image/jpeg", ".jpg");
        }
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Only valid PDF, JPEG, or PNG receipt files are accepted."
        );
    }

    private boolean startsWith(byte[] value, byte[] prefix) {
        if (value.length < prefix.length) {
            return false;
        }
        for (int index = 0; index < prefix.length; index++) {
            if (value[index] != prefix[index]) {
                return false;
            }
        }
        return true;
    }

    public record StoredFile(
            String storagePath,
            String contentType,
            long sizeBytes
    ) {
    }

    private record DetectedType(String contentType, String extension) {
    }
}
