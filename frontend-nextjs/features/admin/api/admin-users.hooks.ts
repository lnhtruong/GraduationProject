import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminUsersApi, type UpdateUserDto, type AdminUsersParams } from "./admin-users.api";

const QUERY_KEY_ROOT = ["admin", "users"] as const;
const queryKey = (params?: AdminUsersParams) => [...QUERY_KEY_ROOT, params] as const;

export function useAdminUsers(params?: AdminUsersParams) {
  return useQuery({
    queryKey: queryKey(params),
    queryFn: () => adminUsersApi.listAll(params),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useAdminUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateUserDto }) =>
      adminUsersApi.update(id, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY_ROOT }),
  });
}

export function useAdminResetPassword() {
  return useMutation({
    mutationFn: (id: number) => adminUsersApi.resetPassword(id),
  });
}
