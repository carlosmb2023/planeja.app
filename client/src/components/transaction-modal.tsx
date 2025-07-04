import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { authManager } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TransactionModal({ isOpen, onClose }: TransactionModalProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [categoryId, setCategoryId] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories", {
        headers: authManager.getAuthHeader(),
      });
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (transactionData: any) => {
      const response = await apiRequest('POST', '/api/transactions', transactionData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Transação adicionada!",
        description: "Sua transação foi registrada com sucesso.",
      });
      
      // Reset form
      setDescription("");
      setAmount("");
      setType("expense");
      setCategoryId("");
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar transação",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description || !amount || !categoryId) {
      toast({
        title: "Dados obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const numericAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast({
        title: "Valor inválido",
        description: "Insira um valor válido para a transação.",
        variant: "destructive",
      });
      return;
    }

    createTransactionMutation.mutate({
      description,
      amount: numericAmount.toString(),
      type,
      categoryId: parseInt(categoryId),
    });
  };

  const filteredCategories = categories?.filter((cat: any) => cat.type === type) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-montserrat text-lg font-semibold text-dark-bg">
            Nova Transação
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
              Descrição
            </Label>
            <Input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2 px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary border-gray-300"
              placeholder="Ex: Almoço restaurante"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount" className="text-sm font-medium text-gray-700">
                Valor
              </Label>
              <Input
                id="amount"
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-2 px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary border-gray-300"
                placeholder="0,00"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="type" className="text-sm font-medium text-gray-700">
                Tipo
              </Label>
              <Select value={type} onValueChange={(value: "income" | "expense") => {
                setType(value);
                setCategoryId(""); // Reset category when type changes
              }}>
                <SelectTrigger className="mt-2 px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Despesa</SelectItem>
                  <SelectItem value="income">Receita</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="category" className="text-sm font-medium text-gray-700">
              Categoria
            </Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="mt-2 px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary border-gray-300">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((category: any) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button
            type="submit"
            disabled={createTransactionMutation.isPending}
            className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200"
          >
            {createTransactionMutation.isPending ? "Adicionando..." : "Adicionar Transação"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
