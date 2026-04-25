package com.smartcampus.ticketing.service;

import com.smartcampus.booking.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class IncidentMediaStorageService {

    private static final int MAX_FILES = 3;
    private static final long MAX_FILE_SIZE = 5L * 1024 * 1024; // 5MB
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp", "gif", "bmp", "svg", "tiff");

    private final Path uploadRootPath;

    public IncidentMediaStorageService(@Value("${ticketing.incident.upload-dir:uploads/incidents}") String uploadDir) {
        this.uploadRootPath = Paths.get("").toAbsolutePath().normalize().resolve(uploadDir).normalize();
        try {
            Files.createDirectories(uploadRootPath);
        } catch (IOException ex) {
            throw new IllegalStateException("Could not create upload directory", ex);
        }
    }

    public List<String> saveMediaFiles(String ticketId, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return List.of();
        }

        if (files.size() > MAX_FILES) {
            throw new BadRequestException("Maximum 3 attachments allowed");
        }

        Path ticketDir = uploadRootPath.resolve(ticketId).normalize();
        try {
            Files.createDirectories(ticketDir);
        } catch (IOException ex) {
            throw new IllegalStateException("Could not create ticket directory", ex);
        }

        List<String> relativePaths = new ArrayList<>();
        for (MultipartFile file : files) {
            validateFile(file);
            String extension = StringUtils.getFilenameExtension(file.getOriginalFilename());
            String fileName = UUID.randomUUID().toString() + "." + extension;
            Path targetPath = ticketDir.resolve(fileName).normalize();

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING);
                relativePaths.add(toRelativePath(targetPath));
            } catch (IOException ex) {
                throw new BadRequestException("Failed to store file " + file.getOriginalFilename(), ex);
            }
        }
        return relativePaths;
    }

    public Resource loadMediaAsResource(String relativePath) {
        try {
            String decodedPath = java.net.URLDecoder.decode(relativePath, java.nio.charset.StandardCharsets.UTF_8);
            Path projectRoot = Paths.get("").toAbsolutePath().normalize();
            Path filePath = projectRoot.resolve(decodedPath).normalize();
            
            if (!filePath.startsWith(projectRoot)) {
                throw new BadRequestException("Invalid file path");
            }

            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() || resource.isReadable()) {
                return resource;
            } else {
                throw new BadRequestException("Could not read file");
            }
        } catch (MalformedURLException ex) {
            throw new BadRequestException("Could not read file", ex);
        }
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("File is empty");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("File size exceeds 5MB limit");
        }
        String extension = StringUtils.getFilenameExtension(file.getOriginalFilename());
        if (extension == null || !ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new BadRequestException("Unsupported file type. Allowed: JPG, PNG, WEBP, GIF, BMP, SVG, TIFF");
        }
    }

    private String toRelativePath(Path filePath) {
        Path projectRoot = Paths.get("").toAbsolutePath().normalize();
        return projectRoot.relativize(filePath.toAbsolutePath().normalize()).toString().replace('\\', '/');
    }
}
