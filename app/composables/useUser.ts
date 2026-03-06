import type { UserWithRole } from "better-auth/plugins/admin";
import { authClient } from "~/utils/auth";

// Extended type for user updates including password
interface UserUpdateData extends Partial<UserWithRole> {
  newPassword?: string;
}

export const useUser = (userId: string) => {
  // Fetch user using useAsyncData for SSR optimization
  const {
    data: userData,
    pending: loading,
    refresh: fetchUser,
  } = useAsyncData(`admin-user-${userId}`, async () => {
    const result = await authClient.admin.listUsers({
      query: {
        limit: 1000,
        filterField: "id",
        filterValue: userId,
        filterOperator: "eq",
      },
    });

    if (result.data?.users && result.data.users.length > 0) {
      return result.data.users[0] || null;
    }
    return null;
  });

  const user = computed(() => userData.value);

  const updateUser = async (updates: UserUpdateData) => {
    if (!user.value) return;

    const allowedFields = [
      "email",
      "name",
      "image",
      "emailVerified",
      "banned",
      "banReason",
      "banExpires",
    ] as const;
    const hasOnlyPassword = Object.keys(updates).length === 1 && "newPassword" in updates;

    // Update password
    if (updates.newPassword) {
      const result = await authClient.admin.setUserPassword({
        userId: user.value.id,
        newPassword: updates.newPassword,
      });

      if (result.error) {
        throw new Error(result.error.message || "Failed to update password");
      }

      // If only updating password, refresh and return early
      if (hasOnlyPassword) {
        await fetchUser();
        return;
      }
    }

    // Update role
    if (updates.role && updates.role !== user.value.role) {
      const result = await authClient.admin.setRole({
        userId: user.value.id,
        role: updates.role as "user" | "admin",
      });

      if (result.error) {
        throw new Error(result.error.message || "Failed to update role");
      }
    }

    // Build update data with only allowed fields
    const updateData = allowedFields.reduce(
      (acc, field) => {
        if (updates[field] !== undefined) {
          acc[field] = updates[field];
        }
        return acc;
      },
      {} as Record<string, unknown>,
    );

    if (Object.keys(updateData).length > 0) {
      const result = await authClient.admin.updateUser({
        userId: user.value.id,
        data: updateData,
      });

      if (result.error) {
        throw new Error(result.error.message || "Failed to update user");
      }
    }

    // Refresh user data
    await fetchUser();
  };

  // Ban user
  const banUser = async (banReason?: string, banExpiresIn?: number) => {
    if (!user.value) return;

    const result = await authClient.admin.banUser({
      userId: user.value.id,
      banReason: banReason || "Banned by admin",
      banExpiresIn,
    });

    if (result.error) {
      throw new Error(result.error.message || "Failed to ban user");
    }

    // Refresh user data
    await fetchUser();
  };

  // Unban user
  const unbanUser = async () => {
    if (!user.value) return;

    const result = await authClient.admin.unbanUser({
      userId: user.value.id,
    });

    if (result.error) {
      throw new Error(result.error.message || "Failed to unban user");
    }

    // Refresh user data
    await fetchUser();
  };

  // Remove user
  const removeUser = async () => {
    if (!user.value) return;

    const result = await authClient.admin.removeUser({
      userId: user.value.id,
    });

    if (result.error) {
      throw new Error(result.error.message || "Failed to remove user");
    }

    // Clear local state
    userData.value = null;
  };

  // Impersonate user
  const impersonateUser = async () => {
    if (!user.value) return;

    const result = await authClient.admin.impersonateUser({
      userId: user.value.id,
    });

    if (result.error) {
      throw new Error(result.error.message || "Failed to impersonate user");
    }

    return result.data;
  };

  return {
    user,
    loading,
    fetchUser,
    updateUser,
    banUser,
    unbanUser,
    removeUser,
    impersonateUser,
  };
};
