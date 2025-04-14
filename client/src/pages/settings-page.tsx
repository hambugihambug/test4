import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useI18n } from "@/contexts/I18nContext";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, UserRole } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Account settings schema
const accountSettingsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters").optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Notification settings schema
const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  smsNotifications: z.boolean(),
});

export default function SettingsPage() {
  const { t, language, setLanguage } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("account");
  
  // Account settings form
  const accountForm = useForm<z.infer<typeof accountSettingsSchema>>({
    resolver: zodResolver(accountSettingsSchema),
    defaultValues: {
      name: user?.name || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // Notification settings form
  const notificationForm = useForm<z.infer<typeof notificationSettingsSchema>>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
    },
  });
  
  // Update account mutation
  const accountMutation = useMutation({
    mutationFn: async (data: z.infer<typeof accountSettingsSchema>) => {
      const res = await apiRequest("PUT", `/api/users/${user?.id}`, {
        name: data.name,
        currentPassword: data.currentPassword,
        newPassword: data.newPassword || undefined,
      });
      return await res.json();
    },
    onSuccess: (updatedUser: User) => {
      queryClient.setQueryData(["/api/user"], updatedUser);
      toast({
        title: "Account updated",
        description: "Your account information has been updated successfully.",
      });
      accountForm.reset({
        name: updatedUser.name,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update notification settings mutation
  const notificationMutation = useMutation({
    mutationFn: async (data: z.infer<typeof notificationSettingsSchema>) => {
      const res = await apiRequest("PUT", `/api/users/${user?.id}/notifications`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Notification settings updated",
        description: "Your notification preferences have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle account form submission
  const onSubmitAccount = (data: z.infer<typeof accountSettingsSchema>) => {
    accountMutation.mutate(data);
  };
  
  // Handle notification form submission
  const onSubmitNotifications = (data: z.infer<typeof notificationSettingsSchema>) => {
    notificationMutation.mutate(data);
  };
  
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-800">{t('settings.title')}</h1>
        <p className="text-neutral-500">{t('settings.subtitle')}</p>
      </div>
      
      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="account">{t('settings.accountSettings')}</TabsTrigger>
          <TabsTrigger value="system">{t('settings.systemSettings')}</TabsTrigger>
          <TabsTrigger value="notifications">{t('settings.notificationSettings')}</TabsTrigger>
        </TabsList>
        
        {/* Account Settings */}
        <TabsContent value="account" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.accountSettings')}</CardTitle>
              <CardDescription>
                Update your personal information and password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...accountForm}>
                <form onSubmit={accountForm.handleSubmit(onSubmitAccount)} className="space-y-6">
                  <FormField
                    control={accountForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('common.name')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t('common.password')}</h3>
                    
                    <FormField
                      control={accountForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={accountForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormDescription>
                            Leave blank if you don't want to change your password
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={accountForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button type="submit" disabled={accountMutation.isPending}>
                    {accountMutation.isPending ? "Saving..." : t('settings.saveSettings')}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* System Settings */}
        <TabsContent value="system" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.systemSettings')}</CardTitle>
              <CardDescription>
                Configure system-wide settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">{t('settings.language')}</h3>
                <div className="flex space-x-2">
                  <Button 
                    variant={language === 'ko' ? 'default' : 'outline'} 
                    className="w-24"
                    onClick={() => setLanguage('ko')}
                  >
                    한국어
                  </Button>
                  <Button 
                    variant={language === 'en' ? 'default' : 'outline'} 
                    className="w-24"
                    onClick={() => setLanguage('en')}
                  >
                    English
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              {/* Other system settings (only visible to admin) */}
              {user?.role === UserRole.ADMIN && (
                <>
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t('settings.fallThreshold')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="sensitivity">Detection Sensitivity</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Low</span>
                          <Input
                            id="sensitivity"
                            type="range"
                            min="1"
                            max="10"
                            defaultValue="5"
                            className="w-full"
                          />
                          <span className="text-sm">High</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="minDuration">Minimum Duration (seconds)</Label>
                        <Input
                          id="minDuration"
                          type="number"
                          min="1"
                          max="60"
                          defaultValue="3"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t('settings.temperatureThreshold')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="minTemp">Minimum (°C)</Label>
                        <Input
                          id="minTemp"
                          type="number"
                          min="10"
                          max="30"
                          step="0.5"
                          defaultValue="18"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="maxTemp">Maximum (°C)</Label>
                        <Input
                          id="maxTemp"
                          type="number"
                          min="20"
                          max="40"
                          step="0.5"
                          defaultValue="26"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t('settings.humidityThreshold')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="minHumidity">Minimum (%)</Label>
                        <Input
                          id="minHumidity"
                          type="number"
                          min="20"
                          max="60"
                          defaultValue="30"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="maxHumidity">Maximum (%)</Label>
                        <Input
                          id="maxHumidity"
                          type="number"
                          min="40"
                          max="90"
                          defaultValue="60"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              <Button>{t('settings.saveSettings')}</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Notification Settings */}
        <TabsContent value="notifications" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.notificationSettings')}</CardTitle>
              <CardDescription>
                Configure how you want to receive alerts and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationForm}>
                <form onSubmit={notificationForm.handleSubmit(onSubmitNotifications)} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t('settings.notifications')}</h3>
                    
                    <FormField
                      control={notificationForm.control}
                      name="emailNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              {t('settings.emailNotifications')}
                            </FormLabel>
                            <FormDescription>
                              Receive notifications via email
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={notificationForm.control}
                      name="pushNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              {t('settings.pushNotifications')}
                            </FormLabel>
                            <FormDescription>
                              Receive push notifications on your device
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={notificationForm.control}
                      name="smsNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              {t('settings.smsNotifications')}
                            </FormLabel>
                            <FormDescription>
                              Receive notifications via SMS
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button type="submit" disabled={notificationMutation.isPending}>
                    {notificationMutation.isPending ? "Saving..." : t('settings.saveSettings')}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
