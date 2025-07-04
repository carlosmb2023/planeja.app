import { encryptionService, ENCRYPTED_FIELDS } from "@/lib/encryption";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

/**
 * Hook para lidar com dados criptografados automaticamente
 */
export function useEncryptedQuery<T>(
  queryKey: any[],
  entityType?: keyof typeof ENCRYPTED_FIELDS
) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await apiRequest('GET', queryKey[0]);
      const data = await response.json();
      
      // Se for um array de dados
      if (Array.isArray(data) && entityType) {
        return data.map(item => 
          encryptionService.decryptFields(item, ENCRYPTED_FIELDS[entityType])
        );
      }
      
      // Se for um objeto único
      if (entityType && data) {
        return encryptionService.decryptFields(data, ENCRYPTED_FIELDS[entityType]);
      }
      
      return data;
    }
  });
}

/**
 * Hook para mutações com criptografia automática
 */
export function useEncryptedMutation<T>(
  mutationFn: (variables: any) => Promise<any>,
  entityType?: keyof typeof ENCRYPTED_FIELDS
) {
  return useMutation({
    mutationFn: async (variables: any) => {
      let encryptedData = variables;
      
      // Criptografa os campos sensíveis antes de enviar
      if (entityType) {
        encryptedData = encryptionService.encryptFields(
          variables,
          ENCRYPTED_FIELDS[entityType]
        );
      }
      
      const result = await mutationFn(encryptedData);
      
      // Descriptografa a resposta se necessário
      if (entityType && result) {
        return encryptionService.decryptFields(
          result,
          ENCRYPTED_FIELDS[entityType]
        );
      }
      
      return result;
    }
  });
}

/**
 * Hook para criar transações criptografadas
 */
export function useCreateEncryptedTransaction() {
  return useEncryptedMutation(
    async (transaction: any) => {
      const response = await apiRequest('POST', '/api/transactions', transaction);
      return response.json();
    },
    'transactions'
  );
}

/**
 * Hook para buscar transações descriptografadas
 */
export function useEncryptedTransactions() {
  return useEncryptedQuery(['/api/transactions'], 'transactions');
}

/**
 * Hook para documentos
 */
export function useEncryptedDocuments() {
  return useEncryptedQuery(['/api/documents'], 'documents');
}

/**
 * Hook para ativos
 */
export function useEncryptedAssets() {
  return useEncryptedQuery(['/api/assets'], 'assets');
}