import React, { useState, useEffect, useRef } from 'react';
import CaptivePortal from './CaptivePortal';

interface Zone {
  id: string;
  name: string;
  x: number;
  y: number;
  radius: number;
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

  // Define grocery store zones with responsive positioning - circular zones centered on access points
  const getResponsiveZones = () => {
    // Get the current width of the floor plan for responsive calculations
    const floorPlanWidth = floorPlanRef.current?.clientWidth || 800;
    const floorPlanHeight = floorPlanRef.current?.clientHeight || 600;
    
    // Calculate scale factors based on original 800x600 design
    const widthScale = floorPlanWidth / 800;
    const heightScale = floorPlanHeight / 600;
    
    // Base radius for zones
    const baseRadius = 80;
    const radius = baseRadius * Math.min(widthScale, heightScale);
    
    return [
      {
        id: 'entrance',
        name: 'Entrance',
        x: 100 * widthScale,
        y: 50 * heightScale,
        radius: radius * 0.8,
        color: 'radial-gradient(circle, rgba(76, 175, 80, 0.3) 0%, rgba(76, 175, 80, 0.1) 70%, transparent 100%)',
        icon: '🚪',
        dwellThreshold: 3000
      },
      {
        id: 'fresh-produce',
        name: 'Fresh Produce',
        x: 300 * widthScale,
        y: 50 * heightScale,
        radius: radius,
        color: 'radial-gradient(circle, rgba(165, 214, 167, 0.4) 0%, rgba(129, 199, 132, 0.2) 70%, transparent 100%)',
        icon: '🥬',
        dwellThreshold: 5000
      },
      {
        id: 'bakery',
        name: 'Bakery',
        x: 500 * widthScale,
        y: 50 * heightScale,
        radius: radius * 0.9,
        color: 'radial-gradient(circle, rgba(255, 224, 178, 0.4) 0%, rgba(255, 204, 128, 0.2) 70%, transparent 100%)',
        icon: '🥐',
        dwellThreshold: 4000
      },
      {
        id: 'deli-meats',
        name: 'Deli & Meats',
        x: 700 * widthScale,
        y: 50 * heightScale,
        radius: radius,
        color: 'radial-gradient(circle, rgba(255, 205, 210, 0.4) 0%, rgba(239, 154, 154, 0.2) 70%, transparent 100%)',
        icon: '🥩',
        dwellThreshold: 6000
      },
      {
        id: 'dairy-eggs',
        name: 'Dairy & Eggs',
        x: 100 * widthScale,
        y: 250 * heightScale,
        radius: radius,
        color: 'radial-gradient(circle, rgba(179, 229, 252, 0.4) 0%, rgba(129, 212, 250, 0.2) 70%, transparent 100%)',
        icon: '🥛',
        dwellThreshold: 3000
      },
      {
        id: 'pantry-aisles',
        name: 'Pantry Aisles',
        x: 300 * widthScale,
        y: 250 * heightScale,
        radius: radius * 1.1,
        color: 'radial-gradient(circle, rgba(255, 241, 118, 0.3) 0%, rgba(255, 235, 59, 0.15) 70%, transparent 100%)',
        icon: '🥫',
        dwellThreshold: 8000
      },
      {
        id: 'frozen-foods',
        name: 'Frozen Foods',
        x: 500 * widthScale,
        y: 250 * heightScale,
        radius: radius,
        color: 'radial-gradient(circle, rgba(178, 235, 242, 0.4) 0%, rgba(128, 222, 234, 0.2) 70%, transparent 100%)',
        icon: '❄️',
        dwellThreshold: 4000
      },
      {
        id: 'beverages',
        name: 'Beverages',
        x: 700 * widthScale,
        y: 250 * heightScale,
        radius: radius * 0.9,
        color: 'radial-gradient(circle, rgba(197, 202, 233, 0.4) 0%, rgba(159, 168, 218, 0.2) 70%, transparent 100%)',
        icon: '🥤',
        dwellThreshold: 3500
      },
      {
        id: 'pharmacy',
        name: 'Pharmacy',
        x: 100 * widthScale,
        y: 450 * heightScale,
        radius: radius * 0.7,
        color: 'radial-gradient(circle, rgba(255, 183, 197, 0.4) 0%, rgba(248, 187, 208, 0.2) 70%, transparent 100%)',
        icon: '💊',
        dwellThreshold: 6000
      },
      {
        id: 'health-beauty',
        name: 'Health & Beauty',
        x: 300 * widthScale,
        y: 450 * heightScale,
        radius: radius * 0.8,
        color: 'radial-gradient(circle, rgba(225, 190, 231, 0.4) 0%, rgba(206, 147, 216, 0.2) 70%, transparent 100%)',
        icon: '💄',
        dwellThreshold: 5000
      },
      {
        id: 'checkout',
        name: 'Checkout',
        x: 500 * widthScale,
        y: 450 * heightScale,
        radius: radius * 1.2,
        color: 'radial-gradient(circle, rgba(225, 190, 231, 0.5) 0%, rgba(206, 147, 216, 0.3) 70%, transparent 100%)',
        icon: '💳',
        dwellThreshold: 7000
      },
      {
        id: 'customer-service',
        name: 'Customer Service',
        x: 700 * widthScale,
        y: 450 * heightScale,
        radius: radius * 0.6,
        color: 'radial-gradient(circle, rgba(187, 222, 251, 0.4) 0%, rgba(144, 202, 249, 0.2) 70%, transparent 100%)',
        icon: '🛎️',
        dwellThreshold: 4000
      },
      {
        id: 'exit',
        name: 'Exit',
        x: 100 * widthScale,
        y: 550 * heightScale,
        radius: radius * 0.7,
        color: 'radial-gradient(circle, rgba(244, 67, 54, 0.3) 0%, rgba(244, 67, 54, 0.1) 70%, transparent 100%)',
        icon: '🚪',
        dwellThreshold: 2000
      },
      {
        id: 'self-checkout',
        name: 'Self Checkout',
        x: 300 * widthScale,
        y: 550 * heightScale,
        radius: radius * 0.9,
        color: 'radial-gradient(circle, rgba(156, 39, 176, 0.4) 0%, rgba(156, 39, 176, 0.2) 70%, transparent 100%)',
        icon: '🤖',
        dwellThreshold: 5000
      },
      {
        id: 'shopping-carts',
        name: 'Shopping Carts',
        x: 500 * widthScale,
        y: 550 * heightScale,
        radius: radius * 0.6,
        color: 'radial-gradient(circle, rgba(158, 158, 158, 0.3) 0%, rgba(158, 158, 158, 0.1) 70%, transparent 100%)',
        icon: '🛒',
        dwellThreshold: 2000
      },
      {
        id: 'restrooms',
        name: 'Restrooms',
        x: 700 * widthScale,
        y: 550 * heightScale,
        radius: radius * 0.5,
        color: 'radial-gradient(circle, rgba(121, 85, 72, 0.3) 0%, rgba(121, 85, 72, 0.1) 70%, transparent 100%)',
        icon: '🚻',
        dwellThreshold: 3000
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
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 1200;
      gainNode.gain.value = 0.05;
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start();
      
      setTimeout(() => {
        oscillator.stop();
      }, 150);
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
    
    // Check which zone the cursor is in (circular zones)
    let foundZone: string | null = null;
    
    for (const zone of zones) {
      const distance = Math.sqrt(
        Math.pow(x - zone.x, 2) + Math.pow(y - zone.y, 2)
      );
      
      if (distance <= zone.radius) {
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
        {/* Render circular zones */}
        {zones.map(zone => (
          <div
            key={zone.id}
            className="zone-circle-area"
            style={{
              left: zone.x,
              top: zone.y,
              width: zone.radius * 2,
              height: zone.radius * 2,
              background: zone.color,
              transform: 'translate(-50%, -50%)',
              opacity: currentZone === zone.id ? 0.9 : 0.6,
              border: currentZone === zone.id ? '3px solid rgba(255, 255, 255, 0.8)' : '2px solid rgba(255, 255, 255, 0.4)',
              boxShadow: currentZone === zone.id ?
                '0 0 30px rgba(0, 0, 0, 0.2), inset 0 0 20px rgba(255, 255, 255, 0.3)' :
                '0 0 15px rgba(0, 0, 0, 0.1), inset 0 0 10px rgba(255, 255, 255, 0.2)'
            }}
          >
            <div className="zone-content">
              <div className="zone-icon">{zone.icon}</div>
              <div className="zone-name">{zone.name}</div>
            </div>
          </div>
        ))}
        
        {/* Render access points (WiFi beacons) */}
        {axisPoints.map((point, index) => (
          <div
            key={index}
            className="access-point"
            style={{
              left: point.x,
              top: point.y
            }}
          >
            <div className="access-point-signal" />
          </div>
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
