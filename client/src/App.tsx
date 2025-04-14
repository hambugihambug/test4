import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import { useState } from "react";
import FallAlert from "./components/ui/fall-alert";

function App() {
  const [fallAlert, setFallAlert] = useState<{ patientName: string, roomName: string, time: Date } | null>(null);
  
  return (
    <>
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route path="/" component={() => <div>Welcome to Hospital Monitoring System</div>} />
        <Route component={NotFound} />
      </Switch>
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
    </>
  );
}

export default App;
