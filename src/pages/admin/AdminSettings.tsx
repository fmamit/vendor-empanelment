import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { useUserRoles } from "@/hooks/useUserRoles";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Building2, 
  FileText,
  Plus,
  Edit,
  Trash2,
  Loader2,
  BarChart3,
  ShieldAlert,
  Database,
} from "lucide-react";
import { DataRequestsPanel } from "@/components/admin/DataRequestsPanel";
import { BreachNotificationPanel } from "@/components/admin/BreachNotificationPanel";

export default function AdminSettings() {
  const { isAdmin } = useUserRoles();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("categories");
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showDocTypeDialog, setShowDocTypeDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingDocType, setEditingDocType] = useState<any>(null);

  const [categoryForm, setCategoryForm] = useState({ name: "", description: "", is_active: true });
  const [docTypeForm, setDocTypeForm] = useState({ name: "", description: "", has_expiry: false, max_file_size_mb: 5 });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => { const { data, error } = await supabase.from("vendor_categories").select("*").order("name"); if (error) throw error; return data; },
  });

  const { data: docTypes, isLoading: docTypesLoading } = useQuery({
    queryKey: ["admin-doc-types"],
    queryFn: async () => { const { data, error } = await supabase.from("document_types").select("*").order("name"); if (error) throw error; return data; },
  });

  const saveCategory = useMutation({
    mutationFn: async () => {
      if (editingCategory) { const { error } = await supabase.from("vendor_categories").update(categoryForm).eq("id", editingCategory.id); if (error) throw error; }
      else { const { error } = await supabase.from("vendor_categories").insert(categoryForm); if (error) throw error; }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-categories"] }); toast.success(editingCategory ? "Category updated" : "Category created"); setShowCategoryDialog(false); setEditingCategory(null); setCategoryForm({ name: "", description: "", is_active: true }); },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("vendor_categories").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-categories"] }); toast.success("Category deleted"); },
    onError: (error: Error) => toast.error(error.message),
  });

  const saveDocType = useMutation({
    mutationFn: async () => {
      if (editingDocType) { const { error } = await supabase.from("document_types").update(docTypeForm).eq("id", editingDocType.id); if (error) throw error; }
      else { const { error } = await supabase.from("document_types").insert(docTypeForm); if (error) throw error; }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-doc-types"] }); toast.success(editingDocType ? "Document type updated" : "Document type created"); setShowDocTypeDialog(false); setEditingDocType(null); setDocTypeForm({ name: "", description: "", has_expiry: false, max_file_size_mb: 5 }); },
    onError: (error: Error) => toast.error(error.message),
  });

  const openEditCategory = (cat: any) => { setEditingCategory(cat); setCategoryForm({ name: cat.name, description: cat.description || "", is_active: cat.is_active }); setShowCategoryDialog(true); };
  const openEditDocType = (doc: any) => { setEditingDocType(doc); setDocTypeForm({ name: doc.name, description: doc.description || "", has_expiry: doc.has_expiry, max_file_size_mb: doc.max_file_size_mb }); setShowDocTypeDialog(true); };

  if (!isAdmin) {
    return (
      <StaffLayout title="Access Denied">
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-muted-foreground">Admin access required</p>
        </div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout title="System Settings">
      <div className="flex-1 flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start px-4 h-auto py-2 bg-card border-b rounded-none">
            <TabsTrigger value="categories" className="flex items-center gap-2"><Building2 className="h-4 w-4" />Categories</TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2"><FileText className="h-4 w-4" />Doc Types</TabsTrigger>
            <TabsTrigger value="data-requests" className="flex items-center gap-2"><Database className="h-4 w-4" />Data Requests</TabsTrigger>
            <TabsTrigger value="breach" className="flex items-center gap-2"><ShieldAlert className="h-4 w-4" />Breach</TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2"><BarChart3 className="h-4 w-4" />Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="flex-1 flex flex-col mt-0">
            <div className="p-4 border-b">
              <Button onClick={() => setShowCategoryDialog(true)}><Plus className="h-4 w-4 mr-2" />Add Category</Button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-3 max-w-2xl">
              {categoriesLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : categories?.map((cat) => (
                <Card key={cat.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold">{cat.name}</p>
                      <p className="text-sm text-muted-foreground">{cat.description}</p>
                      {!cat.is_active && <span className="text-xs text-destructive">Inactive</span>}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditCategory(cat)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteCategory.mutate(cat.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="documents" className="flex-1 flex flex-col mt-0">
            <div className="p-4 border-b">
              <Button onClick={() => setShowDocTypeDialog(true)}><Plus className="h-4 w-4 mr-2" />Add Document Type</Button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-3 max-w-2xl">
              {docTypesLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : docTypes?.map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold">{doc.name}</p>
                      <p className="text-sm text-muted-foreground">{doc.description}</p>
                      <div className="flex gap-2 mt-1">
                        {doc.has_expiry && <span className="text-xs bg-warning/20 text-warning px-2 py-0.5 rounded">Has Expiry</span>}
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">Max {doc.max_file_size_mb}MB</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => openEditDocType(doc)}><Edit className="h-4 w-4" /></Button>
                  </CardContent>
                </Card>
              ))}
            </div>
           </TabsContent>

          <TabsContent value="data-requests" className="flex-1 flex flex-col mt-0">
            <DataRequestsPanel />
          </TabsContent>

          <TabsContent value="breach" className="flex-1 flex flex-col mt-0">
            <BreachNotificationPanel />
          </TabsContent>

          <TabsContent value="reports" className="flex-1 flex flex-col mt-0">
            <div className="p-6 text-center">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 text-primary/50" />
              <p className="text-lg font-semibold mb-2">Reports & Analytics</p>
              <p className="text-muted-foreground mb-4">View vendor status reports, approval timelines, and pending case analysis.</p>
              <Button onClick={() => window.location.href = "/staff/reports"}>Go to Reports</Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={(open) => { setShowCategoryDialog(open); if (!open) { setEditingCategory(null); setCategoryForm({ name: "", description: "", is_active: true }); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label htmlFor="cat-name">Name *</Label><Input id="cat-name" value={categoryForm.name} onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g., Supplier" /></div>
            <div><Label htmlFor="cat-desc">Description</Label><Input id="cat-desc" value={categoryForm.description} onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Brief description" /></div>
            <div className="flex items-center justify-between"><Label htmlFor="cat-active">Active</Label><Switch id="cat-active" checked={categoryForm.is_active} onCheckedChange={(checked) => setCategoryForm(prev => ({ ...prev, is_active: checked }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>Cancel</Button>
            <Button onClick={() => saveCategory.mutate()} disabled={!categoryForm.name || saveCategory.isPending}>{saveCategory.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Type Dialog */}
      <Dialog open={showDocTypeDialog} onOpenChange={(open) => { setShowDocTypeDialog(open); if (!open) { setEditingDocType(null); setDocTypeForm({ name: "", description: "", has_expiry: false, max_file_size_mb: 5 }); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingDocType ? "Edit Document Type" : "Add Document Type"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label htmlFor="doc-name">Name *</Label><Input id="doc-name" value={docTypeForm.name} onChange={(e) => setDocTypeForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g., GST Certificate" /></div>
            <div><Label htmlFor="doc-desc">Description</Label><Input id="doc-desc" value={docTypeForm.description} onChange={(e) => setDocTypeForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Brief description" /></div>
            <div><Label htmlFor="doc-size">Max File Size (MB)</Label><Input id="doc-size" type="number" value={docTypeForm.max_file_size_mb} onChange={(e) => setDocTypeForm(prev => ({ ...prev, max_file_size_mb: parseInt(e.target.value) || 5 }))} min={1} max={20} /></div>
            <div className="flex items-center justify-between"><Label htmlFor="doc-expiry">Has Expiry Date</Label><Switch id="doc-expiry" checked={docTypeForm.has_expiry} onCheckedChange={(checked) => setDocTypeForm(prev => ({ ...prev, has_expiry: checked }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDocTypeDialog(false)}>Cancel</Button>
            <Button onClick={() => saveDocType.mutate()} disabled={!docTypeForm.name || saveDocType.isPending}>{saveDocType.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StaffLayout>
  );
}
