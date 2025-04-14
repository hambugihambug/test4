import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Users, Building2, AlertTriangle, AlertCircle, 
  Download, UserPlus
} from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";
import { StatCard } from "@/components/ui/stat-card";
import { RoomLayout } from "@/components/ui/room-layout";
import { PatientDetails } from "@/components/ui/patient-details";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Room, Patient, Accident, EnvLog, PatientWithDetails } from "@shared/schema";
import Chart from 'chart.js/auto';

interface DashboardStats {
  totalRooms: number;
  totalPatients: number;
  todayAccidents: number;
  environmentalAlerts: number;
  fallRiskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  recentEvents: Accident[];
}

export default function DashboardPage() {
  const { t } = useI18n();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<PatientWithDetails | null>(null);
  const [fallIncidentsChart, setFallIncidentsChart] = useState<Chart | null>(null);
  const [environmentChart, setEnvironmentChart] = useState<Chart | null>(null);
  const [fallRiskChart, setFallRiskChart] = useState<Chart | null>(null);
  const [recentAccidents, setRecentAccidents] = useState<Accident[]>([]);
  
  // Fetch dashboard statistics
  const { data: dashboardStats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/stats/dashboard'],
  });
  
  // Fetch rooms
  const { data: rooms } = useQuery<Room[]>({
    queryKey: ['/api/rooms'],
  });
  
  // Fetch weekly fall incidents
  const { data: fallIncidentsData } = useQuery<{ labels: string[], data: number[] }>({
    queryKey: ['/api/stats/fall-incidents'],
  });
  
  // Fetch selected room's environment logs
  const { data: envLogs } = useQuery<EnvLog[]>({
    queryKey: ['/api/rooms', selectedRoom?.id, 'env-logs'],
    enabled: !!selectedRoom,
  });
  
  // Set initial selected room
  useEffect(() => {
    if (!selectedRoom && rooms && rooms.length > 0) {
      setSelectedRoom(rooms[0]);
    }
  }, [rooms, selectedRoom]);
  
  // Initialize charts
  useEffect(() => {
    // Initialize fall incidents chart
    if (fallIncidentsData && !fallIncidentsChart) {
      const ctx = document.getElementById('fallIncidentsChart') as HTMLCanvasElement;
      if (ctx) {
        const chart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: fallIncidentsData.labels,
            datasets: [{
              label: t('dashboard.fallIncidentsChart'),
              data: fallIncidentsData.data,
              backgroundColor: 'rgba(239, 68, 68, 0.6)',
              borderColor: 'rgba(239, 68, 68, 1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  stepSize: 1
                }
              }
            }
          }
        });
        setFallIncidentsChart(chart);
      }
    }
    
    // Update fall risk distribution chart
    if (dashboardStats && !fallRiskChart) {
      const ctx = document.getElementById('fallRiskChart') as HTMLCanvasElement;
      if (ctx) {
        const chart = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: [
              t('dashboard.lowRisk'), 
              t('dashboard.mediumRisk'), 
              t('dashboard.highRisk')
            ],
            datasets: [{
              data: [
                dashboardStats.fallRiskDistribution.low, 
                dashboardStats.fallRiskDistribution.medium, 
                dashboardStats.fallRiskDistribution.high
              ],
              backgroundColor: [
                'rgba(34, 197, 94, 0.8)',
                'rgba(234, 179, 8, 0.8)',
                'rgba(239, 68, 68, 0.8)'
              ],
              borderColor: [
                'rgba(34, 197, 94, 1)',
                'rgba(234, 179, 8, 1)',
                'rgba(239, 68, 68, 1)'
              ],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom'
              }
            }
          }
        });
        setFallRiskChart(chart);
      }
    }
    
    // Update environment monitoring chart
    if (envLogs && envLogs.length > 0 && selectedRoom) {
      // Cleanup previous chart
      if (environmentChart) {
        environmentChart.destroy();
      }
      
      const ctx = document.getElementById('environmentChart') as HTMLCanvasElement;
      if (ctx) {
        // Get last 8 environment logs for the chart
        const recentLogs = [...envLogs].slice(-8);
        
        const chart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: recentLogs.map(log => {
              const date = new Date(log.timestamp);
              return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }),
            datasets: [
              {
                label: `${t('rooms.temperature')} (°C)`,
                data: recentLogs.map(log => log.temperature),
                borderColor: 'rgba(234, 179, 8, 0.8)',
                backgroundColor: 'rgba(234, 179, 8, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
              },
              {
                label: `${t('rooms.humidity')} (%)`,
                data: recentLogs.map(log => log.humidity),
                borderColor: 'rgba(37, 99, 235, 0.8)',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false
          }
        });
        
        setEnvironmentChart(chart);
      }
    }
    
    // Set recent accidents from dashboard stats
    if (dashboardStats && dashboardStats.recentEvents) {
      setRecentAccidents(dashboardStats.recentEvents);
    }
    
    // Cleanup charts when component unmounts
    return () => {
      if (fallIncidentsChart) fallIncidentsChart.destroy();
      if (environmentChart) environmentChart.destroy();
      if (fallRiskChart) fallRiskChart.destroy();
    };
  }, [dashboardStats, fallIncidentsData, envLogs, selectedRoom, t]);
  
  const handleRoomChange = (roomId: string) => {
    const room = rooms?.find(r => r.id === parseInt(roomId));
    if (room) {
      setSelectedRoom(room);
    }
  };
  
  const formatEventTime = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} ${t('minutes ago')}`;
    } else if (diffMins < 24 * 60) {
      const hours = Math.floor(diffMins / 60);
      return `${hours} ${t('hours ago')}`;
    } else {
      const days = Math.floor(diffMins / (24 * 60));
      return `${days} ${t('days ago')}`;
    }
  };
  
  const getEventTypeIcon = (accident: Accident) => {
    if (!accident.resolved) {
      return (
        <div className="p-1.5 bg-red-100 rounded-full text-red-600 mt-0.5">
          <AlertTriangle className="h-4 w-4" />
        </div>
      );
    } else {
      return (
        <div className="p-1.5 bg-green-100 rounded-full text-green-600 mt-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    }
  };
  
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">{t('dashboard.title')}</h1>
          <p className="text-neutral-500">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="flex items-center">
            <Download className="h-4 w-4 mr-1.5" />
            {t('common.downloadReport')}
          </Button>
          <Button className="flex items-center">
            <UserPlus className="h-4 w-4 mr-1.5" />
            {t('common.registerNewPatient')}
          </Button>
        </div>
      </div>

      {/* Quick Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title={t('dashboard.totalPatients')}
          value={dashboardStats?.totalPatients || 0}
          icon={<Users className="h-5 w-5" />}
          iconBgColor="bg-blue-100"
          iconColor="text-primary"
          change={{
            value: "4%",
            type: "increase"
          }}
        />
        
        <StatCard
          title={t('dashboard.totalRooms')}
          value={dashboardStats?.totalRooms || 0}
          icon={<Building2 className="h-5 w-5" />}
          iconBgColor="bg-indigo-100"
          iconColor="text-indigo-600"
          subtitle={`${t('dashboard.occupancyRate')} 92%`}
        />
        
        <StatCard
          title={t('dashboard.todayFallsTitle')}
          value={dashboardStats?.todayAccidents || 0}
          icon={<AlertTriangle className="h-5 w-5" />}
          iconBgColor="bg-red-100"
          iconColor="text-red-600"
          change={{
            value: "2건",
            type: "increase"
          }}
        />
        
        <StatCard
          title={t('dashboard.environmentalAlerts')}
          value={dashboardStats?.environmentalAlerts || 0}
          icon={<AlertCircle className="h-5 w-5" />}
          iconBgColor="bg-yellow-100"
          iconColor="text-yellow-600"
          subtitle={t('common.temperatureHigh')}
        />
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Room Layout Section */}
          <Card>
            <div className="border-b border-neutral-200 px-4 py-3 bg-neutral-50 flex justify-between items-center">
              <h3 className="font-medium text-neutral-800">{selectedRoom?.name} - {t('dashboard.roomLayout')}</h3>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">{t('common.edit')}</Button>
                <Select defaultValue={selectedRoom?.id?.toString()} onValueChange={handleRoomChange}>
                  <SelectTrigger className="h-8 text-xs w-24">
                    <SelectValue placeholder={selectedRoom?.name} />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms?.map((room) => (
                      <SelectItem key={room.id} value={room.id.toString()}>
                        {room.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <CardContent className="p-0">
              {selectedRoom && (
                <RoomLayout 
                  roomId={selectedRoom.id} 
                  layout={selectedRoom.layout ? JSON.parse(selectedRoom.layout) : undefined}
                  highlightBedId={3} // Example: highlight bed with fall alert
                />
              )}
            </CardContent>
          </Card>

          {/* Fall Incidents Chart */}
          <Card>
            <div className="border-b border-neutral-200 px-4 py-3 bg-neutral-50 flex justify-between items-center">
              <h3 className="font-medium text-neutral-800">{t('dashboard.fallIncidentsChart')}</h3>
              <div className="flex space-x-2">
                <Select defaultValue="weekly">
                  <SelectTrigger className="h-8 text-xs w-24">
                    <SelectValue placeholder={t('dashboard.weeklyView')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">{t('dashboard.weeklyView')}</SelectItem>
                    <SelectItem value="monthly">{t('dashboard.monthlyView')}</SelectItem>
                    <SelectItem value="yearly">{t('dashboard.yearlyView')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <CardContent className="p-4">
              <canvas id="fallIncidentsChart" height="220"></canvas>
            </CardContent>
          </Card>

          {/* Environment Monitoring Chart */}
          <Card>
            <div className="border-b border-neutral-200 px-4 py-3 bg-neutral-50 flex justify-between items-center">
              <h3 className="font-medium text-neutral-800">
                {t('dashboard.environmentMonitoring')} - {selectedRoom?.name}
              </h3>
              <div className="flex space-x-2">
                <Select defaultValue={selectedRoom?.id?.toString()} onValueChange={handleRoomChange}>
                  <SelectTrigger className="h-8 text-xs w-24">
                    <SelectValue placeholder={selectedRoom?.name} />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms?.map((room) => (
                      <SelectItem key={room.id} value={room.id.toString()}>
                        {room.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <CardContent className="p-4">
              <canvas id="environmentChart" height="200"></canvas>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Stats and Details */}
        <div className="space-y-6">
          {/* Selected Patient Details */}
          <PatientDetails patientId={selectedPatient?.id} />

          {/* Fall Risk Pie Chart */}
          <Card>
            <div className="border-b border-neutral-200 px-4 py-3 bg-neutral-50">
              <h3 className="font-medium text-neutral-800">{t('dashboard.fallRiskStats')}</h3>
            </div>
            <CardContent className="p-4 flex justify-center">
              <div style={{ width: '220px', height: '220px' }}>
                <canvas id="fallRiskChart"></canvas>
              </div>
            </CardContent>
          </Card>

          {/* Recent Incidents */}
          <Card>
            <div className="border-b border-neutral-200 px-4 py-3 bg-neutral-50">
              <h3 className="font-medium text-neutral-800">{t('dashboard.recentEvents')}</h3>
            </div>
            <div className="divide-y divide-neutral-200">
              {recentAccidents && recentAccidents.length > 0 ? (
                recentAccidents.map((accident, index) => (
                  <div key={accident.id || index} className="p-3 flex items-start">
                    {getEventTypeIcon(accident)}
                    <div className="ml-3">
                      <p className="text-sm text-neutral-800 font-medium">
                        Room {accident.roomId} Patient {accident.patientId} {accident.resolved ? 'Fall resolved' : 'Fall detected'}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {formatEventTime(accident.date)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-neutral-500 text-sm">
                  No recent events
                </div>
              )}
            </div>
            <div className="p-2 bg-neutral-50 text-center">
              <button className="text-primary text-sm hover:underline">
                {t('dashboard.viewAllEvents')}
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
