"use client";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  UserPlus,
  Edit,
  Trash2,
  Search,
  Loader2,
  Undo2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import clsx from "clsx";

const ROLES = ["admin", "manager", "viewer"];
const STATUS = ["active", "disabled"];
const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getInitials(email: string) {
  if (!email) return "?";
  const [name] = email.split("@");
  return name.slice(0, 2).toUpperCase();
}

function relativeTime(date: string | null) {
  if (!date) return "-";
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString();
}

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState(ROLES[0]);
  const [newStatus, setNewStatus] = useState(STATUS[0]);
  const [newAvatarUrl, setNewAvatarUrl] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[1]);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [undoUser, setUndoUser] = useState<any | null>(null);
  const [undoTimeout, setUndoTimeout] = useState<any>(null);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const { toast } = useToast();

  // Simulate current user role (replace with real auth/role check)
  const currentUserRole = "admin"; // Change to "viewer" to test read-only

  // Fetch users from Supabase
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("app_users")
      .select(
        "id, email, role, avatar_url, status, created_at, last_login"
      );
    if (error) setError(error.message);
    else setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
    // Cleanup undo timeout on unmount
    return () => {
      if (undoTimeout) clearTimeout(undoTimeout);
    };
    // eslint-disable-next-line
  }, []);

  // Filtering, searching, sorting, and pagination
  const filteredUsers = useMemo(() => {
    let filtered = users;
    if (search) {
      filtered = filtered.filter(
        (u) =>
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          u.role.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (roleFilter) {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }
    if (statusFilter) {
      filtered = filtered.filter((u) => u.status === statusFilter);
    }
    // Sorting
    filtered = [...filtered].sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (valA === null || valA === undefined) valA = "";
      if (valB === null || valB === undefined) valB = "";
      if (sortBy === "created_at" || sortBy === "last_login") {
        valA = valA ? new Date(valA).getTime() : 0;
        valB = valB ? new Date(valB).getTime() : 0;
      }
      if (typeof valA === "string" && typeof valB === "string") {
        return sortDir === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      return sortDir === "asc" ? valA - valB : valB - valA;
    });
    return filtered;
  }, [users, search, roleFilter, statusFilter, sortBy, sortDir]);

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));

  // Add user logic
  const addUser = async () => {
    setFormError(null);
    if (!newEmail) {
      setFormError("Email is required.");
      return;
    }
    if (!isValidEmail(newEmail)) {
      setFormError("Please enter a valid email address.");
      return;
    }
    setAddLoading(true);
    setError(null);
    // Check for duplicate email
    const { data: existing, error: checkError } = await supabase
      .from("app_users")
      .select("id")
      .eq("email", newEmail);
    if (checkError) {
      setFormError(checkError.message);
      setAddLoading(false);
      return;
    }
    if (existing && existing.length > 0) {
      setFormError("A user with this email already exists.");
      setAddLoading(false);
      return;
    }
    // Insert new user
    const { error: insertError } = await supabase.from("app_users").insert([
      {
        email: newEmail,
        role: newRole,
        status: newStatus,
        avatar_url: newAvatarUrl || null,
      },
    ]);
    if (insertError) {
      setFormError(insertError.message);
      setAddLoading(false);
      return;
    }
    await fetchUsers();
    setShowAddModal(false);
    setNewEmail("");
    setNewRole(ROLES[0]);
    setNewStatus(STATUS[0]);
    setNewAvatarUrl("");
    setBanner({ type: "success", message: `User ${newEmail} added successfully.` });
    setAddLoading(false);
  };

  // Edit user logic
  const openEditModal = (user: any) => {
    setSelectedUser(user);
    setNewEmail(user.email);
    setNewRole(user.role);
    setNewStatus(user.status || STATUS[0]);
    setNewAvatarUrl(user.avatar_url || "");
    setShowEditModal(true);
    setFormError(null);
  };
  const editUser = async () => {
    setFormError(null);
    if (!selectedUser) return;
    if (!newEmail) {
      setFormError("Email is required.");
      return;
    }
    if (!isValidEmail(newEmail)) {
      setFormError("Please enter a valid email address.");
      return;
    }
    setEditLoading(true);
    setError(null);
    // Check for duplicate email (if changed)
    if (newEmail !== selectedUser.email) {
      const { data: existing, error: checkError } = await supabase
        .from("app_users")
        .select("id")
        .eq("email", newEmail);
      if (checkError) {
        setFormError(checkError.message);
        setEditLoading(false);
        return;
      }
      if (existing && existing.length > 0) {
        setFormError("A user with this email already exists.");
        setEditLoading(false);
        return;
      }
    }
    // Update user
    const { error: updateError } = await supabase
      .from("app_users")
      .update({
        email: newEmail,
        role: newRole,
        status: newStatus,
        avatar_url: newAvatarUrl || null,
      })
      .eq("id", selectedUser.id);
    if (updateError) {
      setFormError(updateError.message);
      setEditLoading(false);
      return;
    }
    await fetchUsers();
    setShowEditModal(false);
    setSelectedUser(null);
    setNewEmail("");
    setNewRole(ROLES[0]);
    setNewStatus(STATUS[0]);
    setNewAvatarUrl("");
    setBanner({ type: "success", message: `User ${newEmail} updated successfully.` });
    setEditLoading(false);
  };

  // Delete user logic (with undo)
  const openDeleteModal = (user: any) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };
  const deleteUser = async () => {
    if (!selectedUser) return;
    setDeleteLoading(true);
    setError(null);
    // Remove from UI immediately (soft delete)
    setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
    setShowDeleteModal(false);
    setUndoUser(selectedUser);
    // Set undo timeout (5 seconds)
    const timeout = setTimeout(async () => {
      // Real delete in DB
      await supabase.from("app_users").delete().eq("id", selectedUser.id);
      setUndoUser(null);
    }, 5000);
    setUndoTimeout(timeout);
    setBanner({
      type: "success",
      message: (
        <span>
          User deleted.{" "}
          <Button
            variant="link"
            size="sm"
            onClick={undoDelete}
            className="inline px-1"
            aria-label="Undo delete"
          >
            <Undo2 className="inline h-4 w-4 mr-1" />
            Undo
          </Button>
        </span>
      ) as any,
    });
    setDeleteLoading(false);
  };
  const undoDelete = async () => {
    if (!undoUser) return;
    // Re-insert user in DB
    await supabase.from("app_users").insert([undoUser]);
    await fetchUsers();
    setUndoUser(null);
    if (undoTimeout) clearTimeout(undoTimeout);
    setBanner({ type: "success", message: "User restored." });
  };

  // Pagination controls
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  // Sorting controls
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDir("asc");
    }
  };

  // Reset page on filter/search/page size change
  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter, pageSize]);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-8">
        {banner && (
          <div
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded mb-4",
              banner.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            )}
            role="alert"
          >
            {banner.type === "success" ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            <span>{banner.message}</span>
            <button
              className="ml-auto text-lg font-bold"
              aria-label="Close banner"
              onClick={() => setBanner(null)}
            >
              ×
            </button>
          </div>
        )}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardHeader className="p-0">
              <CardTitle>User Management / إدارة المستخدمين</CardTitle>
              <CardDescription>
                Manage users, roles, and permissions. / إدارة المستخدمين والأدوار والأذونات.
              </CardDescription>
            </CardHeader>
          </div>
          <div className="flex flex-col md:flex-row gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by email or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 w-48"
                aria-label="Search users"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border rounded px-2 py-1 w-32"
              aria-label="Filter by role"
            >
              <option value="">All Roles</option>
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded px-2 py-1 w-32"
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              {STATUS.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="border rounded px-2 py-1 w-32"
              aria-label="Page size"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
            {currentUserRole === "admin" && (
              <Button onClick={() => setShowAddModal(true)}>
                <UserPlus className="mr-2 h-4 w-4" /> Add User
              </Button>
            )}
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="animate-spin mr-2" /> Loading users...
              </div>
            ) : error ? (
              <p className="text-red-500">Error: {error}</p>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center py-12">
                <span className="text-6xl mb-2">👤</span>
                <p className="text-gray-500">No users found.</p>
                {currentUserRole === "admin" && (
                  <Button
                    className="mt-4"
                    onClick={() => setShowAddModal(true)}
                  >
                    <UserPlus className="mr-2 h-4 w-4" /> Add your first user
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr>
                      <th className="px-4 py-2 text-left">Avatar</th>
                      <th
                        className="px-4 py-2 text-left cursor-pointer select-none"
                        onClick={() => handleSort("email")}
                        aria-sort={sortBy === "email" ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                        tabIndex={0}
                      >
                        Email{" "}
                        {sortBy === "email" &&
                          (sortDir === "asc" ? (
                            <ChevronUp className="inline h-4 w-4" />
                          ) : (
                            <ChevronDown className="inline h-4 w-4" />
                          ))}
                      </th>
                      <th
                        className="px-4 py-2 text-left cursor-pointer select-none"
                        onClick={() => handleSort("role")}
                        aria-sort={sortBy === "role" ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                        tabIndex={0}
                      >
                        Role{" "}
                        {sortBy === "role" &&
                          (sortDir === "asc" ? (
                            <ChevronUp className="inline h-4 w-4" />
                          ) : (
                            <ChevronDown className="inline h-4 w-4" />
                          ))}
                      </th>
                      <th
                        className="px-4 py-2 text-left cursor-pointer select-none"
                        onClick={() => handleSort("status")}
                        aria-sort={sortBy === "status" ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                        tabIndex={0}
                      >
                        Status{" "}
                        {sortBy === "status" &&
                          (sortDir === "asc" ? (
                            <ChevronUp className="inline h-4 w-4" />
                          ) : (
                            <ChevronDown className="inline h-4 w-4" />
                          ))}
                      </th>
                      <th
                        className="px-4 py-2 text-left cursor-pointer select-none"
                        onClick={() => handleSort("created_at")}
                        aria-sort={sortBy === "created_at" ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                        tabIndex={0}
                      >
                        Created At{" "}
                        {sortBy === "created_at" &&
                          (sortDir === "asc" ? (
                            <ChevronUp className="inline h-4 w-4" />
                          ) : (
                            <ChevronDown className="inline h-4 w-4" />
                          ))}
                      </th>
                      <th
                        className="px-4 py-2 text-left cursor-pointer select-none"
                        onClick={() => handleSort("last_login")}
                        aria-sort={sortBy === "last_login" ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                        tabIndex={0}
                      >
                        Last Login{" "}
                        {sortBy === "last_login" &&
                          (sortDir === "asc" ? (
                            <ChevronUp className="inline h-4 w-4" />
                          ) : (
                            <ChevronDown className="inline h-4 w-4" />
                          ))}
                      </th>
                      <th className="px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((user: any, idx: number) => (
                      <tr
                        key={user.id}
                        className={clsx(
                          idx % 2 === 0
                            ? "bg-white"
                            : "bg-gray-50 dark:bg-gray-900/10",
                          "hover:bg-blue-50 transition"
                        )}
                      >
                        <td className="px-4 py-2">
                          <Avatar>
                            {user.avatar_url ? (
                              <AvatarImage src={user.avatar_url} alt={user.email} />
                            ) : (
                              <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                            )}
                          </Avatar>
                        </td>
                        <td className="px-4 py-2 font-mono">{user.email}</td>
                        <td className="px-4 py-2 capitalize">{user.role}</td>
                        <td className="px-4 py-2">
                          <span
                            className={clsx(
                              "inline-block px-2 py-1 rounded text-xs font-semibold",
                              user.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-200 text-gray-600"
                            )}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          {user.created_at
                            ? new Date(user.created_at).toLocaleString()
                            : "-"}
                        </td>
                        <td className="px-4 py-2">
                          {user.last_login
                            ? relativeTime(user.last_login)
                            : "-"}
                        </td>
                        <td className="px-4 py-2">
                          {currentUserRole === "admin" ? (
                            <div className="flex gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openEditModal(user)}
                                title="Edit user"
                                aria-label="Edit user"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openDeleteModal(user)}
                                title="Delete user"
                                aria-label="Delete user"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">
                              Read-only
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" /> Prev
                    </Button>
                    <span>
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                      aria-label="Next page"
                    >
                      Next <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="text-sm text-muted-foreground mt-2">
                  Showing {paginatedUsers.length} of {filteredUsers.length} users
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        {/* Add User Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent aria-describedby="add-user-desc">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription id="add-user-desc">
                Enter the user's email, role, status, and (optionally) avatar URL.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                type="email"
                autoFocus
                disabled={addLoading}
                aria-label="User email"
              />
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="border rounded px-2 py-1 w-full"
                disabled={addLoading}
                aria-label="User role"
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="border rounded px-2 py-1 w-full"
                disabled={addLoading}
                aria-label="User status"
              >
                {STATUS.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
              <Input
                placeholder="Avatar URL (optional)"
                value={newAvatarUrl}
                onChange={(e) => setNewAvatarUrl(e.target.value)}
                type="url"
                disabled={addLoading}
                aria-label="Avatar URL"
              />
              {formError && (
                <div className="text-red-600 text-sm">{formError}</div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={addUser} disabled={addLoading}>
                {addLoading ? (
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                ) : null}
                {addLoading ? "Adding..." : "Add User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Edit User Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent aria-describedby="edit-user-desc">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription id="edit-user-desc">
                Update the user's email, role, status, and avatar URL.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                type="email"
                autoFocus
                disabled={editLoading}
                aria-label="User email"
              />
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="border rounded px-2 py-1 w-full"
                disabled={editLoading}
                aria-label="User role"
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="border rounded px-2 py-1 w-full"
                disabled={editLoading}
                aria-label="User status"
              >
                {STATUS.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
              <Input
                placeholder="Avatar URL (optional)"
                value={newAvatarUrl}
                onChange={(e) => setNewAvatarUrl(e.target.value)}
                type="url"
                disabled={editLoading}
                aria-label="Avatar URL"
              />
              {formError && (
                <div className="text-red-600 text-sm">{formError}</div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={editUser} disabled={editLoading}>
                {editLoading ? (
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                ) : null}
                {editLoading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Delete User Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent aria-describedby="delete-user-desc">
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
              <DialogDescription id="delete-user-desc">
                Are you sure you want to delete this user? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <span className="font-mono">{selectedUser?.email}</span>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={deleteUser}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                ) : null}
                {deleteLoading ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
