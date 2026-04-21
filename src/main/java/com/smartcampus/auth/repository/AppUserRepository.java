package com.smartcampus.auth.repository;

import com.smartcampus.auth.model.AppUser;
import com.smartcampus.auth.model.UserRole;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface AppUserRepository extends MongoRepository<AppUser, String> {

    Optional<AppUser> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, String id);

    long countByRole(UserRole role);

    List<AppUser> findByRole(UserRole role);

    List<AppUser> findByRoleIn(Collection<UserRole> roles);
}
