import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface VendorCategory {
  id: string;
  name: string;
  description: string | null;
}

export interface DocumentType {
  id: string;
  name: string;
  description: string | null;
  has_expiry: boolean;
  accepted_formats: string[];
  max_file_size_mb: number;
}

export interface CategoryDocument {
  id: string;
  category_id: string;
  document_type_id: string;
  is_mandatory: boolean;
  display_order: number;
  document_types: DocumentType;
}

export function useVendorCategories() {
  return useQuery({
    queryKey: ["vendor-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_categories")
        .select("*")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data as VendorCategory[];
    },
  });
}

export function useDocumentTypes() {
  return useQuery({
    queryKey: ["document-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_types")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as DocumentType[];
    },
  });
}

export function useCategoryDocuments(categoryId: string | null) {
  return useQuery({
    queryKey: ["category-documents", categoryId],
    queryFn: async () => {
      if (!categoryId) return [];
      
      const { data, error } = await supabase
        .from("category_documents")
        .select(`
          *,
          document_types (*)
        `)
        .eq("category_id", categoryId)
        .order("display_order");
      
      if (error) throw error;
      return data as CategoryDocument[];
    },
    enabled: !!categoryId,
  });
}
