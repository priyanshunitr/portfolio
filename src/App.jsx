import React, { useState, useRef, useEffect } from 'react'

// --- Constants ---
import gunImg from './assets/gun_v2.png'

const BULLET_LIFETIME = 4000 
// Configuration for the Gun Image
const GUN_SCALE = 1.2
const PIVOT_X_PERCENT = 0.75 // 75% of screen width
const PIVOT_Y_OFFSET_PX = 0 // Offset from bottom
const GUN_IMAGE_ROTATION_OFFSET = 45 // Adjust this if gun points weirdly. 
// If gun points UP in image, and we want it to point at mouse (screen angle), 
// Screen Angle for UP is -90. 
// We want `Rotation + Img_Angle = -90` ? No.
// We want the Drawn Angle to be Target Angle.
// Drawn = Base_Img + Rotation.
// Target = atan2(dy, dx).
// So Rotation = Target - Base_Img.
// If Base_Img is pointing Top-Left (-45 deg?), then Rotation = Target - (-45) = Target + 45.

function GunCursor() {
  const [rotation, setRotation] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isFiring, setIsFiring] = useState(false)
  const gunRef = useRef(null)

  useEffect(() => {
    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY })
      
      // Exact Visual Pivot Calculation
      // Gun Container: 500x500, Right: 20px, Bottom: -250px
      // Transform Origin: 50% 80%
      
      const containerWidth = 500;
      const containerHeight = 500;
      const rightOffset = 20;
      const bottomOffset = -250; 
      
      // Pivot X (Screen Space)
      // Screen Width - Right Offset - Half Width
      const pivotX = window.innerWidth - rightOffset - (containerWidth / 2);
      
      // Pivot Y (Screen Space)
      // Screen Height - Bottom Position (relative to bottom) -> Bottom Edge Y
      // Bottom Edge Y = window.innerHeight - bottomOffset (note: bottomOffset is negative, so minus minus is plus?)
      // Wait: bottom: -250px means it is pushed DOWN. So Y increases.
      // Element Bottom Edge = window.innerHeight - bottomOffset? 
      // If bottom is 10px, edge is at Height - 10.
      // If bottom is -250px, edge is at Height - (-250) = Height + 250. Correct.
      // Pivot is 80% down implies 20% up from bottom.
      const pivotY = (window.innerHeight - bottomOffset) - (containerHeight * 0.2);

      const dx = e.clientX - pivotX;
      const dy = e.clientY - pivotY;
      
      const angle = Math.atan2(dy, dx); 
      const deg = angle * (180 / Math.PI);
      
      // Calibration:
      // The sprite points roughly towards Top-Left (-135 deg).
      // We want Rotation 0 to correspond to Deg -135.
      // So Rotation = Deg - (-135) = Deg + 135.
      setRotation(deg + 109); 
    }
    
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
            <div style={{ width: '2px', height: '20px', background: 'red', position: 'absolute', left: '0', top: '-10px' }}></div>
            <div style={{ width: '20px', height: '2px', background: 'red', position: 'absolute', left: '-10px', top: '0' }}></div>
        </div>
    </div>
  )
}

function BulletHole({ x, y, id, onExpired }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onExpired(id)
        }, BULLET_LIFETIME)
        return () => clearTimeout(timer)
    }, [id, onExpired])

    return (
        <div style={{
            position: 'absolute',
            left: x,
            top: y,
            width: '10px',
            height: '10px',
            background: 'black',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            boxShadow: '0 0 2px rgba(0,0,0,0.5)'
        }} />
    )
}

function App() {
  const [holes, setHoles] = useState([])

  useEffect(() => {
      const handleClick = (e) => {
            const newHole = {
                x: e.clientX,
                y: e.clientY,
                id: Math.random()
            }
            setHoles(h => [...h, newHole])
      }
      
      window.addEventListener('mousedown', handleClick)
      return () => window.removeEventListener('mousedown', handleClick)
  }, [])

  const removeHole = (id) => {
      setHoles(h => h.filter(hole => hole.id !== id))
  }

  return (
    <div style={{ 
        width: '100vw', 
        height: '100vh', 
        background: 'white', 
        cursor: 'none', /* Hide default cursor */
        overflow: 'hidden'
    }}>
      <GunCursor />
      {holes.map(h => (
          <BulletHole key={h.id} {...h} onExpired={removeHole} />
      ))}
      
      <div style={{ padding: '50px', fontFamily: 'sans-serif', color: '#333', userSelect: 'none' }}>
          <h1>Portfolio Target Practice</h1>
          <p>The screen is your canvas. Click to shoot.</p>
      </div>
    </div>
  )
}

export default App
