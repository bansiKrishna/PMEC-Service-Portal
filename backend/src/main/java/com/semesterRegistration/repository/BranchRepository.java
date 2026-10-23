
package com.semesterRegistration.repository;

import com.semesterRegistration.entity.Branch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BranchRepository extends JpaRepository<Branch, Long> {

    Optional<Branch> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    List<Branch> findByActiveTrueOrderByNameAsc();

    List<Branch> findAllByOrderByNameAsc();
}

//
//What these methods do
//      Method	                                        Purpose
//findByCodeIgnoreCase()	         Find a branch using its code, such as CSE.
//existsByCodeIgnoreCase()	         Check whether a branch code already exists.
//findByActiveTrueOrderByNameAsc()   List only active branches, alphabetically.
//findAllByOrderByNameAsc()	         List every branch, including inactive ones.