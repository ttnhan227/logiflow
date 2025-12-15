package com.logiflow.server.repositories.chat;

import com.logiflow.server.models.ChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("SELECT m FROM ChatMessage m WHERE m.tripId = :tripId ORDER BY m.createdAt ASC")
    List<ChatMessage> findByTripId(@Param("tripId") Integer tripId);

    // Optional: latest messages
    @Query("SELECT m FROM ChatMessage m WHERE m.tripId = :tripId ORDER BY m.createdAt DESC")
    List<ChatMessage> findLatestByTripId(@Param("tripId") Integer tripId, Pageable pageable);
}
