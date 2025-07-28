'use client';

import React, { useState, useEffect } from 'react';
import { UserRole } from '@/types/shared';
import { useNotification } from '@/components/shared/Notification';

interface User {
  _id?: string;
  employeeId: string;
  fullName: string;
  email: string;
  role: string;
  branch: string;
  department: string;
  isActive: boolean;
  createdAt: string;
  branches?: Array<{
    branchCode: string;
    branchName: string;
    assignedAt?: string;
  }>;
  permissions?: string[];
}

interface ManagementUser {
  _id?: string;
  managementId: string;
  employeeId: string;
  name: string;
  email: string;
  role: 'management';
  permissions: string[];
  queryTeamPreferences?: ('sales' | 'credit' | 'both')[];
  createdAt?: Date;
  isActive?: boolean;
}

interface Branch {
  _id: string;
  branchCode: string;
  branchName: string;
  isActive: boolean;
}

interface EditModalData {
  isOpen: boolean;
  user: User | null;
  type: 'password' | 'details';
}

interface DeleteModalData {
  isOpen: boolean;
  user: User | null;
}

interface ManagementModalData {
  isOpen: boolean;
  user: ManagementUser | null;
  type: 'view' | 'password' | 'delete';
}

const UserCreationTab = () => {
  const { showSuccess, showError, showWarning } = useNotification();
  const [users, setUsers] = useState<User[]>([]);
  const [managementUsers, setManagementUsers] = useState<ManagementUser[]>([]);
  const [activeUserTab, setActiveUserTab] = useState<'staff' | 'management'>('management');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [branchAssignments, setBranchAssignments] = useState<Array<{
    employeeId: string;
    name: string;
    role: string;
    branchCount: number;
    assignedBranches: Array<{branchCode: string; branchName: string}>;
  }>>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [editModal, setEditModal] = useState<EditModalData>({ isOpen: false, user: null, type: 'password' });
  const [deleteModal, setDeleteModal] = useState<DeleteModalData>({ isOpen: false, user: null });
  const [managementModal, setManagementModal] = useState<ManagementModalData>({ isOpen: false, user: null, type: 'view' });
  const [managementNewPassword, setManagementNewPassword] = useState('');
  const [confirmManagementPassword, setConfirmManagementPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'operations' as UserRole,
    selectedBranches: [] as string[]
  });
  const [editSelectAll, setEditSelectAll] = useState(false);

  // Branch Assignment states
  const [assignmentEmployeeId, setAssignmentEmployeeId] = useState('');
  const [selectedUserForAssignment, setSelectedUserForAssignment] = useState<User | null>(null);
  const [selectedBranchesForAssignment, setSelectedBranchesForAssignment] = useState<string[]>([]);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const [formData, setFormData] = useState({
    employeeId: '',
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'operations' as UserRole,
    selectedBranches: [] as string[],
    // Management-specific fields
    managementId: '',
    permissions: [] as string[],
    queryTeamPreferences: [] as ('sales' | 'credit' | 'both')[]
  });

  const [selectAll, setSelectAll] = useState(false);

  // Fetch users and branches on component mount
  useEffect(() => {
    fetchUsers();
    fetchManagementUsers();
    fetchBranches();
    fetchBranchAssignments();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      const result = await response.json();
      
      if (result.success) {
        setUsers(result.data);
      } else {
        console.error('Failed to fetch users:', result.error);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranchAssignments = async () => {
    try {
      const response = await fetch('/api/admin/user-branches');
      const result = await response.json();
      
      if (result.success) {
        setBranchAssignments(result.data);
      } else {
        console.error('Failed to fetch branch assignments:', result.error);
      }
    } catch (error) {
      console.error('Error fetching branch assignments:', error);
    }
  };

  // Helper function to get branch assignment info for a user
  const getBranchAssignmentInfo = (employeeId: string) => {
    const assignment = branchAssignments.find(a => a.employeeId === employeeId);
    return {
      branchCount: assignment?.branchCount || 0,
      assignedBranches: assignment?.assignedBranches || [],
      isTargetUser: employeeId === 'CONS0132' || employeeId === 'CONS0133'
    };
  };

  const fetchManagementUsers = async () => {
    try {
      const response = await fetch('/api/management');
      const result = await response.json();
      
      if (response.ok) {
        setManagementUsers(result.managementUsers || []);
      } else {
        console.error('Failed to fetch management users:', result.error);
      }
    } catch (error) {
      console.error('Error fetching management users:', error);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/branches?isActive=true');
      const result = await response.json();
      if (result.success) {
        setBranches(result.data);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  // Get active branch codes for the UI (changed to show names instead of codes)
  const activeBranches = branches.filter(branch => branch.isActive);
  const activeBranchCodes = activeBranches.map(branch => branch.branchCode);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRoleChange = (role: UserRole) => {
    setFormData(prev => ({
      ...prev,
      role
    }));
  };

  const handleBranchChange = (branchCode: string) => {
    setFormData(prev => ({
      ...prev,
      selectedBranches: prev.selectedBranches.includes(branchCode)
        ? prev.selectedBranches.filter(b => b !== branchCode)
        : [...prev.selectedBranches, branchCode]
    }));
  };

  const handleSelectAllBranches = () => {
    if (selectAll) {
      setFormData(prev => ({ ...prev, selectedBranches: [] }));
    } else {
      setFormData(prev => ({ ...prev, selectedBranches: [...activeBranchCodes] }));
    }
    setSelectAll(!selectAll);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      showError("Password Mismatch", "Passwords do not match!");
      return;
    }
    
    if (!formData.employeeId || !formData.fullName || !formData.email || !formData.phone || !formData.password) {
      showError("Missing Information", "Please fill all fields!");
      return;
    }

    // Additional validation for management users
    if (formData.role === 'management') {
      if (!formData.managementId) {
        showError("Missing Management ID", "Please provide a management ID!");
        return;
      }
      if (formData.permissions.length === 0) {
        showError("Missing Permissions", "Please select at least one permission for the management user!");
        return;
      }
      if (formData.queryTeamPreferences.length === 0) {
        showError("Missing Team Preferences", "Please select at least one query team preference!");
        return;
      }
    } else {
      // For non-management users, branch selection is required
      if (formData.selectedBranches.length === 0) {
        showError("Branch Selection Required", "Please select at least one branch for the user!");
        return;
      }
    }

    try {
      setLoading(true);
      
      if (formData.role === 'management') {
        // Handle management user creation
        const managementResponse = await fetch('/api/management', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            managementId: formData.managementId,
            employeeId: formData.employeeId,
            name: formData.fullName,
            email: formData.email,
            password: formData.password,
            role: 'management',
            permissions: formData.permissions,
            queryTeamPreferences: formData.queryTeamPreferences
          }),
        });

        const managementResult = await managementResponse.json();
        
        if (managementResult.success) {
          showSuccess(
            "Management User Created Successfully!",
            `Management user ${formData.fullName} created successfully!\nManagement ID: ${formData.managementId}`
          );
          
          // Reset form
          setFormData({
            employeeId: '',
            fullName: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: '',
            role: 'operations',
            selectedBranches: [],
            managementId: '',
            permissions: [],
            queryTeamPreferences: []
          });
          setSelectAll(false);
          
          fetchUsers(); // Refresh the user list
          fetchManagementUsers(); // Refresh the management user list
          fetchBranchAssignments(); // Refresh branch assignments
        } else {
          showError(
            "Management User Creation Failed",
            `Failed to create management user: ${managementResult.error || 'Unknown error'}`
          );
        }
      } else {
        // Handle regular user creation (existing logic)
        const primaryBranch = branches.find(b => b.branchCode === formData.selectedBranches[0]);
        const userResponse = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            employeeId: formData.employeeId,
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            role: formData.role,
            branch: formData.selectedBranches.length === 1 ? (primaryBranch?.branchName || 'Unknown') : 'Multiple',
            branchCode: primaryBranch?.branchCode || formData.selectedBranches[0],
            department: 'General'
          }),
        });

        const userResult = await userResponse.json();
        
        if (userResult.success) {
          // Now assign access rights
          const accessResponse = await fetch('/api/access-rights', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: userResult.data._id,
              role: formData.role,
              branches: formData.selectedBranches,
              permissions: []
            }),
          });

          const accessResult = await accessResponse.json();
          
          if (accessResult.success) {
            // Notify real-time sync system about branch assignment
            try {
              await fetch(`/api/users/branches/${formData.employeeId}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  branches: formData.selectedBranches.map(branchCode => {
                    const branch = branches.find(b => b.branchCode === branchCode);
                    return {
                      branchCode: branchCode,
                      branchName: branch?.branchName || 'Unknown Branch',
                      assignedAt: new Date().toISOString()
                    };
                  })
                }),
              });
              
              console.log(`✅ Notified real-time sync for user ${formData.employeeId} branch assignments:`, formData.selectedBranches);
            } catch (syncError) {
              console.warn('Failed to notify real-time sync system:', syncError);
            }
            
            showSuccess(
              "User Created Successfully!",
              `User ${formData.fullName} created successfully with ${formData.role} role and access to ${formData.selectedBranches.length} branch(es)!`
            );
            
            // Reset form
            setFormData({
              employeeId: '',
              fullName: '',
              email: '',
              phone: '',
              password: '',
              confirmPassword: '',
              role: 'operations',
              selectedBranches: [],
              managementId: '',
              permissions: [],
              queryTeamPreferences: []
            });
            setSelectAll(false);
            
            fetchUsers(); // Refresh the user list
            fetchBranchAssignments(); // Refresh branch assignments
          } else {
            showWarning(
              "Partial Success",
              `User created but failed to assign access rights: ${accessResult.error}`
            );
          }
        } else {
          showError(
            "User Creation Failed",
            `Failed to create user: ${userResult.error || 'Unknown error'}`
          );
        }
      }
    } catch (error) {
      console.error('Error creating user:', error);
      showError(
        "System Error",
        'Failed to create user. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const openEditPasswordModal = (user: User) => {
    setEditModal({ isOpen: true, user, type: 'password' });
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const openEditDetailsModal = async (user: User) => {
    setEditModal({ isOpen: true, user, type: 'details' });
    
    // Load user's current details and branch permissions
    setEditFormData({
      fullName: user.fullName,
      email: user.email,
      phone: '', // Will be loaded from API
      role: user.role as UserRole,
      selectedBranches: []
    });

    // Fetch user's branch permissions
    if (user._id) {
      try {
        const response = await fetch(`/api/users/${user._id}`);
        const result = await response.json();
        if (result.success && result.data.permissions) {
          const branchPermissions = result.data.permissions
            .filter((perm: string) => perm.startsWith('branch:'))
            .map((perm: string) => perm.replace('branch:', ''));
          setEditFormData(prev => ({ ...prev, selectedBranches: branchPermissions }));
        }
      } catch (error) {
        console.error('Error loading user details:', error);
      }
    }
  };

  const closeEditModal = () => {
    setEditModal({ isOpen: false, user: null, type: 'password' });
    setNewPassword('');
    setConfirmNewPassword('');
    setEditFormData({
      fullName: '',
      email: '',
      phone: '',
      role: 'operations',
      selectedBranches: []
    });
    setEditSelectAll(false);
  };

  const openDeleteModal = (user: User) => {
    setDeleteModal({ isOpen: true, user });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, user: null });
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmNewPassword) {
      showError("Password Mismatch", "New passwords do not match!");
      return;
    }

    if (!editModal.user || !editModal.user._id) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/users/${editModal.user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword }),
      });

      const result = await response.json();
      
      if (result.success) {
        showSuccess("Password Updated", `Password for ${editModal.user.fullName} updated successfully!`);
        closeEditModal();
        fetchUsers(); // Refresh the user list
        fetchBranchAssignments(); // Refresh branch assignments
      } else {
        showError("Update Failed", `Failed to update password: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating password:', error);
      showError("System Error", 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditRoleChange = (role: UserRole) => {
    setEditFormData(prev => ({
      ...prev,
      role
    }));
  };

  const handleEditBranchChange = (branchCode: string) => {
    setEditFormData(prev => ({
      ...prev,
      selectedBranches: prev.selectedBranches.includes(branchCode)
        ? prev.selectedBranches.filter(b => b !== branchCode)
        : [...prev.selectedBranches, branchCode]
    }));
  };

  const handleEditSelectAllBranches = () => {
    if (editSelectAll) {
      setEditFormData(prev => ({ ...prev, selectedBranches: [] }));
    } else {
      setEditFormData(prev => ({ ...prev, selectedBranches: [...activeBranchCodes] }));
    }
    setEditSelectAll(!editSelectAll);
  };

  const handleUserDetailsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editModal.user || !editModal.user._id) return;

    if (editFormData.selectedBranches.length === 0) {
      showError("Branch Selection Required", "Please select at least one branch for the user!");
      return;
    }

    try {
      setLoading(true);
      
      // Update user details
      const userResponse = await fetch(`/api/users/${editModal.user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: editFormData.fullName,
          email: editFormData.email,
          role: editFormData.role,
          branch: editFormData.selectedBranches.length === 1 ? 
            (branches.find(b => b.branchCode === editFormData.selectedBranches[0])?.branchName || 'Unknown') : 
            'Multiple',
        }),
      });

      const userResult = await userResponse.json();
      
      if (userResult.success) {
        // Update access rights
        const accessResponse = await fetch('/api/access-rights', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: editModal.user._id,
            role: editFormData.role,
            branches: editFormData.selectedBranches,
            permissions: []
          }),
        });

        const accessResult = await accessResponse.json();
        
        if (accessResult.success) {
          showSuccess("User Updated", `User ${editFormData.fullName} updated successfully!`);
          closeEditModal();
          fetchUsers(); // Refresh the user list
          fetchBranchAssignments(); // Refresh branch assignments
        } else {
          showWarning("Partial Success", `User updated but failed to update access rights: ${accessResult.error}`);
        }
      } else {
        showError("Update Failed", `Failed to update user: ${userResult.error}`);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      showError("System Error", 'Failed to update user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteModal.user || !deleteModal.user._id) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/users/${deleteModal.user._id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.success) {
        showSuccess("User Deleted", `User ${deleteModal.user.fullName} deleted successfully!`);
        closeDeleteModal();
        fetchUsers(); // Refresh the user list
        fetchBranchAssignments(); // Refresh branch assignments
      } else {
        showError("Delete Failed", `Failed to delete user: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showError("System Error", 'Failed to delete user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Management User Modal Handlers
  const openManagementViewModal = (user: ManagementUser) => {
    setManagementModal({ isOpen: true, user, type: 'view' });
  };

  const openManagementPasswordModal = (user: ManagementUser) => {
    setManagementModal({ isOpen: true, user, type: 'password' });
    setManagementNewPassword('');
    setConfirmManagementPassword('');
  };

  const openManagementDeleteModal = (user: ManagementUser) => {
    setManagementModal({ isOpen: true, user, type: 'delete' });
  };

  const closeManagementModal = () => {
    setManagementModal({ isOpen: false, user: null, type: 'view' });
    setManagementNewPassword('');
    setConfirmManagementPassword('');
  };

  const handleManagementPasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!managementModal.user || !managementModal.user.managementId) return;
    
    if (managementNewPassword !== confirmManagementPassword) {
      showError("Password Mismatch", "Passwords do not match!");
      return;
    }

    if (managementNewPassword.length < 6) {
      showError("Password Too Short", "Password must be at least 6 characters long!");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/management/${encodeURIComponent(managementModal.user.managementId)}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: managementNewPassword
        }),
      });

      const result = await response.json();
      
      console.log('Password update response:', { status: response.status, result });
      
      if (result.success || response.ok) {
        showSuccess("Password Updated", `Password updated successfully for ${managementModal.user.name}!`);
        closeManagementModal();
        // Reset password fields
        setManagementNewPassword('');
        setConfirmManagementPassword('');
      } else {
        console.error('Password update failed:', result);
        showError("Update Failed", `Failed to update password: ${result.error || result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating management user password:', error);
      showError("System Error", 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleManagementUserDelete = async () => {
    if (!managementModal.user || !managementModal.user.managementId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/management/${encodeURIComponent(managementModal.user.managementId)}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.success || response.ok) {
        showSuccess("Management User Deleted", `Management user ${managementModal.user.name} deleted successfully!`);
        closeManagementModal();
        fetchManagementUsers(); // Refresh the management user list
      } else {
        showError("Delete Failed", `Failed to delete management user: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting management user:', error);
      showError("System Error", 'Failed to delete management user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Branch Assignment Handlers
  const handleEmployeeSearch = async () => {
    if (!assignmentEmployeeId.trim()) {
      showError("Missing Employee ID", "Please enter an Employee ID to search.");
      return;
    }

    try {
      setSearchLoading(true);
      const user = users.find(u => u.employeeId === assignmentEmployeeId.trim());
      
      if (user) {
        setSelectedUserForAssignment(user);
        // Load current branch assignments
        const currentAssignments = getBranchAssignmentInfo(user.employeeId);
        setSelectedBranchesForAssignment(currentAssignments.assignedBranches.map(b => b.branchCode));
      } else {
        showError("User Not Found", `No user found with Employee ID: ${assignmentEmployeeId}`);
        setSelectedUserForAssignment(null);
        setSelectedBranchesForAssignment([]);
      }
    } catch (error) {
      console.error('Error searching for user:', error);
      showError("Search Error", 'Failed to search for user. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAssignmentBranchChange = (branchCode: string) => {
    setSelectedBranchesForAssignment(prev => 
      prev.includes(branchCode)
        ? prev.filter(b => b !== branchCode)
        : [...prev, branchCode]
    );
  };

  const handleAssignBranches = async () => {
    if (!selectedUserForAssignment) {
      showError("No User Selected", "Please search and select a user first.");
      return;
    }

    if (selectedBranchesForAssignment.length === 0) {
      showError("No Branches Selected", "Please select at least one branch to assign.");
      return;
    }

    try {
      setAssignmentLoading(true);
      
      // Prepare branch data
      const branchData = selectedBranchesForAssignment.map(branchCode => {
        const branch = branches.find(b => b.branchCode === branchCode);
        return {
          branchCode: branchCode,
          branchName: branch?.branchName || 'Unknown Branch'
        };
      });

      // Determine team based on user role
      const team = selectedUserForAssignment.role === 'credit' ? 'credit' : 'sales';

      const response = await fetch('/api/admin/user-branches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignments: [{
            employeeId: selectedUserForAssignment.employeeId,
            branches: branchData,
            team: team
          }]
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        showSuccess(
          "Branches Assigned Successfully!", 
          `${selectedBranchesForAssignment.length} branch(es) assigned to ${selectedUserForAssignment.fullName}`
        );
        
        // Refresh data
        fetchBranchAssignments();
        clearAssignmentForm();
      } else {
        showError("Assignment Failed", `Failed to assign branches: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error assigning branches:', error);
      showError("System Error", 'Failed to assign branches. Please try again.');
    } finally {
      setAssignmentLoading(false);
    }
  };

  const clearAssignmentForm = () => {
    setAssignmentEmployeeId('');
    setSelectedUserForAssignment(null);
    setSelectedBranchesForAssignment([]);
  };

  return (
    <div>
      {/* User Creation Form */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-black mb-3">👤 Create New User Account & Assign Access</h3>
        <p className="text-sm text-black mb-3">Create user accounts with complete role and branch name assignment.</p>
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <p className="text-sm text-indigo-800">
            <strong>✅ Complete Setup:</strong> User creation now includes role assignment and branch name configuration.
          </p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6 bg-gradient-to-br from-white to-indigo-50 p-8 rounded-xl border border-indigo-200 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="employeeId" className="block text-sm font-bold text-black mb-2">
              Employee ID
            </label>
            <input
              type="text"
              name="employeeId"
              id="employeeId"
              value={formData.employeeId}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900 transition-all duration-200"
              placeholder="Enter employee ID"
            />
          </div>
          
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-black mb-2">
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              id="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900 transition-all duration-200"
              placeholder="Enter full name"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-black mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900 transition-all duration-200"
              placeholder="Enter email address"
            />
          </div>
          
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-black mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              id="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900 transition-all duration-200"
              placeholder="Enter phone number"
            />
          </div>


          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-black mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                id="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 pr-12 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900 transition-all duration-200"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-black"
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-black mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-4 py-3 pr-12 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900 transition-all duration-200"
                placeholder="Confirm password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-black"
              >
                {showConfirmPassword ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Role Selection */}
        <div className="border-t border-gray-200 pt-8">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Role Assignment</h3>
          <p className="mt-1 text-sm text-gray-500">Define the user's role and permissions.</p>
          <fieldset className="mt-4">
            <legend className="sr-only">Role</legend>
            <div className="space-y-4 sm:flex sm:items-center sm:space-y-0 sm:space-x-10">
              <div className="flex items-center">
                <input
                  id="role-ops"
                  name="role"
                  type="radio"
                  checked={formData.role === 'operations'}
                  onChange={() => handleRoleChange('operations')}
                  className="focus:ring-cyan-500 h-4 w-4 text-cyan-600 border-gray-300"
                />
                <label htmlFor="role-ops" className="ml-3 block text-sm font-medium text-black">
                  Operations
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="role-credit"
                  name="role"
                  type="radio"
                  checked={formData.role === 'credit'}
                  onChange={() => handleRoleChange('credit')}
                  className="focus:ring-cyan-500 h-4 w-4 text-cyan-600 border-gray-300"
                />
                <label htmlFor="role-credit" className="ml-3 block text-sm font-medium text-black">
                  Credit
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="role-sales"
                  name="role"
                  type="radio"
                  checked={formData.role === 'sales'}
                  onChange={() => handleRoleChange('sales')}
                  className="focus:ring-cyan-500 h-4 w-4 text-cyan-600 border-gray-300"
                />
                <label htmlFor="role-sales" className="ml-3 block text-sm font-medium text-black">
                  Sales
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="role-admin"
                  name="role"
                  type="radio"
                  checked={formData.role === 'admin'}
                  onChange={() => handleRoleChange('admin')}
                  className="focus:ring-cyan-500 h-4 w-4 text-cyan-600 border-gray-300"
                />
                <label htmlFor="role-admin" className="ml-3 block text-sm font-medium text-black">
                  Admin
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="role-management"
                  name="role"
                  type="radio"
                  checked={formData.role === 'management'}
                  onChange={() => handleRoleChange('management')}
                  className="focus:ring-cyan-500 h-4 w-4 text-cyan-600 border-gray-300"
                />
                <label htmlFor="role-management" className="ml-3 block text-sm font-medium text-black">
                  Management
                </label>
              </div>
            </div>
          </fieldset>
        </div>

        {/* Management-specific fields */}
        {formData.role === 'management' && (
          <>
            {/* Management ID */}
            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Management Details</h3>
              <p className="mt-1 text-sm text-gray-500">Additional information for management users.</p>
              <div className="mt-4">
                <label htmlFor="managementId" className="block text-sm font-medium text-black">
                  Management ID
                </label>
                <input
                  type="text"
                  id="managementId"
                  name="managementId"
                  value={formData.managementId}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm text-gray-900"
                  placeholder="Enter management ID"
                />
              </div>
            </div>

            {/* Authorization Selection */}
            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Authorization Options</h3>
              <p className="mt-1 text-sm text-gray-500">Select the permissions this management user will have.</p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="approve_queries"
                    checked={formData.permissions.includes('approve_queries')}
                    onChange={(e) => {
                      const { checked } = e.target;
                      setFormData(prev => ({
                        ...prev,
                        permissions: checked 
                          ? [...prev.permissions, 'approve_queries']
                          : prev.permissions.filter(p => p !== 'approve_queries')
                      }));
                    }}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="approve_queries" className="ml-3 flex items-center">
                    <span className="text-green-600 mr-2">✅</span>
                    <span className="text-sm font-medium text-green-800">General Query Approval</span>
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="approve_otc_queries"
                    checked={formData.permissions.includes('approve_otc_queries')}
                    onChange={(e) => {
                      const { checked } = e.target;
                      setFormData(prev => ({
                        ...prev,
                        permissions: checked 
                          ? [...prev.permissions, 'approve_otc_queries']
                          : prev.permissions.filter(p => p !== 'approve_otc_queries')
                      }));
                    }}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label htmlFor="approve_otc_queries" className="ml-3 flex items-center">
                    <span className="text-orange-600 mr-2">🟡</span>
                    <span className="text-sm font-medium text-orange-800">OTC Query Approval</span>
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="approve_deferral_queries"
                    checked={formData.permissions.includes('approve_deferral_queries')}
                    onChange={(e) => {
                      const { checked } = e.target;
                      setFormData(prev => ({
                        ...prev,
                        permissions: checked 
                          ? [...prev.permissions, 'approve_deferral_queries']
                          : prev.permissions.filter(p => p !== 'approve_deferral_queries')
                      }));
                    }}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="approve_deferral_queries" className="ml-3 flex items-center">
                    <span className="text-purple-600 mr-2">⏳</span>
                    <span className="text-sm font-medium text-purple-800">Deferral Query Approval</span>
                  </label>
                </div>
              </div>
              
              {/* Selected Permissions Preview */}
              {formData.permissions.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-800 mb-2">Selected Authorizations:</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.permissions.includes('approve_queries') && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800 border border-green-300">
                        ✅ General Approval
                      </span>
                    )}
                    {formData.permissions.includes('approve_otc_queries') && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-bold rounded-full bg-orange-100 text-orange-800 border border-orange-300">
                        🟡 OTC Authority
                      </span>
                    )}
                    {formData.permissions.includes('approve_deferral_queries') && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-800 border border-purple-300">
                        ⏳ Deferral Control
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Query Team Preferences */}
            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Query Team Viewing Preferences</h3>
              <p className="mt-1 text-sm text-gray-500">
                Select which team's queries this management user can view and approve.
              </p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sales_queries"
                    checked={formData.queryTeamPreferences.includes('sales')}
                    onChange={(e) => {
                      const { checked } = e.target;
                      setFormData(prev => ({
                        ...prev,
                        queryTeamPreferences: checked 
                          ? [...prev.queryTeamPreferences, 'sales']
                          : prev.queryTeamPreferences.filter(p => p !== 'sales')
                      }));
                    }}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="sales_queries" className="ml-3 flex items-center">
                    <span className="text-green-600 mr-2">📈</span>
                    <span className="text-sm font-medium text-green-800">Sales Team Queries</span>
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="credit_queries"
                    checked={formData.queryTeamPreferences.includes('credit')}
                    onChange={(e) => {
                      const { checked } = e.target;
                      setFormData(prev => ({
                        ...prev,
                        queryTeamPreferences: checked 
                          ? [...prev.queryTeamPreferences, 'credit']
                          : prev.queryTeamPreferences.filter(p => p !== 'credit')
                      }));
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="credit_queries" className="ml-3 flex items-center">
                    <span className="text-blue-600 mr-2">💳</span>
                    <span className="text-sm font-medium text-blue-800">Credit Team Queries</span>
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="both_queries"
                    checked={formData.queryTeamPreferences.includes('both')}
                    onChange={(e) => {
                      const { checked } = e.target;
                      setFormData(prev => ({
                        ...prev,
                        queryTeamPreferences: checked 
                          ? [...prev.queryTeamPreferences, 'both']
                          : prev.queryTeamPreferences.filter(p => p !== 'both')
                      }));
                    }}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="both_queries" className="ml-3 flex items-center">
                    <span className="text-purple-600 mr-2">🔄</span>
                    <span className="text-sm font-medium text-purple-800">Both Teams (Universal)</span>
                  </label>
                </div>
              </div>
              
              {/* Selected Query Team Preferences Preview */}
              {formData.queryTeamPreferences.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-green-800 mb-2">Selected Query Teams:</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.queryTeamPreferences.includes('sales') && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800 border border-green-300">
                        📈 Sales Queries
                      </span>
                    )}
                    {formData.queryTeamPreferences.includes('credit') && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                        💳 Credit Queries
                      </span>
                    )}
                    {formData.queryTeamPreferences.includes('both') && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-800 border border-purple-300">
                        🔄 Universal Access
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Branch Name - Only show for non-management users */}
        {formData.role !== 'management' && (
          <div className="border-t border-gray-200 pt-8">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Branch Name</h3>
            <p className="mt-1 text-sm text-gray-500">Select the branches this user will have access to.</p>
            <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              {/* Select All */}
              <div className="flex items-center mb-4 pb-4 border-b border-gray-300">
                <input
                  id="selectAllBranches"
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAllBranches}
                  className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                />
                <label htmlFor="selectAllBranches" className="ml-3 text-sm font-bold text-black">
                  Select All ({activeBranchCodes.length} branches)
                </label>
              </div>

            {/* Branch Grid - Enhanced Design - Now showing branch names */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
              {activeBranches.map((branch) => (
                <div key={branch.branchCode} className="relative">
                  <input
                    id={`branch-${branch.branchCode.toLowerCase()}`}
                    type="checkbox"
                    checked={formData.selectedBranches.includes(branch.branchCode)}
                    onChange={() => handleBranchChange(branch.branchCode)}
                    className="sr-only"
                  />
                  <label
                    htmlFor={`branch-${branch.branchCode.toLowerCase()}`}
                    className={`block w-full p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                      formData.selectedBranches.includes(branch.branchCode)
                        ? 'border-cyan-500 bg-cyan-50 text-cyan-900 shadow-sm'
                        : 'border-gray-200 bg-white text-black hover:border-cyan-300 hover:bg-cyan-25'
                    }`}
                    title={`${branch.branchCode} - ${branch.branchName}`}
                  >
                    <div className="flex items-center justify-center">
                        <div className={`w-4 h-4 rounded border-2 mr-2 flex items-center justify-center ${
                          formData.selectedBranches.includes(branch.branchCode)
                            ? 'border-cyan-500 bg-cyan-500 text-white'
                            : 'border-gray-300 bg-white'
                        }`}>
                          {formData.selectedBranches.includes(branch.branchCode) && (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      <span className="text-sm font-bold">{branch.branchName}</span>
                      {formData.selectedBranches.includes(branch.branchCode) && (
                        <div className="ml-auto text-cyan-500">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              ))}
            </div>              {/* Selected Count */}
              {formData.selectedBranches.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-300">
                  <p className="text-sm text-cyan-600 font-medium">
                    {formData.selectedBranches.length} branch{formData.selectedBranches.length !== 1 ? 'es' : ''} selected
                  </p>
                </div>
              )}

              {/* Enhanced Selected Branches Display */}
              {formData.selectedBranches.length > 0 && (
                <div className="mt-6 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-200">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-cyan-800">
                      ✅ Selected Branches ({formData.selectedBranches.length})
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, selectedBranches: [] }));
                        setSelectAll(false);
                      }}
                      className="text-xs text-cyan-600 hover:text-cyan-800 font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.selectedBranches.map((branchCode) => {
                      const branch = activeBranches.find(b => b.branchCode === branchCode);
                      return (
                        <span
                          key={branchCode}
                          className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-800 border border-cyan-300 shadow-sm"
                          title={branch?.branchName || branchCode}
                        >
                          <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-6a1 1 0 00-1-1H9a1 1 0 00-1 1v6a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                          </svg>
                          <span className="font-bold">{branchCode}</span>
                          <button
                            type="button"
                            onClick={() => handleBranchChange(branchCode)}
                            className="ml-2 text-cyan-600 hover:text-cyan-800 hover:bg-cyan-200 rounded-full p-0.5 transition-colors"
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </span>
                      );
                    })}
                  </div>
                  
                  {/* Branch Categories Summary */}
                  {formData.selectedBranches.length > 5 && (
                    <div className="mt-3 pt-3 border-t border-cyan-200">
                      <p className="text-xs text-cyan-700">
                        <span className="font-medium">Coverage:</span> {formData.selectedBranches.length} out of {activeBranchCodes.length} total branches
                        {formData.selectedBranches.length === activeBranchCodes.length && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-300">
                            🌟 Full Access
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Summary */}
        {formData.fullName && formData.role && (
          (formData.role === 'management' || formData.selectedBranches.length > 0) && (
            <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-lg font-medium text-blue-900 mb-3">User Creation Summary</h4>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Name:</span> {formData.fullName}</p>
                <p><span className="font-medium">Employee ID:</span> {formData.employeeId}</p>
                <p><span className="font-medium">Role:</span> {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}</p>
                
                {formData.role === 'management' ? (
                  <>
                    <p><span className="font-medium">Management ID:</span> {formData.managementId}</p>
                    <p><span className="font-medium">Permissions:</span> {formData.permissions.length} selected</p>
                    <p><span className="font-medium">Query Teams:</span> {formData.queryTeamPreferences.length} selected</p>
                  </>
                ) : (
                  <>
                    <p><span className="font-medium">Branch Name:</span> {formData.selectedBranches.length} selected</p>
                    {formData.selectedBranches.length > 0 && formData.selectedBranches.length <= 5 && (
                      <p className="text-blue-700"><span className="font-medium">Selected branches:</span> {formData.selectedBranches.join(', ')}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        )}
        
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center py-3 px-6 border border-transparent rounded-lg text-white bg-cyan-600 hover:bg-cyan-700 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating User...
              </>
            ) : (
              'Create User'
            )}
          </button>
        </div>
      </form>

      {/* Assigned Branches Section - Only for Sales and Credit Users */}
      <div className="mt-12 mb-12">
        <div className="bg-gradient-to-br from-white to-green-50 p-8 rounded-xl border border-green-200 shadow-lg">
          <h3 className="text-2xl font-bold text-green-800 mb-3">🔗 Assign Branches to Staff</h3>
          <p className="text-sm text-green-700 mb-6">Search for a staff user by Employee ID and assign branch access. Branch assignment is only available for Sales and Credit users.</p>
          
          {/* Employee Search */}
          <div className="mb-6">
            <label htmlFor="assignmentEmployeeId" className="block text-sm font-bold text-green-800 mb-2">
              Employee ID Search
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                id="assignmentEmployeeId"
                value={assignmentEmployeeId}
                onChange={(e) => setAssignmentEmployeeId(e.target.value)}
                className="flex-1 px-4 py-3 bg-white border border-green-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 transition-all duration-200"
                placeholder="Enter Employee ID (e.g., CONS0132)"
                onKeyPress={(e) => e.key === 'Enter' && handleEmployeeSearch()}
              />
              <button
                type="button"
                onClick={handleEmployeeSearch}
                disabled={searchLoading || !assignmentEmployeeId.trim()}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {searchLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Searching...
                  </>
                ) : (
                  '🔍 Search'
                )}
              </button>
            </div>
          </div>

          {/* User Details */}
          {selectedUserForAssignment && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-lg font-bold text-blue-800 mb-2">👤 User Found</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-700">Name:</span>
                  <p className="text-blue-900">{selectedUserForAssignment.fullName}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Employee ID:</span>
                  <p className="text-blue-900">{selectedUserForAssignment.employeeId}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Role:</span>
                  <p className="text-blue-900 capitalize">{selectedUserForAssignment.role}</p>
                </div>
              </div>
              
              {/* Current Branch Assignments */}
              {(() => {
                const currentAssignments = getBranchAssignmentInfo(selectedUserForAssignment.employeeId);
                return currentAssignments.branchCount > 0 && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <span className="font-medium text-blue-700">Current Assigned Branches ({currentAssignments.branchCount}):</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {currentAssignments.assignedBranches.map((branch, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300">
                          {branch.branchCode}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Information for Operations Users */}
          {selectedUserForAssignment && selectedUserForAssignment.role === 'operations' && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <h4 className="text-lg font-bold text-orange-800 mb-2">ℹ️ Operations Team Access</h4>
              <p className="text-sm text-orange-700">
                Operations team members have access to all branches by default. Branch assignment is only applicable for Sales and Credit team members.
              </p>
            </div>
          )}

          {/* Branch Selection - Only for Sales and Credit Users */}
          {selectedUserForAssignment && (selectedUserForAssignment.role === 'sales' || selectedUserForAssignment.role === 'credit') && (
            <div className="mb-6">
              <h4 className="text-lg font-bold text-green-800 mb-3">🏢 Select Branches to Assign</h4>
              <p className="text-sm text-green-600 mb-4">Choose branch codes to assign to this user. Selected branches will be marked.</p>
              
              <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                {/* Select All Option */}
                <div className="mb-4 pb-3 border-b border-green-200">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedBranchesForAssignment.length === activeBranches.length && activeBranches.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          // Select all branches
                          setSelectedBranchesForAssignment(activeBranches.map(branch => branch.branchCode));
                        } else {
                          // Deselect all branches
                          setSelectedBranchesForAssignment([]);
                        }
                      }}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-green-300 rounded"
                    />
                    <span className="ml-2 text-sm font-medium text-green-800">
                      Select All ({activeBranches.length} branches)
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                  {activeBranches.map((branch) => (
                    <div key={branch.branchCode} className="relative">
                      <input
                        id={`assign-branch-${branch.branchCode.toLowerCase()}`}
                        type="checkbox"
                        checked={selectedBranchesForAssignment.includes(branch.branchCode)}
                        onChange={() => handleAssignmentBranchChange(branch.branchCode)}
                        className="sr-only"
                      />
                      <label
                        htmlFor={`assign-branch-${branch.branchCode.toLowerCase()}`}
                        className={`block w-full p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                          selectedBranchesForAssignment.includes(branch.branchCode)
                            ? 'border-green-500 bg-green-100 text-green-900 shadow-sm'
                            : 'border-gray-200 bg-white text-black hover:border-green-300 hover:bg-green-25'
                        }`}
                        title={`${branch.branchCode} - ${branch.branchName}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                            selectedBranchesForAssignment.includes(branch.branchCode)
                              ? 'border-green-500 bg-green-500 text-white'
                              : 'border-gray-300 bg-white'
                          }`}>
                            {selectedBranchesForAssignment.includes(branch.branchCode) && (
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <span className="text-sm font-bold">{branch.branchCode}</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1 truncate" title={branch.branchName}>
                          {branch.branchName}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>

                {/* Selected Count */}
                {selectedBranchesForAssignment.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <p className="text-sm text-green-700 font-medium">
                      {selectedBranchesForAssignment.length} branch{selectedBranchesForAssignment.length !== 1 ? 'es' : ''} selected: {selectedBranchesForAssignment.join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons - Only for Sales and Credit Users */}
          {selectedUserForAssignment && (selectedUserForAssignment.role === 'sales' || selectedUserForAssignment.role === 'credit') && (
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={clearAssignmentForm}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200"
              >
                🔄 Clear Form
              </button>
              
              <button
                type="button"
                onClick={handleAssignBranches}
                disabled={assignmentLoading || selectedBranchesForAssignment.length === 0}
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {assignmentLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Assigning Branches...
                  </>
                ) : (
                  <>
                    ✅ Assign {selectedBranchesForAssignment.length} Branch{selectedBranchesForAssignment.length !== 1 ? 'es' : ''}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* User List */}
      <div className="mt-12">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveUserTab('management')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeUserTab === 'management'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-black hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span>👤</span>
                <span>Management Users</span>
                <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-1 rounded-full">
                  {managementUsers.length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveUserTab('staff')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeUserTab === 'staff'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-black hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span>👥</span>
                <span>Staff Users</span>
                <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded-full">
                  {users.length}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Management Users Tab */}
        {activeUserTab === 'management' && (
          <div>
            <h3 className="text-xl font-bold text-black mb-6">
              👤 Management Users ({managementUsers.length})
            </h3>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white divide-y divide-gray-200 rounded-lg shadow">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Management ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Permissions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Query Teams
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {managementUsers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                          No management users found
                        </td>
                      </tr>
                    ) : (
                      managementUsers.map((user) => (
                        <tr key={user._id || user.managementId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <div className="flex flex-col">
                              <span className="font-semibold">{user.managementId}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            {user.employeeId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            {user.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 text-sm text-black">
                            <div className="flex flex-wrap gap-1">
                              {user.permissions.includes('approve_queries') && (
                                <span className="inline-flex items-center px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800 border border-green-300">
                                  ✅ General
                                </span>
                              )}
                              {user.permissions.includes('approve_otc_queries') && (
                                <span className="inline-flex items-center px-2 py-1 text-xs font-bold rounded-full bg-orange-100 text-orange-800 border border-orange-300">
                                  🟡 OTC
                                </span>
                              )}
                              {user.permissions.includes('approve_deferral_queries') && (
                                <span className="inline-flex items-center px-2 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-800 border border-purple-300">
                                  ⏳ Deferral
                                </span>
                              )}
                              {user.permissions.length === 0 && (
                                <span className="text-gray-400 text-xs">No permissions</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-black">
                            <div className="flex flex-wrap gap-1">
                              {user.queryTeamPreferences?.includes('sales') && (
                                <span className="inline-flex items-center px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800 border border-green-300">
                                  📈 Sales
                                </span>
                              )}
                              {user.queryTeamPreferences?.includes('credit') && (
                                <span className="inline-flex items-center px-2 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                                  💳 Credit
                                </span>
                              )}
                              {user.queryTeamPreferences?.includes('both') && (
                                <span className="inline-flex items-center px-2 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-800 border border-purple-300">
                                  🔄 Both
                                </span>
                              )}
                              {(!user.queryTeamPreferences || user.queryTeamPreferences.length === 0) && (
                                <span className="text-gray-400 text-xs">No preferences</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              user.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.isActive !== false ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-3">
                              <button
                                onClick={() => openManagementViewModal(user)}
                                className="text-indigo-600 hover:text-indigo-800 transition-colors duration-200"
                              >
                                View
                              </button>
                              <button
                                onClick={() => openManagementPasswordModal(user)}
                                className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                              >
                                Reset Password
                              </button>
                              <button
                                onClick={() => openManagementDeleteModal(user)}
                                className="text-red-600 hover:text-red-800 transition-colors duration-200"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Staff Users Tab */}
        {activeUserTab === 'staff' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-black">👥 Staff Users ({users.length})</h3>
              <button
                onClick={() => {
                  fetchUsers();
                  fetchBranchAssignments();
                }}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh Branch Data</span>
              </button>
            </div>
            
            {/* Quick Summary for Target Users */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CONS0132 Credit User Summary */}
              {(() => {
                const cons0132Info = getBranchAssignmentInfo('CONS0132');
                const cons0132User = users.find(u => u.employeeId === 'CONS0132');
                return (
                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-orange-800">🎯 CONS0132 (Credit User)</h4>
                      <span className="text-xs text-orange-600">Target User</span>
                    </div>
                    {cons0132User ? (
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Name:</span> {cons0132User.fullName}</p>
                        <p><span className="font-medium">Branch Codes Assigned:</span> 
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${
                            cons0132Info.branchCount > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {cons0132Info.branchCount}
                          </span>
                        </p>
                        {cons0132Info.assignedBranches.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {cons0132Info.assignedBranches.map((branch, index) => (
                              <span key={index} className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium" title={`${branch.branchCode} - ${branch.branchName}`}>
                                {branch.branchCode}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-orange-600">User not found in system</p>
                    )}
                  </div>
                );
              })()}

              {/* CONS0133 Sales User Summary */}
              {(() => {
                const cons0133Info = getBranchAssignmentInfo('CONS0133');
                const cons0133User = users.find(u => u.employeeId === 'CONS0133');
                return (
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-green-800">🎯 CONS0133 (Sales User)</h4>
                      <span className="text-xs text-green-600">Target User</span>
                    </div>
                    {cons0133User ? (
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Name:</span> {cons0133User.fullName}</p>
                        <p><span className="font-medium">Branch Names Assigned:</span> 
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${
                            cons0133Info.branchCount > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {cons0133Info.branchCount}
                          </span>
                        </p>
                        {cons0133Info.assignedBranches.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {cons0133Info.assignedBranches.map((branch, index) => (
                              <span key={index} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                                {branch.branchName}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-green-600">User not found in system</p>
                    )}
                  </div>
                );
              })()}
            </div>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <svg className="animate-spin h-8 w-8 text-cyan-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white divide-y divide-gray-200 rounded-lg shadow">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branch Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned Branches
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      No users created yet
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const branchInfo = getBranchAssignmentInfo(user.employeeId);
                    return (
                    <tr 
                      key={user._id || user.employeeId} 
                      className={`hover:bg-gray-50 ${branchInfo.isTargetUser ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        <div className="flex items-center">
                          <span>{user.employeeId}</span>
                          {branchInfo.isTargetUser && (
                            <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                              TARGET
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{user.fullName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'operations' ? 'bg-blue-100 text-blue-800' :
                          user.role === 'sales' ? 'bg-green-100 text-green-800' :
                          user.role === 'credit' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {user.branch === 'Multiple' ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200">
                              🏢 Multiple Branches
                            </span>
                            {/* Show individual branches if available */}
                            {user.branches && user.branches.length > 0 ? (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {user.branches.slice(0, 3).map((branch, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 border border-green-200"
                                  >
                                    {branch.branchName}
                                  </span>
                                ))}
                                {user.branches.length > 3 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                    +{user.branches.length - 3} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              /* Fallback: Show branch permissions if available */
                              user.permissions && user.permissions.filter((p: string) => p.startsWith('branch:')).length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {user.permissions
                                    .filter((p: string) => p.startsWith('branch:'))
                                    .slice(0, 3)
                                    .map((branchPermission: string, index: number) => {
                                      const branchName = branchPermission.replace('branch:', '');
                                      return (
                                        <span
                                          key={index}
                                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 border border-green-200"
                                        >
                                          {branchName}
                                        </span>
                                      );
                                    })}
                                  {user.permissions.filter((p: string) => p.startsWith('branch:')).length > 3 && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                      +{user.permissions.filter((p: string) => p.startsWith('branch:')).length - 3} more
                                    </span>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-800 border border-cyan-200">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-6a1 1 0 00-1-1H9a1 1 0 00-1 1v6a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                              </svg>
                              {user.branch}
                            </span>
                          </div>
                        )}
                      </td>
                      {/* New Assigned Branches Count Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            branchInfo.branchCount > 0 
                              ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                              : 'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}>
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm2 2v6h10V10H5z" clipRule="evenodd" />
                            </svg>
                            {branchInfo.branchCount} Branch{branchInfo.branchCount !== 1 ? 'es' : ''}
                          </span>
                          {branchInfo.isTargetUser && branchInfo.branchCount > 0 && (
                            <div className="text-xs text-gray-500">
                              {user.employeeId === 'CONS0132' ? '(Credit User)' : '(Sales User)'}
                            </div>
                          )}
                        </div>
                        {/* Show branch codes if available */}
                        {branchInfo.assignedBranches.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {branchInfo.assignedBranches.slice(0, 2).map((branch, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700 border border-indigo-200"
                                title={`${branch.branchCode} - ${branch.branchName}`}
                              >
                                {branch.branchCode}
                              </span>
                            ))}
                            {branchInfo.assignedBranches.length > 2 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                +{branchInfo.assignedBranches.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => openEditDetailsModal(user)}
                            className="text-cyan-600 hover:text-cyan-800 transition-colors duration-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => openEditPasswordModal(user)}
                            className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                          >
                            Password
                          </button>
                          <button
                            onClick={() => openDeleteModal(user)}
                            className="text-red-600 hover:text-red-800 transition-colors duration-200"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModal.isOpen && editModal.type === 'password' && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Edit Password for <span className="font-bold text-cyan-600">{editModal.user?.fullName}</span>
            </h3>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-black mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900"
                  placeholder="Enter new password"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-black mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmNewPassword"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900"
                  placeholder="Confirm new password"
                  required
                />
              </div>
              
              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors duration-200"
                >
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Details Modal */}
      {editModal.isOpen && editModal.type === 'details' && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6 mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Edit User Details for <span className="font-bold text-cyan-600">{editModal.user?.fullName}</span>
            </h3>
            <form onSubmit={handleUserDetailsUpdate} className="space-y-6">
              {/* Basic Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="editFullName" className="block text-sm font-bold text-black mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="editFullName"
                    name="fullName"
                    value={editFormData.fullName}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-black bg-white font-bold"
                    style={{ color: '#000000', backgroundColor: '#ffffff', fontWeight: '700' }}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="editEmail" className="block text-sm font-bold text-black mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="editEmail"
                    name="email"
                    value={editFormData.email}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-black bg-white font-bold"
                    style={{ color: '#000000', backgroundColor: '#ffffff', fontWeight: '700' }}
                    required
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-3">Role Assignment</h4>
                <div className="space-y-4 sm:flex sm:items-center sm:space-y-0 sm:space-x-10">
                  <div className="flex items-center">
                    <input
                      id="edit-role-ops"
                      name="editRole"
                      type="radio"
                      checked={editFormData.role === 'operations'}
                      onChange={() => handleEditRoleChange('operations')}
                      className="focus:ring-cyan-500 h-4 w-4 text-cyan-600 border-gray-300"
                    />
                    <label htmlFor="edit-role-ops" className="ml-3 block text-sm font-medium text-black">
                      Operations
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="edit-role-credit"
                      name="editRole"
                      type="radio"
                      checked={editFormData.role === 'credit'}
                      onChange={() => handleEditRoleChange('credit')}
                      className="focus:ring-cyan-500 h-4 w-4 text-cyan-600 border-gray-300"
                    />
                    <label htmlFor="edit-role-credit" className="ml-3 block text-sm font-medium text-black">
                      Credit
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="edit-role-sales"
                      name="editRole"
                      type="radio"
                      checked={editFormData.role === 'sales'}
                      onChange={() => handleEditRoleChange('sales')}
                      className="focus:ring-cyan-500 h-4 w-4 text-cyan-600 border-gray-300"
                    />
                    <label htmlFor="edit-role-sales" className="ml-3 block text-sm font-medium text-black">
                      Sales
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="edit-role-admin"
                      name="editRole"
                      type="radio"
                      checked={editFormData.role === 'admin'}
                      onChange={() => handleEditRoleChange('admin')}
                      className="focus:ring-cyan-500 h-4 w-4 text-cyan-600 border-gray-300"
                    />
                    <label htmlFor="edit-role-admin" className="ml-3 block text-sm font-medium text-black">
                      Admin
                    </label>
                  </div>
                </div>
              </div>

              {/* Branch Name */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-3">Branch Name</h4>
                <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  {/* Select All */}
                  <div className="flex items-center mb-4 pb-4 border-b border-gray-300">
                    <input
                      id="editSelectAllBranches"
                      type="checkbox"
                      checked={editSelectAll}
                      onChange={handleEditSelectAllBranches}
                      className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    <label htmlFor="editSelectAllBranches" className="ml-3 text-sm font-bold text-black">
                      Select All ({activeBranchCodes.length} branches)
                    </label>
                  </div>

                  {/* Branch Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {activeBranches.map((branch) => (
                      <div key={branch.branchCode} className="flex items-center">
                        <input
                          id={`edit-branch-${branch.branchCode.toLowerCase()}`}
                          type="checkbox"
                          checked={editFormData.selectedBranches.includes(branch.branchCode)}
                          onChange={() => handleEditBranchChange(branch.branchCode)}
                          className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                        />
                        <label
                          htmlFor={`edit-branch-${branch.branchCode.toLowerCase()}`}
                          className="ml-3 text-sm text-black truncate"
                          title={`${branch.branchCode} - ${branch.branchName}`}
                        >
                          <span className="font-bold">{branch.branchName}</span>
                        </label>
                      </div>
                    ))}
                  </div>

                  {/* Selected Count */}
                  {editFormData.selectedBranches.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-300">
                      <p className="text-sm text-cyan-600 font-medium">
                        {editFormData.selectedBranches.length} branch{editFormData.selectedBranches.length !== 1 ? 'es' : ''} selected
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors duration-200 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </>
                  ) : (
                    'Update User'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Delete User
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-bold text-red-600">{deleteModal.user?.fullName}</span>? 
              This action cannot be undone and will permanently remove the user and all associated data.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete User'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Management User View Modal */}
      {managementModal.isOpen && managementModal.type === 'view' && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Management User Details: <span className="font-bold text-indigo-600">{managementModal.user?.name}</span>
            </h3>
            
            <div className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-black">Management ID</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">{managementModal.user?.managementId}</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-black">Employee ID</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">{managementModal.user?.employeeId}</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-black">Full Name</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">{managementModal.user?.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-black">Email</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">{managementModal.user?.email}</p>
                </div>
              </div>

              {/* Permissions */}
              <div>
                <label className="block text-sm font-bold text-black mb-2">Permissions</label>
                <div className="flex flex-wrap gap-2">
                  {managementModal.user?.permissions.includes('approve_queries') && (
                    <span className="inline-flex items-center px-3 py-1 text-sm font-bold rounded-full bg-green-100 text-green-800 border border-green-300">
                      ✅ General Query Approval
                    </span>
                  )}
                  {managementModal.user?.permissions.includes('approve_otc_queries') && (
                    <span className="inline-flex items-center px-3 py-1 text-sm font-bold rounded-full bg-orange-100 text-orange-800 border border-orange-300">
                      🟡 OTC Query Approval
                    </span>
                  )}
                  {managementModal.user?.permissions.includes('approve_deferral_queries') && (
                    <span className="inline-flex items-center px-3 py-1 text-sm font-bold rounded-full bg-purple-100 text-purple-800 border border-purple-300">
                      ⏳ Deferral Query Approval
                    </span>
                  )}
                  {managementModal.user?.permissions.length === 0 && (
                    <span className="text-gray-500 text-sm">No permissions assigned</span>
                  )}
                </div>
              </div>

              {/* Query Team Preferences */}
              <div>
                <label className="block text-sm font-bold text-black mb-2">Query Team Preferences</label>
                <div className="flex flex-wrap gap-2">
                  {managementModal.user?.queryTeamPreferences?.includes('sales') && (
                    <span className="inline-flex items-center px-3 py-1 text-sm font-bold rounded-full bg-green-100 text-green-800 border border-green-300">
                      📈 Sales Queries
                    </span>
                  )}
                  {managementModal.user?.queryTeamPreferences?.includes('credit') && (
                    <span className="inline-flex items-center px-3 py-1 text-sm font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                      💳 Credit Queries
                    </span>
                  )}
                  {managementModal.user?.queryTeamPreferences?.includes('both') && (
                    <span className="inline-flex items-center px-3 py-1 text-sm font-bold rounded-full bg-purple-100 text-purple-800 border border-purple-300">
                      🔄 Both Teams
                    </span>
                  )}
                  {(!managementModal.user?.queryTeamPreferences || managementModal.user?.queryTeamPreferences.length === 0) && (
                    <span className="text-gray-500 text-sm">No team preferences set</span>
                  )}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-bold text-black">Status</label>
                <p className="mt-1">
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                    managementModal.user?.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {managementModal.user?.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>

              {/* Created Date */}
              {managementModal.user?.createdAt && (
                <div>
                  <label className="block text-sm font-bold text-black">Created Date</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {new Date(managementModal.user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={closeManagementModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Management User Password Reset Modal */}
      {managementModal.isOpen && managementModal.type === 'password' && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Reset Password for <span className="font-bold text-indigo-600">{managementModal.user?.name}</span>
            </h3>
            <form onSubmit={handleManagementPasswordUpdate} className="space-y-4">
              <div>
                <label htmlFor="managementNewPassword" className="block text-sm font-bold text-black mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  id="managementNewPassword"
                  value={managementNewPassword}
                  onChange={(e) => setManagementNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                  placeholder="Enter new password"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="confirmManagementPassword" className="block text-sm font-bold text-black mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmManagementPassword"
                  value={confirmManagementPassword}
                  onChange={(e) => setConfirmManagementPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                  placeholder="Confirm new password"
                  required
                />
              </div>
              
              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeManagementModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors duration-200 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Management User Delete Confirmation Modal */}
      {managementModal.isOpen && managementModal.type === 'delete' && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Delete Management User
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete management user <span className="font-bold text-red-600">{managementModal.user?.name}</span>? 
              This action cannot be undone and will permanently remove the user and all associated management permissions.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeManagementModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleManagementUserDelete}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete Management User'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserCreationTab; 
