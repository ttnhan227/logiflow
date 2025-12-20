package com.logiflow.server.repositories.customer;

import com.logiflow.server.models.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Integer> {

    @Query("SELECT c FROM Customer c LEFT JOIN FETCH c.user WHERE c.user.userId = :userId")
    Optional<Customer> findByUserId(@Param("userId") Integer userId);

    boolean existsByUser_UserId(Integer userId);

    @Query("SELECT c FROM Customer c WHERE c.user.username = :username")
    Optional<Customer> findByUsername(@Param("username") String username);

    @Query("SELECT COUNT(c) FROM Customer c WHERE c.user.userId = :userId")
    Long countByUserId(@Param("userId") Integer userId);

    @Query("SELECT DISTINCT c FROM Customer c JOIN FETCH c.user ORDER BY c.customerId")
    List<Customer> findAllCustomersWithUser();

    Optional<Customer> findByCompanyCode(String companyCode);
}
