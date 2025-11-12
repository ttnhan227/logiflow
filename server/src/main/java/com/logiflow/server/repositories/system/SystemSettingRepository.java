package com.logiflow.server.repositories.system;

import com.logiflow.server.models.SystemSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SystemSettingRepository extends JpaRepository<SystemSetting, Integer> {

    // Find setting by category and key
    Optional<SystemSetting> findByCategoryAndKey(@Param("category") String category, @Param("key") String key);

    // Find all settings by category
    List<SystemSetting> findByCategory(String category);

    // Find settings by category ordered by key
    @Query("SELECT s FROM SystemSetting s WHERE s.category = :category ORDER BY s.key")
    List<SystemSetting> findByCategoryOrderByKey(@Param("category") String category);

    // Check if setting exists
    boolean existsByCategoryAndKey(String category, String key);

    // Find settings containing a search term in key or description
    @Query("SELECT s FROM SystemSetting s WHERE " +
           "LOWER(s.category) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(s.key) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(s.description) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<SystemSetting> searchSettings(@Param("searchTerm") String searchTerm);

    // Advanced search with multiple filters
    @Query("SELECT s FROM SystemSetting s WHERE " +
           "(:category IS NULL OR s.category = :category) AND " +
           "(:key IS NULL OR LOWER(CAST(s.key AS string)) LIKE LOWER(CONCAT('%', CAST(:key AS string), '%'))) AND " +
           "(:description IS NULL OR LOWER(CAST(s.description AS string)) LIKE LOWER(CONCAT('%', CAST(:description AS string), '%'))) AND " +
           "(:isEncrypted IS NULL OR s.isEncrypted = :isEncrypted) " +
           "ORDER BY s.category, s.key")
    List<SystemSetting> advancedSearch(@Param("category") String category,
                                        @Param("key") String key,
                                        @Param("description") String description,
                                        @Param("isEncrypted") Boolean isEncrypted);

    // Get all unique categories
    @Query("SELECT DISTINCT s.category FROM SystemSetting s ORDER BY s.category")
    List<String> findAllCategories();
}
