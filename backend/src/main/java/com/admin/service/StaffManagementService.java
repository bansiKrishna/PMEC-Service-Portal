package com.admin.service;

import com.admin.dto.CreateStaffRequest;
import com.admin.dto.StaffResponse;
import com.user.entity.Role;

import java.util.List;

public interface StaffManagementService {

    StaffResponse createStaff(
            CreateStaffRequest request
    );

    StaffResponse getStaff(Long id);

    List<StaffResponse> getAllStaff();

    void disableStaff(Long id);

    void enableStaff(Long id);

    void changeStaffPassword(Long id, String password);

    StaffResponse changeStaffRole(Long id, Role role);
}