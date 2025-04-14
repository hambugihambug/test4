import { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/contexts/I18nContext';

type LayoutElement = {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
};

interface RoomLayout {
  beds: LayoutElement[];
  walls: LayoutElement[];
  door: LayoutElement;
}

interface RoomLayoutProps {
  roomId: number;
  layout?: RoomLayout;
  onSave?: (layout: RoomLayout) => void;
  editable?: boolean;
  highlightBedId?: number | null;
}

export function RoomLayout({ roomId, layout, onSave, editable = false, highlightBedId }: RoomLayoutProps) {
  const { t } = useI18n();
  const [currentLayout, setCurrentLayout] = useState<RoomLayout | null>(null);
  const [selectedElement, setSelectedElement] = useState<{ type: 'bed' | 'wall' | 'door', id: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (layout) {
      setCurrentLayout(layout);
    } else {
      // Default layout if none provided
      setCurrentLayout({
        beds: [
          { id: 1, x: 50, y: 50, width: 100, height: 50, label: '침대 1' },
          { id: 2, x: 50, y: 150, width: 100, height: 50, label: '침대 2' },
          { id: 3, x: 200, y: 50, width: 100, height: 50, label: '침대 3' },
          { id: 4, x: 200, y: 150, width: 100, height: 50, label: '침대 4' }
        ],
        walls: [
          { id: 1, x: 0, y: 0, width: 350, height: 10 },
          { id: 2, x: 0, y: 0, width: 10, height: 250 },
          { id: 3, x: 340, y: 0, width: 10, height: 250 },
          { id: 4, x: 0, y: 240, width: 350, height: 10 }
        ],
        door: { id: 1, x: 150, y: 0, width: 50, height: 10 }
      });
    }
  }, [layout]);
  
  const handleSaveLayout = () => {
    if (currentLayout && onSave) {
      onSave(currentLayout);
    }
  };
  
  const handleAddBed = () => {
    if (!currentLayout) return;
    
    const newId = Math.max(0, ...currentLayout.beds.map(b => b.id)) + 1;
    const newBed: LayoutElement = {
      id: newId,
      x: 100,
      y: 100,
      width: 100,
      height: 50,
      label: `침대 ${newId}`
    };
    
    setCurrentLayout({
      ...currentLayout,
      beds: [...currentLayout.beds, newBed]
    });
  };
  
  const handleElementDrag = (type: 'bed' | 'wall' | 'door', id: number, dx: number, dy: number) => {
    if (!currentLayout || !editable) return;
    
    if (type === 'bed') {
      setCurrentLayout({
        ...currentLayout,
        beds: currentLayout.beds.map(bed => 
          bed.id === id 
            ? { ...bed, x: Math.max(0, bed.x + dx), y: Math.max(0, bed.y + dy) } 
            : bed
        )
      });
    } else if (type === 'wall') {
      setCurrentLayout({
        ...currentLayout,
        walls: currentLayout.walls.map(wall => 
          wall.id === id 
            ? { ...wall, x: Math.max(0, wall.x + dx), y: Math.max(0, wall.y + dy) } 
            : wall
        )
      });
    } else if (type === 'door') {
      setCurrentLayout({
        ...currentLayout,
        door: { ...currentLayout.door, x: Math.max(0, currentLayout.door.x + dx), y: Math.max(0, currentLayout.door.y + dy) }
      });
    }
  };
  
  const startDrag = (type: 'bed' | 'wall' | 'door', id: number) => {
    if (!editable) return;
    setSelectedElement({ type, id });
  };
  
  if (!currentLayout) {
    return <div className="h-56 flex items-center justify-center">Loading layout...</div>;
  }
  
  return (
    <div className="p-4 bg-neutral-50">
      <div 
        className="bg-white border-2 border-neutral-300 rounded-lg p-4 relative h-56" 
        style={{ 
          backgroundImage: 'url(\'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2UyZThlMCIgb3BhY2l0eT0iMC4yIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=\')'
        }}
        ref={containerRef}
      >
        {/* Wall Elements */}
        {currentLayout.walls.map(wall => (
          <div 
            key={`wall-${wall.id}`}
            className={`absolute bg-neutral-800 ${editable ? 'cursor-move' : ''}`}
            style={{
              left: `${wall.x}px`,
              top: `${wall.y}px`,
              width: `${wall.width}px`,
              height: `${wall.height}px`
            }}
            onMouseDown={editable ? () => startDrag('wall', wall.id) : undefined}
          />
        ))}
        
        {/* Door Element */}
        <div 
          className={`absolute bg-white border-x-2 border-b-2 border-neutral-800 ${editable ? 'cursor-move' : ''}`}
          style={{
            left: `${currentLayout.door.x}px`,
            top: `${currentLayout.door.y}px`,
            width: `${currentLayout.door.width}px`,
            height: `${currentLayout.door.height + 14}px`
          }}
          onMouseDown={editable ? () => startDrag('door', currentLayout.door.id) : undefined}
        >
          <div className="text-xs text-center mt-6">{t('rooms.door')}</div>
        </div>
        
        {/* Bed Elements */}
        {currentLayout.beds.map(bed => {
          const isFallDetected = highlightBedId === bed.id;
          return (
            <div 
              key={`bed-${bed.id}`}
              className={`absolute ${isFallDetected ? 'bg-red-100 border border-red-300' : 'bg-blue-100 border border-blue-300'} rounded flex items-center justify-center ${editable ? 'cursor-move' : ''}`}
              style={{
                left: `${bed.x}px`,
                top: `${bed.y}px`,
                width: `${bed.width}px`,
                height: `${bed.height}px`
              }}
              onMouseDown={editable ? () => startDrag('bed', bed.id) : undefined}
            >
              {isFallDetected && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full animate-pulse"></div>
              )}
              <span className={`text-xs ${isFallDetected ? 'text-red-800' : 'text-blue-800'}`}>
                {bed.label} {isFallDetected ? '(낙상)' : ''}
              </span>
            </div>
          );
        })}
      </div>
      
      {editable && (
        <div className="mt-4 flex space-x-2 justify-end">
          <button 
            className="bg-white border border-neutral-300 rounded px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
            onClick={handleAddBed}
          >
            {t('rooms.addBed')}
          </button>
          <button 
            className="bg-primary text-white rounded px-2 py-1 text-xs font-medium hover:bg-blue-800"
            onClick={handleSaveLayout}
          >
            {t('rooms.saveLayout')}
          </button>
        </div>
      )}
    </div>
  );
}
