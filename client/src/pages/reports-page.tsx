import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/contexts/I18nContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Room, Accident, EnvLog } from "@shared/schema";
import { Download, FileSpreadsheet, File, Calendar } from "lucide-react";
import Chart from 'chart.js/auto';

export default function ReportsPage() {
  const { t } = useI18n();
  const [selectedTab, setSelectedTab] = useState("falls");
  const [timeRange, setTimeRange] = useState("weekly");
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  
  // Chart refs
  const fallsChartRef = useRef<HTMLCanvasElement>(null);
  const envChartRef = useRef<HTMLCanvasElement>(null);
  const fallsChart = useRef<Chart | null>(null);
  const envChart = useRef<Chart | null>(null);
  
  // Fetch all rooms
  const { data: rooms } = useQuery<Room[]>({
    queryKey: ['/api/rooms'],
  });
  
  // Fetch accident data
  const { data: accidents, isLoading: accidentsLoading } = useQuery<Accident[]>({
    queryKey: ['/api/accidents'],
  });
  
  // Fetch environment logs for selected room
  const { data: envLogs, isLoading: envLogsLoading } = useQuery<EnvLog[]>({
    queryKey: ['/api/rooms', selectedRoom ? parseInt(selectedRoom) : undefined, 'env-logs'],
    enabled: !!selectedRoom,
  });
  
  // Initialize selectedRoom if not set
  useEffect(() => {
    if (!selectedRoom && rooms && rooms.length > 0) {
      setSelectedRoom(rooms[0].id.toString());
    }
  }, [rooms, selectedRoom]);
  
  // Initialize and update charts when data changes
  useEffect(() => {
    // Clean up existing charts
    if (fallsChart.current) {
      fallsChart.current.destroy();
    }
    
    if (envChart.current) {
      envChart.current.destroy();
    }
    
    // Initialize falls chart if data is available
    if (accidents && fallsChartRef.current) {
      const ctx = fallsChartRef.current.getContext('2d');
      if (ctx) {
        // Process data based on time range
        const now = new Date();
        const timeRangeMap: Record<string, number> = {
          'daily': 1,
          'weekly': 7,
          'monthly': 30,
          'yearly': 365
        };
        
        const days = timeRangeMap[timeRange] || 7;
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - days);
        
        // Filter accidents by date range
        const filteredAccidents = accidents.filter(accident => 
          new Date(accident.date) >= startDate && new Date(accident.date) <= now
        );
        
        // Format data for chart
        let labels: string[] = [];
        let data: number[] = [];
        
        if (timeRange === 'daily') {
          // Hourly breakdown for daily view
          labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
          data = Array(24).fill(0);
          
          filteredAccidents.forEach(accident => {
            const hour = new Date(accident.date).getHours();
            data[hour]++;
          });
        } else if (timeRange === 'weekly') {
          // Daily breakdown for weekly view
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          labels = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(now);
            d.setDate(d.getDate() - 6 + i);
            return dayNames[d.getDay()];
          });
          data = Array(7).fill(0);
          
          filteredAccidents.forEach(accident => {
            const date = new Date(accident.date);
            const dayDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
            if (dayDiff < 7) {
              data[6 - dayDiff]++;
            }
          });
        } else if (timeRange === 'monthly') {
          // Weekly breakdown for monthly view
          labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
          data = Array(4).fill(0);
          
          filteredAccidents.forEach(accident => {
            const date = new Date(accident.date);
            const dayDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
            if (dayDiff < 30) {
              data[Math.floor(dayDiff / 7)]++;
            }
          });
        } else if (timeRange === 'yearly') {
          // Monthly breakdown for yearly view
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          labels = monthNames;
          data = Array(12).fill(0);
          
          filteredAccidents.forEach(accident => {
            const month = new Date(accident.date).getMonth();
            data[month]++;
          });
        }
        
        // Create chart
        fallsChart.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: t('reports.fallIncidents'),
              data,
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
      }
    }
    
    // Initialize environment chart if data is available
    if (envLogs && envChartRef.current && selectedRoom) {
      const ctx = envChartRef.current.getContext('2d');
      if (ctx) {
        // Get relevant logs based on time range
        const now = new Date();
        const timeRangeMap: Record<string, number> = {
          'daily': 24,  // Last 24 hours
          'weekly': 7,  // Last 7 days
          'monthly': 30, // Last 30 days
          'yearly': 365 // Last 365 days
        };
        
        const timeLimit = timeRangeMap[timeRange] || 7;
        let timeUnit: 'hour' | 'day' | 'week' | 'month' = 'day';
        
        if (timeRange === 'daily') {
          timeUnit = 'hour';
        } else if (timeRange === 'weekly') {
          timeUnit = 'day';
        } else if (timeRange === 'monthly') {
          timeUnit = 'week';
        } else if (timeRange === 'yearly') {
          timeUnit = 'month';
        }
        
        const startTime = new Date(now);
        if (timeUnit === 'hour') {
          startTime.setHours(startTime.getHours() - timeLimit);
        } else if (timeUnit === 'day') {
          startTime.setDate(startTime.getDate() - timeLimit);
        } else if (timeUnit === 'week') {
          startTime.setDate(startTime.getDate() - (timeLimit * 7));
        } else if (timeUnit === 'month') {
          startTime.setMonth(startTime.getMonth() - timeLimit);
        }
        
        // Filter logs by date range
        const filteredLogs = envLogs.filter(log => 
          new Date(log.timestamp) >= startTime && new Date(log.timestamp) <= now
        );
        
        // Choose relevant logs to display based on time range
        let displayLogs = filteredLogs;
        
        if (filteredLogs.length > 50) {
          // If too many logs, sample them
          const interval = Math.ceil(filteredLogs.length / 50);
          displayLogs = filteredLogs.filter((_, i) => i % interval === 0);
        }
        
        // Format data for chart
        const labels = displayLogs.map(log => {
          const date = new Date(log.timestamp);
          if (timeUnit === 'hour') {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          } else if (timeUnit === 'day') {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
          } else if (timeUnit === 'week') {
            return `Week ${Math.ceil(date.getDate() / 7)} ${date.toLocaleDateString([], { month: 'short' })}`;
          } else {
            return date.toLocaleDateString([], { month: 'short', year: '2-digit' });
          }
        });
        
        // Create chart
        envChart.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [
              {
                label: `${t('rooms.temperature')} (°C)`,
                data: displayLogs.map(log => log.temperature),
                borderColor: 'rgba(234, 179, 8, 0.8)',
                backgroundColor: 'rgba(234, 179, 8, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
              },
              {
                label: `${t('rooms.humidity')} (%)`,
                data: displayLogs.map(log => log.humidity),
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
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (fallsChart.current) {
        fallsChart.current.destroy();
      }
      if (envChart.current) {
        envChart.current.destroy();
      }
    };
  }, [accidents, envLogs, selectedRoom, timeRange, t]);
  
  const handleExportPDF = () => {
    alert('PDF export functionality would be implemented here');
  };
  
  const handleExportCSV = () => {
    alert('CSV export functionality would be implemented here');
  };
  
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">{t('reports.title')}</h1>
          <p className="text-neutral-500">{t('reports.subtitle')}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="flex items-center" onClick={handleExportCSV}>
            <FileSpreadsheet className="h-4 w-4 mr-1.5" />
            {t('reports.downloadCSV')}
          </Button>
          <Button className="flex items-center" onClick={handleExportPDF}>
            <File className="h-4 w-4 mr-1.5" />
            {t('reports.downloadPDF')}
          </Button>
        </div>
      </div>
      
      {/* Report Configuration */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-neutral-500" />
          <span className="text-neutral-700 font-medium">{t('reports.timeRange')}:</span>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder={t('reports.weekly')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">{t('reports.daily')}</SelectItem>
              <SelectItem value="weekly">{t('reports.weekly')}</SelectItem>
              <SelectItem value="monthly">{t('reports.monthly')}</SelectItem>
              <SelectItem value="yearly">{t('reports.yearly')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-neutral-700 font-medium">{t('reports.rooms')}:</span>
          <Select value={selectedRoom || ""} onValueChange={setSelectedRoom}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Select room" />
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
      
      {/* Reports Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="falls">{t('reports.fallIncidents')}</TabsTrigger>
          <TabsTrigger value="environment">{t('reports.environmentalData')}</TabsTrigger>
        </TabsList>
        
        {/* Fall Incidents Report */}
        <TabsContent value="falls" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.fallIncidents')} - {timeRange === 'daily' ? t('reports.daily') : 
                                                        timeRange === 'weekly' ? t('reports.weekly') : 
                                                        timeRange === 'monthly' ? t('reports.monthly') : 
                                                        t('reports.yearly')}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {accidentsLoading ? (
                <div className="flex justify-center items-center h-80">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : accidents && accidents.length > 0 ? (
                <div className="h-80">
                  <canvas ref={fallsChartRef}></canvas>
                </div>
              ) : (
                <div className="flex justify-center items-center h-80 text-neutral-500">
                  No fall incident data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Environmental Data Report */}
        <TabsContent value="environment" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.environmentalData')} - {selectedRoom ? rooms?.find(r => r.id.toString() === selectedRoom)?.name : ''}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {!selectedRoom ? (
                <div className="flex justify-center items-center h-80 text-neutral-500">
                  Please select a room
                </div>
              ) : envLogsLoading ? (
                <div className="flex justify-center items-center h-80">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : envLogs && envLogs.length > 0 ? (
                <div className="h-80">
                  <canvas ref={envChartRef}></canvas>
                </div>
              ) : (
                <div className="flex justify-center items-center h-80 text-neutral-500">
                  No environmental data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Summary Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t('reports.generateReport')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center p-6 bg-neutral-50 rounded-lg border">
              <div className="text-4xl font-bold text-red-600 mb-2">
                {accidents?.length || 0}
              </div>
              <div className="text-neutral-700 font-medium text-center">
                {t('reports.fallIncidents')}
              </div>
            </div>
            
            <div className="flex flex-col items-center p-6 bg-neutral-50 rounded-lg border">
              <div className="text-4xl font-bold text-yellow-600 mb-2">
                {selectedRoom && envLogs ? 
                  `${envLogs[envLogs.length - 1]?.temperature.toFixed(1)}°C` : '-'}
              </div>
              <div className="text-neutral-700 font-medium text-center">
                {t('rooms.currentTemperature')}
              </div>
            </div>
            
            <div className="flex flex-col items-center p-6 bg-neutral-50 rounded-lg border">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {selectedRoom && envLogs ? 
                  `${envLogs[envLogs.length - 1]?.humidity.toFixed(0)}%` : '-'}
              </div>
              <div className="text-neutral-700 font-medium text-center">
                {t('rooms.currentHumidity')}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-6 space-x-2">
            <Button variant="outline" onClick={handleExportCSV}>
              {t('reports.downloadCSV')}
            </Button>
            <Button onClick={handleExportPDF}>
              {t('reports.downloadPDF')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
