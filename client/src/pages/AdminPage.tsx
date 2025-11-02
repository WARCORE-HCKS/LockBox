import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Trash2, UserCog, Plus, Edit2, Users, MessageSquare, Shield, ArrowLeft, Ban, UserX, Eraser, BarChart3 } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import UserAvatar from "@/components/UserAvatar";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import type { User, Chatroom } from "@shared/schema";

export default function AdminPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [newChatroomName, setNewChatroomName] = useState("");
  const [newChatroomDescription, setNewChatroomDescription] = useState("");
  const [editingChatroom, setEditingChatroom] = useState<Chatroom | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [selectedChatroomForStats, setSelectedChatroomForStats] = useState<string | null>(null);

  // Track online users
  useSocket({
    userId: user?.id,
    onUserStatus: (data) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        if (data.status === "online") {
          newSet.add(data.userId);
        } else {
          newSet.delete(data.userId);
        }
        return newSet;
      });
    },
  });

  // Fetch all users
  const { data: users = [], isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  // Fetch all chatrooms
  const { data: chatrooms = [], isLoading: loadingChatrooms } = useQuery<Chatroom[]>({
    queryKey: ["/api/admin/chatrooms"],
  });

  // Fetch chatroom statistics
  const { data: chatroomStats, isLoading: loadingStats } = useQuery<{
    totalMessages: number;
    activeUsers: number;
    uniquePosters: number;
  }>({
    queryKey: ["/api/admin/chatrooms", selectedChatroomForStats, "stats"],
    queryFn: async () => {
      const response = await fetch(`/api/admin/chatrooms/${selectedChatroomForStats}/stats`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }
      return response.json();
    },
    enabled: !!selectedChatroomForStats && statsDialogOpen,
  });

  // Update user admin status mutation
  const updateAdminStatus = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
      return await apiRequest("PATCH", `/api/admin/users/${userId}/admin`, { isAdmin });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User admin status updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  // Create chatroom mutation
  const createChatroom = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      return await apiRequest("POST", "/api/admin/chatrooms", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chatrooms"] });
      setNewChatroomName("");
      setNewChatroomDescription("");
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Chatroom created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create chatroom",
        variant: "destructive",
      });
    },
  });

  // Update chatroom mutation
  const updateChatroom = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; description?: string }) => {
      return await apiRequest("PATCH", `/api/admin/chatrooms/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chatrooms"] });
      setEditingChatroom(null);
      setIsEditDialogOpen(false);
      toast({
        title: "Success",
        description: "Chatroom updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update chatroom",
        variant: "destructive",
      });
    },
  });

  // Ban user mutation
  const banUser = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("POST", `/api/admin/users/${userId}/ban`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User banned successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to ban user",
        variant: "destructive",
      });
    },
  });

  // Unban user mutation
  const unbanUser = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("DELETE", `/api/admin/users/${userId}/ban`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User unbanned successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to unban user",
        variant: "destructive",
      });
    },
  });

  // Clear chatroom history mutation
  const clearChatroomHistory = useMutation({
    mutationFn: async (chatroomId: string) => {
      return await apiRequest("DELETE", `/api/admin/chatrooms/${chatroomId}/messages`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Chatroom history cleared",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to clear chatroom history",
        variant: "destructive",
      });
    },
  });

  // Delete chatroom mutation
  const deleteChatroom = useMutation({
    mutationFn: async (chatroomId: string) => {
      return await apiRequest("DELETE", `/api/admin/chatrooms/${chatroomId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chatrooms"] });
      toast({
        title: "Success",
        description: "Chatroom deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete chatroom",
        variant: "destructive",
      });
    },
  });

  const getUserDisplayName = (user: User) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    return user.email || "Unknown User";
  };

  const isUserOnline = (userId: string) => {
    return onlineUsers.has(userId);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/")}
              data-testid="button-back-to-chat"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Admin Panel</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="users" data-testid="tab-users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="chatrooms" data-testid="tab-chatrooms">
              <MessageSquare className="h-4 w-4 mr-2" />
              Chatrooms
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage user accounts, admin permissions, and monitor online status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <div className="text-center py-8">Loading users...</div>
                ) : (
                  <div className="space-y-3">
                    {users.map((user) => (
                      <Card key={user.id} className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1">
                            <UserAvatar
                              name={getUserDisplayName(user)}
                              src={user.profileImageUrl || undefined}
                              size="md"
                              status={isUserOnline(user.id) ? "online" : "offline"}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium truncate" data-testid={`text-username-${user.id}`}>
                                  {getUserDisplayName(user)}
                                </p>
                                {user.isAdmin && (
                                  <Badge variant="default" data-testid={`badge-admin-${user.id}`}>
                                    Admin
                                  </Badge>
                                )}
                                {user.isBanned && (
                                  <Badge variant="destructive" data-testid={`badge-banned-${user.id}`}>
                                    Banned
                                  </Badge>
                                )}
                                <Badge 
                                  variant={isUserOnline(user.id) ? "default" : "secondary"}
                                  data-testid={`badge-status-${user.id}`}
                                >
                                  {isUserOnline(user.id) ? "Online" : "Offline"}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground truncate" data-testid={`text-email-${user.id}`}>
                                {user.email}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant={user.isAdmin ? "default" : "outline"}
                              size="sm"
                              onClick={() => updateAdminStatus.mutate({ userId: user.id, isAdmin: !user.isAdmin })}
                              disabled={updateAdminStatus.isPending}
                              data-testid={`button-toggle-admin-${user.id}`}
                            >
                              <UserCog className="h-4 w-4 mr-2" />
                              {user.isAdmin ? "Remove Admin" : "Make Admin"}
                            </Button>

                            <Button
                              variant={user.isBanned ? "outline" : "destructive"}
                              size="sm"
                              onClick={() => user.isBanned ? unbanUser.mutate(user.id) : banUser.mutate(user.id)}
                              disabled={banUser.isPending || unbanUser.isPending}
                              data-testid={`button-toggle-ban-${user.id}`}
                            >
                              {user.isBanned ? <UserX className="h-4 w-4 mr-2" /> : <Ban className="h-4 w-4 mr-2" />}
                              {user.isBanned ? "Unban" : "Ban"}
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={deleteUser.isPending}
                                  data-testid={`button-delete-user-${user.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this user? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteUser.mutate(user.id)}
                                    data-testid="button-confirm-delete"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chatrooms" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                <div>
                  <CardTitle>Chatroom Management</CardTitle>
                  <CardDescription>
                    Create, edit, and manage chatrooms
                  </CardDescription>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-create-chatroom">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Chatroom
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Chatroom</DialogTitle>
                      <DialogDescription>
                        Add a new chatroom for users to join
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Chatroom Name</Label>
                        <Input
                          id="name"
                          value={newChatroomName}
                          onChange={(e) => setNewChatroomName(e.target.value)}
                          placeholder="Enter chatroom name"
                          data-testid="input-chatroom-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newChatroomDescription}
                          onChange={(e) => setNewChatroomDescription(e.target.value)}
                          placeholder="Enter chatroom description (optional)"
                          data-testid="input-chatroom-description"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={() => createChatroom.mutate({ name: newChatroomName, description: newChatroomDescription })}
                        disabled={!newChatroomName || createChatroom.isPending}
                        data-testid="button-submit-create"
                      >
                        Create
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingChatrooms ? (
                  <div className="text-center py-8">Loading chatrooms...</div>
                ) : (
                  <div className="space-y-3">
                    {chatrooms.map((chatroom) => (
                      <Card key={chatroom.id} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate" data-testid={`text-chatroom-name-${chatroom.id}`}>
                              {chatroom.name}
                            </h3>
                            {chatroom.description && (
                              <p className="text-sm text-muted-foreground" data-testid={`text-chatroom-description-${chatroom.id}`}>
                                {chatroom.description}
                              </p>
                            )}
                            {chatroom.id === 'default-general' && (
                              <Badge variant="secondary" className="mt-2">Default</Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedChatroomForStats(chatroom.id);
                                setStatsDialogOpen(true);
                              }}
                              data-testid={`button-stats-${chatroom.id}`}
                            >
                              <BarChart3 className="h-4 w-4" />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  data-testid={`button-clear-history-${chatroom.id}`}
                                >
                                  <Eraser className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Clear Chatroom History</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to clear all messages in this chatroom? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => clearChatroomHistory.mutate(chatroom.id)}
                                    data-testid="button-confirm-clear-history"
                                  >
                                    Clear History
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>

                            <Dialog open={isEditDialogOpen && editingChatroom?.id === chatroom.id} onOpenChange={(open) => {
                              setIsEditDialogOpen(open);
                              if (!open) setEditingChatroom(null);
                            }}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingChatroom(chatroom)}
                                  data-testid={`button-edit-chatroom-${chatroom.id}`}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Chatroom</DialogTitle>
                                  <DialogDescription>
                                    Update chatroom details
                                  </DialogDescription>
                                </DialogHeader>
                                {editingChatroom && (
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-name">Chatroom Name</Label>
                                      <Input
                                        id="edit-name"
                                        value={editingChatroom.name}
                                        onChange={(e) => setEditingChatroom({ ...editingChatroom, name: e.target.value })}
                                        data-testid="input-edit-name"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-description">Description</Label>
                                      <Textarea
                                        id="edit-description"
                                        value={editingChatroom.description || ""}
                                        onChange={(e) => setEditingChatroom({ ...editingChatroom, description: e.target.value })}
                                        data-testid="input-edit-description"
                                      />
                                    </div>
                                  </div>
                                )}
                                <DialogFooter>
                                  <Button
                                    onClick={() => editingChatroom && updateChatroom.mutate({ 
                                      id: editingChatroom.id, 
                                      name: editingChatroom.name, 
                                      description: editingChatroom.description || undefined 
                                    })}
                                    disabled={updateChatroom.isPending}
                                    data-testid="button-submit-edit"
                                  >
                                    Save Changes
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            {chatroom.id !== 'default-general' && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    disabled={deleteChatroom.isPending}
                                    data-testid={`button-delete-chatroom-${chatroom.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Chatroom</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this chatroom? All messages in this chatroom will also be deleted. This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel data-testid="button-cancel-delete-chatroom">Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteChatroom.mutate(chatroom.id)}
                                      data-testid="button-confirm-delete-chatroom"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Statistics Dialog */}
      <Dialog open={statsDialogOpen} onOpenChange={setStatsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chatroom Statistics</DialogTitle>
            <DialogDescription>
              View statistics for this chatroom
            </DialogDescription>
          </DialogHeader>
          {loadingStats ? (
            <div className="text-center py-8">Loading statistics...</div>
          ) : chatroomStats ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground">Total Messages</p>
                  <p className="text-2xl font-bold" data-testid="stat-total-messages">{chatroomStats.totalMessages}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground">Unique Posters</p>
                  <p className="text-2xl font-bold" data-testid="stat-unique-posters">{chatroomStats.uniquePosters}</p>
                </Card>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
