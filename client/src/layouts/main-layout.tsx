import { ReactNode, useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { LanguageToggle } from "@/components/ui/language-toggle";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  
  const handleRoomSelect = (roomId: number) => {
    setSelectedRoomId(roomId);
  };
  
  const handlePatientSelect = (patientId: number) => {
    setSelectedPatientId(patientId);
  };
  
  return (
    <div className="flex h-screen overflow-hidden bg-neutral-100">
      {/* Language Toggle (Fixed Position) */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageToggle />
      </div>
      
      {/* Sidebar */}
      <Sidebar 
        onRoomSelect={handleRoomSelect} 
        onPatientSelect={handlePatientSelect} 
      />
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-neutral-100">
        {children}
      </main>
    </div>
  );
}
