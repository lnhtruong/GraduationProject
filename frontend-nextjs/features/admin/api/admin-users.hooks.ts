import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminUsersApi, type UpdateUserDto } from "./admin-users.api";

const QUERY_KEY = ["admin", "users"] as const;

export function useAdminUsers() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: adminUsersApi.listAll,
    staleTime: 30_000,
  });
}

export function useAdminUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateUserDto }) =>
      adminUsersApi.update(id, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useAdminResetPassword() {
  return useMutation({
    mutationFn: (id: number) => adminUsersApi.resetPassword(id),
  });
}
