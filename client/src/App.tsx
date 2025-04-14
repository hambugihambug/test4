import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import CCTVPage from "@/pages/cctv-page";
import UserManagementPage from "@/pages/user-management-page";
import RoomManagementPage from "@/pages/room-management-page";
import ReportsPage from "@/pages/reports-page";
import SettingsPage from "@/pages/settings-page";
import { ProtectedRoute } from "./lib/protected-route";
import { MainLayout } from "./layouts/main-layout";
import { useAuth } from "./hooks/use-auth";
import { useEffect, useState } from "react";
import FallAlert from "./components/ui/fall-alert";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={() => <MainLayout><DashboardPage /></MainLayout>} />
      <ProtectedRoute path="/cctv" component={() => <MainLayout><CCTVPage /></MainLayout>} />
      <ProtectedRoute path="/rooms" component={() => <MainLayout><RoomManagementPage /></MainLayout>} />
      <ProtectedRoute path="/users" component={() => <MainLayout><UserManagementPage /></MainLayout>} />
      <ProtectedRoute path="/reports" component={() => <MainLayout><ReportsPage /></MainLayout>} />
      <ProtectedRoute path="/settings" component={() => <MainLayout><SettingsPage /></MainLayout>} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { user } = useAuth();
  const [fallAlert, setFallAlert] = useState<{ patientName: string, roomName: string, time: Date } | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  
  // Setup WebSocket connection
  useEffect(() => {
    if (!user) return;
    
    // Create WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log("WebSocket connection established");
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ACCIDENT') {
          // This would need to fetch patient and room info from the server
          // For simplicity, showing with mock data
          setFallAlert({
            patientName: "환자",
            roomName: "102호",
            time: new Date()
          });
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };
    
    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };
    
    setSocket(socket);
    
    return () => {
      ws.close();
    };
  }, [user]);
  
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
      {fallAlert && (
        <FallAlert 
          patientName={fallAlert.patientName}
          roomName={fallAlert.roomName} 
          time={fallAlert.time}
          onClose={() => setFallAlert(null)}
          onAction={() => {
            // Handle alert action
            setFallAlert(null);
          }}
        />
      )}
    </QueryClientProvider>
  );
}

export default App;
