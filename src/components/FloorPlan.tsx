import React, { useState, useEffect, useRef } from 'react';
import CaptivePortal from './CaptivePortal';

interface Zone {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  icon: string;
  dwellThreshold: number; // in milliseconds
}

interface Event {
  type: 'Sign Up' | 'Walk In' | 'Walk Out' | 'Dwell Threshold' | 'Zone Walk In' | 'Zone Walk Out' | 'Zone Dwell Threshold';
  zone?: string;
  timestamp: Date;
  data?: any;
}

const FloorPlan: React.FC = () => {
  const [cursorPosition, setCursorPosition] = useState({ x: -100, y: -100 });
  const [isInStore, setIsInStore] = useState(false);
  const [currentZone, setCurrentZone] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [showCaptivePortal, setShowCaptivePortal] = useState(false);
  const [zoneDwellTimers, setZoneDwellTimers] = useState<{[key: string]: NodeJS.Timeout | null}>({});
  const [storeDwellTimer, setStoreDwellTimer] = useState<NodeJS.Timeout | null>(null);
  const [isEventStreamCollapsed, setIsEventStreamCollapsed] = useState(false);
  const floorPlanRef = useRef<HTMLDivElement>(null);

  // Define grocery store zones with responsive positioning
  const getResponsiveZones = () => {
    // Get the current width of the floor plan for responsive calculations
    const floorPlanWidth = floorPlanRef.current?.clientWidth || 800;
    const floorPlanHeight = floorPlanRef.current?.clientHeight || 600;
    
    // Calculate scale factors based on original 800x600 design
    const widthScale = floorPlanWidth / 800;
    const heightScale = floorPlanHeight / 600;
    
    return [
      { 
        id: 'fresh-veggies', 
        name: 'Fresh Veggies', 
        x: 50 * widthScale, 
        y: 100 * heightScale, 
        width: 200 * widthScale, 
        height: 150 * heightScale, 
        color: 'linear-gradient(135deg, #a5d6a7 0%, #81c784 100%)', 
        icon: '🥬',
        dwellThreshold: 5000 
      },
      { 
        id: 'bakery', 
        name: 'Bakery', 
        x: 300 * widthScale, 
        y: 100 * heightScale, 
        width: 150 * widthScale, 
        height: 150 * heightScale, 
        color: 'linear-gradient(135deg, #ffe0b2 0%, #ffcc80 100%)', 
        icon: '🥐',
        dwellThreshold: 4000 
      },
      { 
        id: 'meats', 
        name: 'Meats', 
        x: 500 * widthScale, 
        y: 100 * heightScale, 
        width: 200 * widthScale, 
        height: 150 * heightScale, 
        color: 'linear-gradient(135deg, #ffcdd2 0%, #ef9a9a 100%)', 
        icon: '🥩',
        dwellThreshold: 6000 
      },
      { 
        id: 'dairy', 
        name: 'Dairy', 
        x: 50 * widthScale, 
        y: 300 * heightScale, 
        width: 200 * widthScale, 
        height: 150 * heightScale, 
        color: 'linear-gradient(135deg, #b3e5fc 0%, #81d4fa 100%)', 
        icon: '🥛',
        dwellThreshold: 3000 
      },
      { 
        id: 'frozen', 
        name: 'Frozen', 
        x: 300 * widthScale, 
        y: 300 * heightScale, 
        width: 150 * widthScale, 
        height: 150 * heightScale, 
        color: 'linear-gradient(135deg, #b2ebf2 0%, #80deea 100%)', 
        icon: '❄️',
        dwellThreshold: 4000 
      },
      { 
        id: 'checkout', 
        name: 'Checkout', 
        x: 500 * widthScale, 
        y: 300 * heightScale, 
        width: 200 * widthScale, 
        height: 150 * heightScale, 
        color: 'linear-gradient(135deg, #e1bee7 0%, #ce93d8 100%)', 
        icon: '💳',
        dwellThreshold: 7000 
      }
    ];
  };

  const [zones, setZones] = useState<Zone[]>(getResponsiveZones());

  // Update zones when window is resized
  useEffect(() => {
    const handleResize = () => {
      setZones(getResponsiveZones());
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Define axis points with responsive positioning
  const getResponsiveAxisPoints = () => {
    // Get the current dimensions of the floor plan
    const floorPlanWidth = floorPlanRef.current?.clientWidth || 800;
    const floorPlanHeight = floorPlanRef.current?.clientHeight || 600;
    
    // Calculate scale factors
    const widthScale = floorPlanWidth / 800;
    const heightScale = floorPlanHeight / 600;
    
    return [
      { x: 100 * widthScale, y: 50 * heightScale },
      { x: 300 * widthScale, y: 50 * heightScale },
      { x: 500 * widthScale, y: 50 * heightScale },
      { x: 700 * widthScale, y: 50 * heightScale },
      { x: 100 * widthScale, y: 250 * heightScale },
      { x: 300 * widthScale, y: 250 * heightScale },
      { x: 500 * widthScale, y: 250 * heightScale },
      { x: 700 * widthScale, y: 250 * heightScale },
      { x: 100 * widthScale, y: 450 * heightScale },
      { x: 300 * widthScale, y: 450 * heightScale },
      { x: 500 * widthScale, y: 450 * heightScale },
      { x: 700 * widthScale, y: 450 * heightScale },
      { x: 100 * widthScale, y: 550 * heightScale },
      { x: 300 * widthScale, y: 550 * heightScale },
      { x: 500 * widthScale, y: 550 * heightScale },
      { x: 700 * widthScale, y: 550 * heightScale },
    ];
  };

  const [axisPoints, setAxisPoints] = useState(getResponsiveAxisPoints());

  // Update axis points when window is resized
  useEffect(() => {
    const handleResize = () => {
      setAxisPoints(getResponsiveAxisPoints());
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Toggle event stream collapse state
  const toggleEventStream = () => {
    setIsEventStreamCollapsed(!isEventStreamCollapsed);
  };

  // Add a new event to the event stream
  const addEvent = (type: Event['type'], zoneName?: string, data?: any) => {
    const newEvent: Event = {
      type,
      zone: zoneName,
      timestamp: new Date(),
      data
    };
    
    setEvents(prevEvents => [newEvent, ...prevEvents].slice(0, 100)); // Keep only the last 100 events
    
    // Play buzz sound
    playBuzzSound();
  };

  // Play buzz sound effect
  const playBuzzSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.type = 'square';
      oscillator.frequency.value = 150;
      gainNode.gain.value = 0.1;
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start();
      
      setTimeout(() => {
        oscillator.stop();
      }, 200);
    } catch (error) {
      console.error('Failed to play buzz sound:', error);
    }
  };

  // Handle mouse/touch movement on the floor plan
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!floorPlanRef.current) return;
    
    const rect = floorPlanRef.current.getBoundingClientRect();
    let x, y;
    
    // Handle both mouse and touch events
    if ('touches' in e) {
      // Touch event
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      // Mouse event
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    
    setCursorPosition({ x, y });
    
    // Check if cursor is in the store
    const inStore = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;
    
    // Handle store entry/exit
    if (inStore && !isInStore) {
      setIsInStore(true);
      addEvent('Walk In');
      
      // Start store dwell timer
      const timer = setTimeout(() => {
        addEvent('Dwell Threshold');
      }, 10000); // 10 seconds for store dwell threshold
      
      setStoreDwellTimer(timer);
    } else if (!inStore && isInStore) {
      setIsInStore(false);
      addEvent('Walk Out');
      
      // Clear store dwell timer
      if (storeDwellTimer) {
        clearTimeout(storeDwellTimer);
        setStoreDwellTimer(null);
      }
    }
    
    // Check which zone the cursor is in
    let foundZone: string | null = null;
    
    for (const zone of zones) {
      if (
        x >= zone.x && 
        x <= zone.x + zone.width && 
        y >= zone.y && 
        y <= zone.y + zone.height
      ) {
        foundZone = zone.id;
        break;
      }
    }
    
    // Handle zone entry/exit
    if (foundZone !== currentZone) {
      // Clear previous zone dwell timer
      if (currentZone && zoneDwellTimers[currentZone]) {
        clearTimeout(zoneDwellTimers[currentZone]!);
        
        // Update zone dwell timers
        setZoneDwellTimers(prev => ({
          ...prev,
          [currentZone]: null
        }));
      }
      
      // If entering a new zone
      if (foundZone) {
        const zone = zones.find(z => z.id === foundZone);
        if (zone) {
          addEvent('Zone Walk In', zone.name);
          
          // Start zone dwell timer
          const timer = setTimeout(() => {
            addEvent('Zone Dwell Threshold', zone.name);
          }, zone.dwellThreshold);
          
          // Update zone dwell timers
          setZoneDwellTimers(prev => ({
            ...prev,
            [foundZone!]: timer
          }));
        }
      } else if (currentZone) {
        // If leaving a zone
        const zone = zones.find(z => z.id === currentZone);
        if (zone) {
          addEvent('Zone Walk Out', zone.name);
        }
      }
      
      setCurrentZone(foundZone);
    }
  };

  // Handle touch start for mobile devices
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    handleMouseMove(e);
  };

  // Handle touch move for mobile devices
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    handleMouseMove(e);
  };

  // Handle mouse/touch leave from floor plan
  const handleMouseLeave = () => {
    if (isInStore) {
      setIsInStore(false);
      addEvent('Walk Out');
      
      // Clear store dwell timer
      if (storeDwellTimer) {
        clearTimeout(storeDwellTimer);
        setStoreDwellTimer(null);
      }
    }
    
    // Clear current zone
    if (currentZone) {
      const zone = zones.find(z => z.id === currentZone);
      if (zone) {
        addEvent('Zone Walk Out', zone.name);
      }
      
      // Clear zone dwell timer
      if (zoneDwellTimers[currentZone]) {
        clearTimeout(zoneDwellTimers[currentZone]!);
        
        // Update zone dwell timers
        setZoneDwellTimers(prev => ({
          ...prev,
          [currentZone]: null
        }));
      }
      
      setCurrentZone(null);
    }
  };

  // Handle touch end for mobile devices
  const handleTouchEnd = () => {
    handleMouseLeave();
  };

  // Handle click/tap on floor plan to open captive portal
  const handleClick = () => {
    setShowCaptivePortal(true);
    addEvent('Sign Up');
  };

  // Handle form submission from captive portal
  const handleFormSubmit = (name: string, email: string) => {
    addEvent('Sign Up', undefined, { name, email });
  };

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      // Clear store dwell timer
      if (storeDwellTimer) {
        clearTimeout(storeDwellTimer);
      }
      
      // Clear all zone dwell timers
      Object.values(zoneDwellTimers).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    };
  }, [storeDwellTimer, zoneDwellTimers]);

  return (
    <div className="relative app-container">
      <div 
        ref={floorPlanRef}
        className="floor-plan"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Render zones */}
        {zones.map(zone => (
          <div
            key={zone.id}
            className="zone"
            style={{
              left: zone.x,
              top: zone.y,
              width: zone.width,
              height: zone.height,
              background: zone.color,
              opacity: currentZone === zone.id ? 1 : 0.8,
              boxShadow: currentZone === zone.id ? '0 8px 20px rgba(0, 0, 0, 0.15)' : '0 4px 12px rgba(0, 0, 0, 0.08)'
            }}
          >
            <div className="zone-icon">{zone.icon}</div>
            {zone.name}
            
            {/* Zone circle */}
            <div
              className="zone-circle"
              style={{
                left: zone.width / 2,
                top: zone.height / 2,
                width: zone.width * 1.5,
                height: zone.height * 1.5,
                transform: 'translate(-50%, -50%)',
                opacity: currentZone === zone.id ? 0.3 : 0.15
              }}
            />
          </div>
        ))}
        
        {/* Render axis points */}
        {axisPoints.map((point, index) => (
          <div
            key={index}
            className="axis-point"
            style={{
              left: point.x,
              top: point.y
            }}
          />
        ))}
        
        {/* Render cursor person */}
        <div
          className="cursor-person"
          style={{
            left: cursorPosition.x,
            top: cursorPosition.y
          }}
        />
      </div>
      
      {/* Event stream with collapsible functionality */}
      <div className="event-stream-container">
        <div className={`event-stream ${isEventStreamCollapsed ? 'collapsed' : ''}`}>
          <div className="event-stream-header">
            <h3>Event Stream</h3>
            <button 
              className="toggle-button" 
              onClick={toggleEventStream}
              aria-label={isEventStreamCollapsed ? "Expand event stream" : "Collapse event stream"}
            >
              {isEventStreamCollapsed ? '▼' : '▲'}
            </button>
          </div>
          
          {!isEventStreamCollapsed && (
            <div className="event-items">
              {events.map((event, index) => (
                <div 
                  key={index} 
                  className={`event-item ${event.type.toLowerCase().replace(' ', '-')}`}
                >
                  <span className="font-bold">{event.type}</span>
                  {event.zone && <span> - {event.zone}</span>}
                  {event.data && event.type === 'Sign Up' && (
                    <span> - {event.data.name} ({event.data.email})</span>
                  )}
                  <div className="text-xs text-gray-500">
                    {event.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Captive Portal */}
      <CaptivePortal 
        isOpen={showCaptivePortal}
        onClose={() => setShowCaptivePortal(false)}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
};

export default FloorPlan;
