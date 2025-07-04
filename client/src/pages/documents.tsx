import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, FileUp, FileText, Download, Calendar, Search } from "lucide-react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authManager } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/bottom-navigation";

export default function Documents() {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [fileName, setFileName] = useState("");
  const [category, setCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useQuery({
    queryKey: ["/api/documents"],
    queryFn: async () => {
      const response = await fetch("/api/documents", {
        headers: authManager.getAuthHeader(),
      });
      if (!response.ok) throw new Error("Failed to fetch documents");
      return response.json();
    },
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async (docData: any) => {
      const response = await apiRequest('POST', '/api/documents', docData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Documento salvo!",
        description: "O documento foi registrado com sucesso.",
      });
      setShowUploadForm(false);
      setFileName("");
      setCategory("");
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar documento",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fileName || !category) {
      toast({
        title: "Dados obrigatórios",
        description: "Preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    uploadDocumentMutation.mutate({
      fileName: fileName,
      fileType: 'pdf',
      fileSize: Math.floor(Math.random() * 1000000) + 100000, // Random size for demo
      category: category,
    });
  };

  const filteredDocuments = documents?.filter((doc: any) =>
    doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'fiscal': 'bg-blue-100 text-blue-600',
      'pessoal': 'bg-green-100 text-green-600',
      'patrimonial': 'bg-purple-100 text-purple-600',
      'outros': 'bg-gray-100 text-gray-600',
    };
    return colors[category] || colors['outros'];
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/" className="p-2 -ml-2 text-gray-600 hover:text-primary">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="font-montserrat text-lg font-semibold text-dark-bg ml-4">
              Documentos
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Actions */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar documentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            onClick={() => setShowUploadForm(true)}
            className="bg-primary hover:bg-primary-dark"
          >
            <FileUp className="h-4 w-4 mr-2" />
            Adicionar Documento
          </Button>
        </div>

        {/* Upload Form */}
        {showUploadForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="font-montserrat text-lg font-semibold text-dark-bg">
                Registrar Novo Documento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <Label htmlFor="fileName" className="text-sm font-medium text-gray-700">
                    Nome do Documento
                  </Label>
                  <Input
                    id="fileName"
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="mt-2"
                    placeholder="Ex: Declaração IR 2024"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                    Categoria
                  </Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fiscal">Fiscal</SelectItem>
                      <SelectItem value="pessoal">Pessoal</SelectItem>
                      <SelectItem value="patrimonial">Patrimonial</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Nota:</strong> Por questões de demonstração, apenas registramos o nome do documento. 
                    Em produção, seria possível fazer upload de arquivos reais.
                  </p>
                </div>
                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={uploadDocumentMutation.isPending}
                    className="bg-primary hover:bg-primary-dark"
                  >
                    {uploadDocumentMutation.isPending ? "Salvando..." : "Salvar Documento"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowUploadForm(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Documents List */}
        <Card>
          <CardHeader>
            <CardTitle className="font-montserrat text-lg font-semibold text-dark-bg">
              Meus Documentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Carregando documentos...</p>
              </div>
            ) : !filteredDocuments || filteredDocuments.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum documento encontrado</p>
                <p className="text-sm text-gray-400 mt-2">
                  Adicione seus documentos importantes para mantê-los organizados
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDocuments.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="border border-gray-200 rounded-xl p-4 hover:border-primary transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <FileText className="h-8 w-8 text-primary" />
                      <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(doc.category)}`}>
                        {doc.category}
                      </span>
                    </div>
                    <h4 className="font-medium text-dark-bg mb-2 line-clamp-2">
                      {doc.fileName}
                    </h4>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(doc.uploadDate).toLocaleDateString('pt-BR')}
                      </div>
                      <div>
                        {(doc.fileSize / 1024).toFixed(0)} KB
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-3 text-primary hover:text-primary-dark"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tips Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="font-montserrat text-lg font-semibold text-dark-bg">
              Dicas de Organização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-primary font-bold">1</span>
                </div>
                <div>
                  <p className="font-medium text-dark-bg">Guarde comprovantes fiscais</p>
                  <p className="text-sm text-gray-600">
                    Mantenha recibos e notas fiscais por pelo menos 5 anos
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-primary font-bold">2</span>
                </div>
                <div>
                  <p className="font-medium text-dark-bg">Organize por categoria</p>
                  <p className="text-sm text-gray-600">
                    Separe documentos pessoais, fiscais e patrimoniais
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-primary font-bold">3</span>
                </div>
                <div>
                  <p className="font-medium text-dark-bg">Faça backups regularmente</p>
                  <p className="text-sm text-gray-600">
                    Mantenha cópias de segurança de documentos importantes
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      
      <BottomNavigation />
    </div>
  );
}