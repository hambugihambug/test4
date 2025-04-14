import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useI18n } from "@/contexts/I18nContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, UserRole, Patient, Guardian, Room, insertUserSchema } from "@shared/schema";
import { Plus, Search, UserCheck, UserX, Edit, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";

// Registration schema with custom validation
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
  role: z.enum([UserRole.ADMIN, UserRole.NURSE, UserRole.PATIENT, UserRole.GUARDIAN]),
});

export default function UserManagementPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<UserRole | "all">("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  
  // Registration form
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      role: UserRole.PATIENT,
    },
  });
  
  // Fetch all users
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });
  
  // Fetch rooms for patient assignment
  const { data: rooms } = useQuery<Room[]>({
    queryKey: ['/api/rooms'],
  });
  
  // Filtered users based on search and role filter
  const filteredUsers = users?.filter(user => {
    // Filter by search query
    const matchesSearch = searchQuery 
      ? user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    
    // Filter by selected role tab
    const matchesRole = selectedTab === "all" || user.role === selectedTab;
    
    return matchesSearch && matchesRole;
  });
  
  // Handle form submission for adding a new user
  const onSubmitUser = async (values: z.infer<typeof registerSchema>) => {
    try {
      await apiRequest("POST", "/api/register", values);
      
      // Refresh users list
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      
      // Reset state
      setIsAddingUser(false);
      form.reset();
    } catch (error) {
      console.error("Failed to add user:", error);
    }
  };
  
  // Handle user deletion
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      await apiRequest("DELETE", `/api/users/${selectedUser.id}`);
      
      // Refresh users list
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      
      // Reset state
      setSelectedUser(null);
      setIsConfirmingDelete(false);
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };
  
  // Format user role for display
  const formatUserRole = (role: UserRole) => {
    return t(`common.${role}`);
  };
  
  // Check if the current user can manage the specified role
  const canManageRole = (role: UserRole) => {
    if (user?.role === UserRole.ADMIN) return true;
    if (user?.role === UserRole.NURSE) {
      return role === UserRole.PATIENT || role === UserRole.GUARDIAN;
    }
    return false;
  };
  
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">{t('users.title')}</h1>
          <p className="text-neutral-500">{t('users.subtitle')}</p>
        </div>
        <Button onClick={() => setIsAddingUser(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          {t('users.addUser')}
        </Button>
      </div>
      
      {/* Search and Filter */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-neutral-400" />
          </div>
          <Input
            type="text"
            placeholder={t('users.searchPlaceholder')}
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Tabs 
          value={selectedTab} 
          onValueChange={(value) => setSelectedTab(value as UserRole | "all")} 
          className="w-full md:w-auto"
        >
          <TabsList className="grid grid-cols-5 w-full md:w-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value={UserRole.ADMIN}>{t('common.admin')}</TabsTrigger>
            <TabsTrigger value={UserRole.NURSE}>{t('common.nurse')}</TabsTrigger>
            <TabsTrigger value={UserRole.PATIENT}>{t('common.patient')}</TabsTrigger>
            <TabsTrigger value={UserRole.GUARDIAN}>{t('common.guardian')}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {usersLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : filteredUsers && filteredUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('common.name')}</TableHead>
                  <TableHead>{t('common.username')}</TableHead>
                  <TableHead>{t('users.role')}</TableHead>
                  <TableHead className="text-right">{t('users.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-800' :
                        user.role === UserRole.NURSE ? 'bg-blue-100 text-blue-800' :
                        user.role === UserRole.PATIENT ? 'bg-green-100 text-green-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {formatUserRole(user.role)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            // Handle edit user (would set a state and open a dialog)
                            console.log('Edit user:', user);
                          }}
                        >
                          <Edit className="h-3.5 w-3.5 mr-1" />
                          {t('users.editUser')}
                        </Button>
                        
                        {canManageRole(user.role) && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsConfirmingDelete(true);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            {t('users.deleteUser')}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center p-8">
              <p className="text-neutral-500">No users found</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Add User Dialog */}
      <Dialog open={isAddingUser} onOpenChange={setIsAddingUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('users.addUser')}</DialogTitle>
            <DialogDescription>
              Add a new user to the system
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitUser)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common.username')}</FormLabel>
                    <FormControl>
                      <Input placeholder="username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common.password')}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common.name')}</FormLabel>
                    <FormControl>
                      <Input placeholder="Full Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common.role')}</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={(value) => field.onChange(value as UserRole)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {user?.role === UserRole.ADMIN && (
                          <>
                            <SelectItem value={UserRole.ADMIN}>{t('common.admin')}</SelectItem>
                            <SelectItem value={UserRole.NURSE}>{t('common.nurse')}</SelectItem>
                          </>
                        )}
                        <SelectItem value={UserRole.PATIENT}>{t('common.patient')}</SelectItem>
                        <SelectItem value={UserRole.GUARDIAN}>{t('common.guardian')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddingUser(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit">{t('common.save')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Confirm Delete Dialog */}
      <Dialog open={isConfirmingDelete} onOpenChange={setIsConfirmingDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('users.deleteUser')}</DialogTitle>
            <DialogDescription>
              {t('users.confirmDelete')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-between items-center p-4 border rounded-md bg-neutral-50">
            <div>
              <p className="font-medium">{selectedUser?.name}</p>
              <p className="text-sm text-neutral-500">{formatUserRole(selectedUser?.role as UserRole)}</p>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs ${
              selectedUser?.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-800' :
              selectedUser?.role === UserRole.NURSE ? 'bg-blue-100 text-blue-800' :
              selectedUser?.role === UserRole.PATIENT ? 'bg-green-100 text-green-800' :
              'bg-orange-100 text-orange-800'
            }`}>
              {selectedUser?.username}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmingDelete(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteUser}
            >
              {t('users.deleteUser')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
