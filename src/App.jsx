import React, { useState, useRef, useEffect, useCallback } from 'react'

// --- Constants ---
import gunImg from './assets/gun_v2.png'
import hole1 from './assets/bullet_hole_1.png'
import hole2 from './assets/bullet_hole_2.png'
import hole3 from './assets/bullet_hole_3.png'

const BULLET_LIFETIME = 1000 
const FADE_DURATION = 500
const HOLE_IMAGES = [hole1, hole2, hole3]

// Stick Model Implementation already verified. 
// Restoring GunCursor Component
function GunCursor() {
  const [rotation, setRotation] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isFiring, setIsFiring] = useState(false)
  const gunRef = useRef(null)

  useEffect(() => {
    // Constant: The angle the gun points to in the raw image (relative to right/0deg).
    // The gun image points roughly Top-Left (-115 degrees).
    const NOZZLE_ANGLE_IN_IMAGE = -109; 

    // We calculate the pivot position once (or on resize) to avoid layout thrashing
    const updatePivot = () => {
        // Gun bounds
        const containerW = 500;
        const containerH = 500;
        
        // CSS Position (Hardcoded to match the style below for performance)
        const rightOffset = 20;
        const bottomOffset = -250; // Pushed down
        
        // Pivot in %
        const pivotXPercent = 0.5;
        const pivotYPercent = 0.8;

        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;

        // Calculate Pixel Position of the Element's Top-Left
        const elementRight = viewportW - rightOffset;
        const elementLeft = elementRight - containerW;
        
        // Bottom is relative to viewport bottom
        // CSS bottom: -250px means the bottom edge is 250px BELOW the viewport bottom.
        const elementBottom = viewportH - bottomOffset; 
        const elementTop = elementBottom - containerH;

        // Calculate Pivot Point in Screen Space
        const pX = elementLeft + (containerW * pivotXPercent);
        const pY = elementTop + (containerH * pivotYPercent);

        return { x: pX, y: pY };
    }

    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY })
      
      const pivot = updatePivot(); 
      // Vector from Pivot to Mouse (The "Stick")
      const dx = e.clientX - pivot.x;
      const dy = e.clientY - pivot.y;
      
      // Target Angle for the stick
      const targetAngleRad = Math.atan2(dy, dx); 
      const targetAngleDeg = targetAngleRad * (180 / Math.PI);
      
      // Calculate required rotation
      setRotation(targetAngleDeg - NOZZLE_ANGLE_IN_IMAGE); 
    }
    
    // Firing logic
     const handleMouseDown = () => {
        setIsFiring(true)
        setTimeout(() => setIsFiring(false), 100)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mousedown', handleMouseDown)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  return (
    <div 
        style={{
            position: 'fixed',
            left: 0,
            top: 0,
            width: '100vw',
            height: '100vh',
            pointerEvents: 'none',
            zIndex: 9999,
            overflow: 'hidden'
        }}
    >
        {/* Gun Image Container */}
        <div 
            style={{
                position: 'absolute',
                // Explicitly place it so it's impossible to miss
                right: '20px', 
                bottom: '-250px', 
                width: '500px',
                height: '500px',
                
                // Pivot at the bottom center of the image box (the "shoulder")
                // If we put the box at Bottom Right, we want the pivot to be roughly there.
                transformOrigin: '50% 80%', 
                
                transform: `rotate(${rotation}deg) scale(${isFiring ? 1.05 : 1})`,
                transition: 'transform 0.05s linear',
                
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center', 
            }}
        >
             <img 
                src={gunImg} 
                alt="Gun" 
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                     // Remove transform inside, just plain image
                }} 
             />
        </div>

        {/* Crosshair */}
        <div style={{
            position: 'absolute',
            left: position.x,
            top: position.y,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 10000
        }}>
            <div style={{ width: '2px', height: '20px', background: 'red', position: 'absolute', left: '0', top: '-10px', boxShadow: '0 0 5px rgba(255,0,0,0.5)' }}></div>
            <div style={{ width: '20px', height: '2px', background: 'red', position: 'absolute', left: '-10px', top: '0', boxShadow: '0 0 5px rgba(255,0,0,0.5)' }}></div>
        </div>
    </div>
  )
}

function BulletHole({ x, y, id, img, onExpired }) {
    const [isFading, setIsFading] = useState(false)

    useEffect(() => {
        // Start fading after BULLET_LIFETIME
        const fadeTimer = setTimeout(() => {
            setIsFading(true)
        }, BULLET_LIFETIME)

        // Remove from state after total time (stay + fade)
        const removeTimer = setTimeout(() => {
            onExpired(id)
        }, BULLET_LIFETIME + FADE_DURATION)

        return () => {
            clearTimeout(fadeTimer)
            clearTimeout(removeTimer)
        }
    }, [id, onExpired])

    return (
        <img 
            src={img}
            alt="bullet hole"
            style={{
                position: 'absolute',
                left: x,
                top: y,
                width: '30px', 
                height: '30px',
                objectFit: 'contain',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                opacity: isFading ? 0 : 0.8,
                transition: `opacity ${FADE_DURATION}ms ease-out`
            }} 
        />
    )
}

function App() {
  const [holes, setHoles] = useState([])

  useEffect(() => {
      const handleClick = (e) => {
            const randomImg = HOLE_IMAGES[Math.floor(Math.random() * HOLE_IMAGES.length)];
            const newHole = {
                x: e.clientX,
                y: e.clientY,
                id: Math.random(),
                img: randomImg
            }
            setHoles(h => [...h, newHole])
      }
      
      window.addEventListener('mousedown', handleClick)
      return () => window.removeEventListener('mousedown', handleClick)
  }, [])

  const removeHole = useCallback((id) => {
      setHoles(h => h.filter(hole => hole.id !== id))
  }, [])
// ...

  return (
    <div style={{ 
        width: '100vw', 
        height: '100vh', 
        background: 'linear-gradient(135deg, #1e1e1e 0%, #121212 100%)', 
        cursor: 'none', /* Hide default cursor */
        overflow: 'hidden'
    }}>
      <GunCursor />
      {holes.map(h => (
          <BulletHole key={h.id} {...h} onExpired={removeHole} />
      ))}
      
      <div style={{ padding: '50px', fontFamily: 'sans-serif', color: '#e0e0e0', userSelect: 'none' }}>
          <h1 style={{ color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>Portfolio Target Practice</h1>
          <p style={{ opacity: 0.7 }}>The screen is your canvas. Click to shoot.</p>
      </div>
    </div>
  )
}

export default App
