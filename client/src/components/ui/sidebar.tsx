import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Home, Tv, Building2, Users, BarChart2, Settings, LogOut } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";
import { useAuth } from "@/hooks/use-auth";
import { Room, Patient } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

interface SidebarProps {
  onRoomSelect?: (roomId: number) => void;
  onPatientSelect?: (patientId: number) => void;
}

export function Sidebar({ onRoomSelect, onPatientSelect }: SidebarProps) {
  const [location] = useLocation();
  const { t } = useI18n();
  const { user, logoutMutation } = useAuth();
  const [expandedRoom, setExpandedRoom] = useState<number | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  
  const { data: roomsWithPatients, isLoading } = useQuery<(Room & { patients: Patient[] })[]>({
    queryKey: ['/api/rooms/with-patients'],
    enabled: !!user,
  });
  
  const handlePatientClick = (patientId: number) => {
    setSelectedPatient(patientId);
    if (onPatientSelect) {
      onPatientSelect(patientId);
    }
  };
  
  const handleRoomClick = (roomId: number) => {
    setExpandedRoom(expandedRoom === roomId ? null : roomId);
    if (onRoomSelect) {
      onRoomSelect(roomId);
    }
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'alert':
        return (
          <span className="text-xs bg-red-100 text-red-800 py-0.5 px-1.5 rounded-full">
            {t('common.fallDetected')}
          </span>
        );
      case 'warning':
        return (
          <span className="text-xs bg-yellow-100 text-yellow-800 py-0.5 px-1.5 rounded-full">
            {t('common.temperatureHigh')}
          </span>
        );
      default:
        return (
          <span className="text-xs bg-green-100 text-green-800 py-0.5 px-1.5 rounded-full">
            {t('common.normal')}
          </span>
        );
    }
  };
  
  return (
    <aside className="w-60 bg-white border-r border-neutral-200 flex flex-col h-screen shadow-sm z-30">
      {/* Logo Area */}
      <div className="p-4 border-b border-neutral-200">
        <Link href="/">
          <a className="flex items-center cursor-pointer">
            <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h1 className="ml-2 text-lg font-bold text-neutral-800">스마트 케어</h1>
          </a>
        </Link>
      </div>

      {/* User Profile Area */}
      {user && (
        <div className="p-4 border-b border-neutral-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-medium text-neutral-800">{user.name}</h2>
              <p className="text-xs text-neutral-500">{t(`common.${user.role}`)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto">
        <ul className="py-2">
          <li>
            <Link href="/">
              <a className={`flex items-center px-4 py-2 ${location === '/' ? 'bg-blue-50 text-primary border-l-4 border-primary' : 'hover:bg-blue-50 text-neutral-700 hover:text-primary'}`}>
                <Home className="h-5 w-5 mr-3" />
                {t('common.dashboard')}
              </a>
            </Link>
          </li>
          <li>
            <Link href="/cctv">
              <a className={`flex items-center px-4 py-2 ${location === '/cctv' ? 'bg-blue-50 text-primary border-l-4 border-primary' : 'hover:bg-blue-50 text-neutral-700 hover:text-primary'}`}>
                <Tv className="h-5 w-5 mr-3" />
                {t('common.cctvMonitoring')}
              </a>
            </Link>
          </li>
          <li>
            <Link href="/rooms">
              <a className={`flex items-center px-4 py-2 ${location === '/rooms' ? 'bg-blue-50 text-primary border-l-4 border-primary' : 'hover:bg-blue-50 text-neutral-700 hover:text-primary'}`}>
                <Building2 className="h-5 w-5 mr-3" />
                {t('common.roomManagement')}
              </a>
            </Link>
          </li>
          <li>
            <Link href="/users">
              <a className={`flex items-center px-4 py-2 ${location === '/users' ? 'bg-blue-50 text-primary border-l-4 border-primary' : 'hover:bg-blue-50 text-neutral-700 hover:text-primary'}`}>
                <Users className="h-5 w-5 mr-3" />
                {t('common.userManagement')}
              </a>
            </Link>
          </li>
          <li>
            <Link href="/reports">
              <a className={`flex items-center px-4 py-2 ${location === '/reports' ? 'bg-blue-50 text-primary border-l-4 border-primary' : 'hover:bg-blue-50 text-neutral-700 hover:text-primary'}`}>
                <BarChart2 className="h-5 w-5 mr-3" />
                {t('common.statistics')}
              </a>
            </Link>
          </li>
          <li>
            <Link href="/settings">
              <a className={`flex items-center px-4 py-2 ${location === '/settings' ? 'bg-blue-50 text-primary border-l-4 border-primary' : 'hover:bg-blue-50 text-neutral-700 hover:text-primary'}`}>
                <Settings className="h-5 w-5 mr-3" />
                {t('common.settings')}
              </a>
            </Link>
          </li>
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-neutral-200">
        <button 
          className="flex items-center text-sm text-neutral-600 hover:text-primary"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-2" />
          {t('common.logout')}
        </button>
      </div>
    </aside>
  );
}
