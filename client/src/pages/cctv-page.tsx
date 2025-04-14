import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/contexts/I18nContext";
import { CCTVViewer } from "@/components/ui/cctv-viewer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertCameraSchema } from "@shared/schema";
import { Camera, Room } from "@shared/schema";
import { PlusCircle } from "lucide-react";

const addCameraSchema = z.object({
  roomId: z.number().min(1, "Room is required"),
  name: z.string().min(1, "Camera name is required"),
  streamUrl: z.string().min(1, "Stream URL is required"),
});

export default function CCTVPage() {
  const { t } = useI18n();
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [fullscreenCamera, setFullscreenCamera] = useState<Camera | null>(null);
  const [isAddingCamera, setIsAddingCamera] = useState(false);
  
  // Fetch all cameras
  const { data: cameras, isLoading: camerasLoading } = useQuery<Camera[]>({
    queryKey: ['/api/cameras'],
  });
  
  // Fetch all rooms
  const { data: rooms } = useQuery<Room[]>({
    queryKey: ['/api/rooms'],
  });
  
  // Fetch cameras for selected room
  const { data: roomCameras } = useQuery<Camera[]>({
    queryKey: ['/api/rooms', selectedRoom, 'cameras'],
    enabled: !!selectedRoom,
  });
  
  // Initialize form for adding a new camera
  const form = useForm<z.infer<typeof addCameraSchema>>({
    resolver: zodResolver(addCameraSchema),
    defaultValues: {
      name: "",
      streamUrl: "",
      roomId: 0,
    },
  });
  
  // Set initial selected room
  useEffect(() => {
    if (!selectedRoom && rooms && rooms.length > 0) {
      setSelectedRoom(rooms[0].id);
    }
  }, [rooms, selectedRoom]);
  
  // Handle room selection
  const handleRoomChange = (roomId: string) => {
    setSelectedRoom(parseInt(roomId));
  };
  
  // Handle toggling fullscreen for a camera
  const handleToggleFullscreen = (camera: Camera | null) => {
    setFullscreenCamera(camera);
  };
  
  // Handle adding a new camera
  const onAddCamera = async (values: z.infer<typeof addCameraSchema>) => {
    try {
      await apiRequest("POST", "/api/cameras", values);
      queryClient.invalidateQueries({ queryKey: ['/api/cameras'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rooms', values.roomId, 'cameras'] });
      setIsAddingCamera(false);
      form.reset();
    } catch (error) {
      console.error("Failed to add camera:", error);
    }
  };
  
  // Displayed cameras - either all cameras, room cameras, or fullscreen camera
  const displayedCameras = fullscreenCamera 
    ? [fullscreenCamera] 
    : (selectedRoom && roomCameras ? roomCameras : cameras) || [];
  
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">{t('cctv.title')}</h1>
          <p className="text-neutral-500">{t('cctv.subtitle')}</p>
        </div>
        <div className="flex space-x-2">
          {!fullscreenCamera && (
            <>
              <Select value={selectedRoom?.toString()} onValueChange={handleRoomChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={t('cctv.selectedRoom')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">{t('cctv.allCameras')}</SelectItem>
                  {rooms?.map((room) => (
                    <SelectItem key={room.id} value={room.id.toString()}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button onClick={() => setIsAddingCamera(true)}>
                <PlusCircle className="h-4 w-4 mr-1.5" />
                {t('cctv.addCamera')}
              </Button>
            </>
          )}
        </div>
      </div>
      
      {/* Camera Grid */}
      <div className={`grid gap-4 ${fullscreenCamera ? '' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}>
        {camerasLoading ? (
          <div className="col-span-full flex justify-center items-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          displayedCameras.length === 0 ? (
            <div className="col-span-full text-center p-12 bg-white rounded-lg border border-neutral-200">
              <div className="text-neutral-400 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-neutral-700 mb-1">No Cameras Found</h3>
              <p className="text-neutral-500 mb-4">
                {selectedRoom ? 
                  `This room doesn't have any cameras configured.` : 
                  `There are no cameras configured in the system.`}
              </p>
              <Button onClick={() => setIsAddingCamera(true)}>
                {t('cctv.addCamera')}
              </Button>
            </div>
          ) : (
            displayedCameras.map((camera) => (
              <CCTVViewer
                key={camera.id}
                streamUrl={camera.streamUrl}
                cameraName={camera.name}
                isFullscreen={!!fullscreenCamera}
                onToggleFullscreen={() => handleToggleFullscreen(fullscreenCamera ? null : camera)}
              />
            ))
          )
        )}
      </div>
      
      {/* Add Camera Dialog */}
      <Dialog open={isAddingCamera} onOpenChange={setIsAddingCamera}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('cctv.addCamera')}</DialogTitle>
            <DialogDescription>
              Add a new camera to monitor a room
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onAddCamera)} className="space-y-4">
              <FormField
                control={form.control}
                name="roomId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('cctv.roomName')}</FormLabel>
                    <Select 
                      value={field.value ? field.value.toString() : undefined} 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a room" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {rooms?.map((room) => (
                          <SelectItem key={room.id} value={room.id.toString()}>
                            {room.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('cctv.cameraName')}</FormLabel>
                    <FormControl>
                      <Input placeholder="Main Camera" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="streamUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('cctv.streamUrl')}</FormLabel>
                    <FormControl>
                      <Input placeholder="rtsp://example.com/stream" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddingCamera(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit">{t('common.save')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
