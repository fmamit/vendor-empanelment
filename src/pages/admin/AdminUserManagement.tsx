import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { useUserRoles } from "@/hooks/useUserRoles";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { 
  Plus, 
  Search,
  Shield,
  Loader2,
} from "lucide-react";

interface StaffUser {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  department: string | null;
  is_active: boolean;
  roles: string[];
}

const ROLE_OPTIONS = [
  { value: "maker", label: "Maker", description: "Initial review and verification" },
  { value: "checker", label: "Checker", description: "Second-level verification" },
  { value: "approver", label: "Approver", description: "Final approval authority" },
  { value: "admin", label: "Admin", description: "Full system access" },
];

export default function AdminUserManagement() {
  const { isAdmin } = useUserRoles();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    department: "",
    roles: [] as string[],
  });

  const { data: staffUsers, isLoading } = useQuery({
    queryKey: ["admin-staff-users"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase.from("profiles").select("*").order("full_name");
      if (profilesError) throw profilesError;
      const { data: allRoles, error: rolesError } = await supabase.from("user_roles").select("*");
      if (rolesError) throw rolesError;
      return profiles.map(profile => ({
        ...profile,
        roles: allRoles.filter(r => r.user_id === profile.user_id).map(r => r.role),
      })) as StaffUser[];
    },
    enabled: isAdmin,
  });

  const createUser = useMutation({
    mutationFn: async () => {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");
      const { error: profileError } = await supabase.from("profiles").insert({
        user_id: authData.user.id, full_name: formData.full_name, email: formData.email,
        phone: formData.phone || null, department: formData.department || null,
      });
      if (profileError) throw profileError;
      for (const role of formData.roles) {
        const { error: roleError } = await supabase.from("user_roles").insert({ user_id: authData.user.id, role: role as any });
        if (roleError) throw roleError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-staff-users"] });
      toast.success("Staff user created successfully");
      setShowAddDialog(false);
      resetForm();
    },
    onError: (error: Error) => toast.error(error.message || "Failed to create user"),
  });

  const updateRoles = useMutation({
    mutationFn: async ({ userId, roles }: { userId: string; roles: string[] }) => {
      const { error: deleteError } = await supabase.from("user_roles").delete().eq("user_id", userId);
      if (deleteError) throw deleteError;
      for (const role of roles) {
        const { error: insertError } = await supabase.from("user_roles").insert({ user_id: userId, role: role as any });
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-staff-users"] });
      toast.success("Roles updated successfully");
      setEditingUser(null);
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update roles"),
  });

  const resetForm = () => {
    setFormData({ email: "", password: "", full_name: "", phone: "", department: "", roles: [] });
  };

  const handleRoleToggle = (role: string, checked: boolean) => {
    if (editingUser) {
      const newRoles = checked ? [...editingUser.roles, role] : editingUser.roles.filter(r => r !== role);
      setEditingUser({ ...editingUser, roles: newRoles });
    } else {
      setFormData(prev => ({ ...prev, roles: checked ? [...prev.roles, role] : prev.roles.filter(r => r !== role) }));
    }
  };

  const filteredUsers = staffUsers?.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

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
    <StaffLayout title="User Management">
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b bg-card space-y-3">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Staff User
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3 max-w-2xl">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : filteredUsers?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No staff users found</p>
          ) : (
            filteredUsers?.map((staffUser) => (
              <Card key={staffUser.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold">{staffUser.full_name}</p>
                      <p className="text-sm text-muted-foreground">{staffUser.email}</p>
                      {staffUser.department && <p className="text-xs text-muted-foreground">{staffUser.department}</p>}
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {staffUser.roles.map((role) => (
                          <Badge key={role} variant="secondary" className="text-xs">{role}</Badge>
                        ))}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setEditingUser(staffUser)}>
                      <Shield className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-h-[90vh] overflow-auto">
          <DialogHeader><DialogTitle>Add Staff User</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label htmlFor="full_name">Full Name *</Label><Input id="full_name" value={formData.full_name} onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))} placeholder="Enter full name" /></div>
            <div><Label htmlFor="email">Email *</Label><Input id="email" type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} placeholder="email@capitalindia.com" /></div>
            <div><Label htmlFor="password">Password *</Label><Input id="password" type="password" value={formData.password} onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))} placeholder="Minimum 6 characters" /></div>
            <div><Label htmlFor="phone">Phone</Label><Input id="phone" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} placeholder="Mobile number" /></div>
            <div><Label htmlFor="department">Department</Label><Input id="department" value={formData.department} onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))} placeholder="e.g., Operations, Finance" /></div>
            <div>
              <Label>Roles *</Label>
              <div className="space-y-2 mt-2">
                {ROLE_OPTIONS.map((role) => (
                  <div key={role.value} className="flex items-start gap-3 p-2 rounded-lg border">
                    <Checkbox id={`role-${role.value}`} checked={formData.roles.includes(role.value)} onCheckedChange={(checked) => handleRoleToggle(role.value, !!checked)} />
                    <div className="flex-1"><label htmlFor={`role-${role.value}`} className="font-medium cursor-pointer">{role.label}</label><p className="text-xs text-muted-foreground">{role.description}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>Cancel</Button>
            <Button onClick={() => createUser.mutate()} disabled={!formData.email || !formData.password || !formData.full_name || formData.roles.length === 0 || createUser.isPending}>
              {createUser.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Roles Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Roles - {editingUser?.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {ROLE_OPTIONS.map((role) => (
              <div key={role.value} className="flex items-start gap-3 p-2 rounded-lg border">
                <Checkbox id={`edit-role-${role.value}`} checked={editingUser?.roles.includes(role.value)} onCheckedChange={(checked) => handleRoleToggle(role.value, !!checked)} />
                <div className="flex-1"><label htmlFor={`edit-role-${role.value}`} className="font-medium cursor-pointer">{role.label}</label><p className="text-xs text-muted-foreground">{role.description}</p></div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
            <Button onClick={() => editingUser && updateRoles.mutate({ userId: editingUser.user_id, roles: editingUser.roles })} disabled={updateRoles.isPending}>
              {updateRoles.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Roles"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StaffLayout>
  );
}
