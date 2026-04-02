package com.smartcampus.catalog.service;

import com.smartcampus.booking.exception.BadRequestException;
import com.smartcampus.booking.exception.ResourceNotFoundException;
import com.smartcampus.catalog.model.AssetMedia;
import com.smartcampus.catalog.model.AssetMediaType;
import com.smartcampus.catalog.repository.AssetMediaRepository;
import com.smartcampus.catalog.util.IdValidationUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class AssetMediaStorageService {

    public static final int MAX_MEDIA_FILES_PER_ASSET = 4;
    private static final long MAX_FILE_SIZE_BYTES = 50L * 1024 * 1024;
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "jpg", "jpeg", "png", "gif", "webp",
            "mp4", "mov", "avi", "mkv", "webm"
    );

    private final AssetMediaRepository assetMediaRepository;
    private final Path uploadRootPath;

    public AssetMediaStorageService(AssetMediaRepository assetMediaRepository,
                                    @Value("${catalog.asset.upload-dir:uploads/assets}") String uploadDir) {
        this.assetMediaRepository = assetMediaRepository;
        this.uploadRootPath = Paths.get("").toAbsolutePath().normalize().resolve(uploadDir).normalize();
        createUploadRootIfNeeded();
    }

    public List<MultipartFile> normalizeFiles(List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return List.of();
        }

        List<MultipartFile> normalizedFiles = files.stream()
                .filter(file -> file != null && !file.isEmpty())
                .collect(Collectors.toList());

        if (normalizedFiles.size() > MAX_MEDIA_FILES_PER_ASSET) {
            throw new BadRequestException("An asset can have at most " + MAX_MEDIA_FILES_PER_ASSET + " media files");
        }

        return normalizedFiles;
    }

    public List<AssetMedia> getMediaByAssetId(String assetId) {
        return assetMediaRepository.findByAssetIdOrderByCreatedAtAsc(assetId);
    }

    public Map<String, List<AssetMedia>> getMediaByAssetIds(Collection<String> assetIds) {
        if (assetIds == null || assetIds.isEmpty()) {
            return Map.of();
        }

        Map<String, List<AssetMedia>> result = new HashMap<>();
        assetMediaRepository.findByAssetIdInOrderByCreatedAtAsc(assetIds)
                .forEach(assetMedia -> result.computeIfAbsent(assetMedia.getAssetId(), ignored -> new ArrayList<>()).add(assetMedia));
        return result;
    }

    public List<AssetMedia> saveMediaFiles(String assetId, List<MultipartFile> files, String uploadedById) {
        List<MultipartFile> normalizedFiles = normalizeFiles(files);
        if (normalizedFiles.isEmpty()) {
            return List.of();
        }

        Path assetDirectory = createAssetDirectory(assetId);
        List<Path> writtenFiles = new ArrayList<>();
        List<AssetMedia> mediaToPersist = new ArrayList<>();

        try {
            for (MultipartFile file : normalizedFiles) {
                validateFile(file);

                String originalFileName = StringUtils.cleanPath(file.getOriginalFilename() != null
                        ? file.getOriginalFilename() : "file");
                String extension = getFileExtension(originalFileName);
                String storedFileName = UUID.randomUUID() + "." + extension;
                Path targetPath = assetDirectory.resolve(storedFileName).normalize();

                if (!targetPath.startsWith(assetDirectory)) {
                    throw new BadRequestException("Invalid file path generated for uploaded media");
                }

                try (InputStream inputStream = file.getInputStream()) {
                    Files.copy(inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING);
                }

                writtenFiles.add(targetPath);

                AssetMedia assetMedia = new AssetMedia();
                assetMedia.setAssetId(assetId);
                assetMedia.setOriginalFileName(originalFileName);
                assetMedia.setStoredFileName(storedFileName);
                assetMedia.setContentType(file.getContentType());
                assetMedia.setMediaType(resolveMediaType(file.getContentType()));
                assetMedia.setFileSize(file.getSize());
                assetMedia.setRelativePath(toRelativePath(targetPath));
                assetMedia.setUploadedById(uploadedById);
                mediaToPersist.add(assetMedia);
            }

            return assetMediaRepository.saveAll(mediaToPersist);
        } catch (IOException | RuntimeException ex) {
            writtenFiles.forEach(this::deleteFileQuietly);
            throw ex instanceof BadRequestException
                    ? (BadRequestException) ex
                    : new BadRequestException("Failed to store uploaded asset media", ex);
        }
    }

    public List<AssetMedia> removeSelectedMedia(String assetId, String removeMediaIdsCsv) {
        List<AssetMedia> existingMedia = getMediaByAssetId(assetId);
        List<AssetMedia> mediaToRemove = resolveMediaToRemove(assetId, removeMediaIdsCsv, existingMedia);
        if (mediaToRemove.isEmpty()) {
            return List.of();
        }

        deleteMediaEntries(mediaToRemove);
        return mediaToRemove;
    }

    public void deleteAllMediaForAsset(String assetId) {
        List<AssetMedia> assetMedia = getMediaByAssetId(assetId);
        if (assetMedia.isEmpty()) {
            deleteAssetDirectoryIfEmpty(assetId);
            return;
        }

        assetMediaRepository.deleteByAssetId(assetId);
        assetMedia.forEach(this::deleteMediaFileQuietly);
        deleteAssetDirectoryIfEmpty(assetId);
    }

    public void deleteMediaEntries(List<AssetMedia> assetMedia) {
        if (assetMedia == null || assetMedia.isEmpty()) {
            return;
        }

        assetMediaRepository.deleteAll(assetMedia);
        assetMedia.forEach(this::deleteMediaFileQuietly);
        assetMedia.stream()
                .map(AssetMedia::getAssetId)
                .distinct()
                .forEach(this::deleteAssetDirectoryIfEmpty);
    }

    public int calculateFinalMediaCount(String assetId, String removeMediaIdsCsv, List<MultipartFile> newFiles) {
        List<AssetMedia> existingMedia = getMediaByAssetId(assetId);
        int removalCount = resolveMediaToRemove(assetId, removeMediaIdsCsv, existingMedia).size();
        int uploadCount = normalizeFiles(newFiles).size();
        return existingMedia.size() - removalCount + uploadCount;
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("Uploaded media file cannot be empty");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new BadRequestException("Each media file must be 50 MB or smaller");
        }

        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename() != null
                ? file.getOriginalFilename() : "");
        if (!StringUtils.hasText(originalFileName)) {
            throw new BadRequestException("Uploaded media file must have a file name");
        }

        String extension = getFileExtension(originalFileName);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BadRequestException("Unsupported media file extension: ." + extension);
        }

        resolveMediaType(file.getContentType());
    }

    private AssetMediaType resolveMediaType(String contentType) {
        if (!StringUtils.hasText(contentType)) {
            throw new BadRequestException("Uploaded media file must include a content type");
        }

        if (contentType.startsWith("image/")) {
            return AssetMediaType.IMAGE;
        }
        if (contentType.startsWith("video/")) {
            return AssetMediaType.VIDEO;
        }

        throw new BadRequestException("Only image and video uploads are supported for asset media");
    }

    private String getFileExtension(String originalFileName) {
        int extensionIndex = originalFileName.lastIndexOf('.');
        if (extensionIndex < 0 || extensionIndex == originalFileName.length() - 1) {
            throw new BadRequestException("Uploaded media file must have a valid extension");
        }
        return originalFileName.substring(extensionIndex + 1).toLowerCase();
    }

    private Set<String> parseMediaIds(String removeMediaIdsCsv) {
        String rawValue = IdValidationUtils.trimToNull(removeMediaIdsCsv);
        if (rawValue == null) {
            return Set.of();
        }

        Set<String> ids = new HashSet<>();
        for (String token : rawValue.split(",")) {
            String id = IdValidationUtils.trimToNull(token);
            if (id != null) {
                ids.add(IdValidationUtils.requireValidObjectId(id, "Asset media ID"));
            }
        }
        return ids;
    }

    private List<AssetMedia> resolveMediaToRemove(String assetId, String removeMediaIdsCsv, List<AssetMedia> existingMedia) {
        Set<String> mediaIds = parseMediaIds(removeMediaIdsCsv);
        if (mediaIds.isEmpty()) {
            return List.of();
        }

        Map<String, AssetMedia> existingMediaById = existingMedia.stream()
                .collect(Collectors.toMap(AssetMedia::getId, assetMedia -> assetMedia));

        List<AssetMedia> mediaToRemove = new ArrayList<>();
        for (String mediaId : mediaIds) {
            AssetMedia media = existingMediaById.get(mediaId);
            if (media == null) {
                throw new ResourceNotFoundException("Asset media not found for id: " + mediaId);
            }
            if (!assetId.equals(media.getAssetId())) {
                throw new BadRequestException("Asset media does not belong to asset id: " + assetId);
            }
            mediaToRemove.add(media);
        }
        return mediaToRemove;
    }

    private void createUploadRootIfNeeded() {
        try {
            Files.createDirectories(uploadRootPath);
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to create upload directory: " + uploadRootPath, ex);
        }
    }

    private Path createAssetDirectory(String assetId) {
        Path assetDirectory = uploadRootPath.resolve(assetId).normalize();
        try {
            Files.createDirectories(assetDirectory);
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to create asset upload directory: " + assetDirectory, ex);
        }
        return assetDirectory;
    }

    private String toRelativePath(Path filePath) {
        Path projectRoot = Paths.get("").toAbsolutePath().normalize();
        return projectRoot.relativize(filePath.toAbsolutePath().normalize()).toString().replace('\\', '/');
    }

    private void deleteMediaFileQuietly(AssetMedia assetMedia) {
        Path filePath = Paths.get("").toAbsolutePath().normalize().resolve(assetMedia.getRelativePath()).normalize();
        deleteFileQuietly(filePath);
    }

    private void deleteFileQuietly(Path filePath) {
        try {
            Files.deleteIfExists(filePath);
        } catch (IOException ignored) {
        }
    }

    private void deleteAssetDirectoryIfEmpty(String assetId) {
        Path assetDirectory = uploadRootPath.resolve(assetId).normalize();
        if (!Files.exists(assetDirectory)) {
            return;
        }

        try (Stream<Path> paths = Files.list(assetDirectory)) {
            if (paths.findAny().isEmpty()) {
                Files.deleteIfExists(assetDirectory);
            }
        } catch (IOException ignored) {
        }
    }
}
