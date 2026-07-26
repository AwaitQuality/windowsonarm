import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { aqApi } from "@/lib/http/client";
import { useToast } from "@/lib/hooks/useToast";
import type {
  ApiKeySummary,
  CreateApiKeyInput,
  CreatedApiKey,
  UpdateApiKeyInput,
} from "@/lib/schemas/api-key";

const QUERY_KEY = ["api-keys"] as const;

export interface UpdateApiKeyVariables {
  id: string;
  input: UpdateApiKeyInput;
}

/**
 * The admin's own API keys, plus the create/revoke/rename mutations.
 *
 * The created token is returned by the mutation and deliberately not cached:
 * it exists for exactly one render, and stashing it in the query cache would
 * keep a live credential in memory long after the panel that showed it closed.
 */
export const useApiKeys = () => {
  const { notify } = useToast();
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const { data: keys = [], isPending, isError, error } = useQuery<
    ApiKeySummary[]
  >({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const response = await aqApi.get<ApiKeySummary[]>("/api/v1/admin/keys");
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
  });

  const createKey = useMutation<CreatedApiKey, Error, CreateApiKeyInput>({
    mutationFn: async (input) => {
      const response = await aqApi.post<CreatedApiKey, CreateApiKeyInput>(
        "/api/v1/admin/keys",
        input
      );
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: invalidate,
    onError: (mutationError) => {
      notify("Couldn't create the key", mutationError.message, "error");
    },
  });

  const updateKey = useMutation<ApiKeySummary, Error, UpdateApiKeyVariables>({
    mutationFn: async ({ id, input }) => {
      const response = await aqApi.patch<ApiKeySummary, UpdateApiKeyInput>(
        `/api/v1/admin/keys/${id}`,
        input
      );
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      notify("Key updated");
      invalidate();
    },
    onError: (mutationError) => {
      notify("Couldn't update the key", mutationError.message, "error");
    },
  });

  const revokeKey = useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const response = await aqApi.delete(`/api/v1/admin/keys/${id}`);
      if (!response.success) throw new Error(response.error);
    },
    onSuccess: () => {
      notify("Key revoked", "Any request using it now fails.");
      invalidate();
    },
    onError: (mutationError) => {
      notify("Couldn't revoke the key", mutationError.message, "error");
    },
  });

  return {
    keys,
    isPending,
    isError,
    error,
    createKey,
    updateKey,
    revokeKey,
  };
};
