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

function Mascot({ mousePos }) {
  const mascotRef = useRef(null)
  const [expression, setExpression] = useState('idle') // idle, frightened, dead
  const [deadTimer, setDeadTimer] = useState(null)

  const checkProximity = useCallback(() => {
    if (!mascotRef.current || expression === 'dead') return

    const rect = mascotRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    const dx = mousePos.x - centerX
    const dy = mousePos.y - centerY
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < 150) {
      setExpression('frightened')
    } else {
      setExpression('idle')
    }
  }, [mousePos, expression])

  useEffect(() => {
    checkProximity()
  }, [mousePos, checkProximity])

  const handleMascotClick = (e) => {
    setExpression('dead')
    
    if (deadTimer) clearTimeout(deadTimer)
    const timer = setTimeout(() => {
      setExpression('idle')
    }, 3000)
    setDeadTimer(timer)
  }

  // Calculate eye rotation/offset
  const getEyeStyle = (isRightEye) => {
    if (expression === 'dead' || !mascotRef.current) return {}
    
    const rect = mascotRef.current.getBoundingClientRect()
    // Roughly center of eyes
    const eyeBaseX = rect.left + (isRightEye ? 80 : 40)
    const eyeBaseY = rect.top + 50
    
    const dx = mousePos.x - eyeBaseX
    const dy = mousePos.y - eyeBaseY
    const angle = Math.atan2(dy, dx)
    const distance = Math.min(Math.sqrt(dx * dx + dy * dy) / 10, 8) 

    return {
      transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`
    }
  }

  return (
    <div 
      ref={mascotRef}
      onMouseDown={handleMascotClick}
      style={{
        position: 'absolute',
        bottom: '100px',
        left: '200px',
        width: '120px',
        height: '150px',
        cursor: 'none',
        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        transform: expression === 'dead' ? 'rotate(90deg) translateY(30px)' : (expression === 'frightened' ? 'scale(1.1) rotate(2deg)' : 'scale(1)'),
        opacity: expression === 'dead' ? 0.7 : 1,
        zIndex: 50,
      }}
    >
      {/* Body */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: '100px',
        backgroundColor: expression === 'dead' ? '#4a4a4a' : (expression === 'frightened' ? '#ff6b6b' : '#4ecdc4'),
        borderRadius: '50% 50% 25% 25%',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5), inset 0 -5px 15px rgba(0,0,0,0.2)',
        transition: 'background-color 0.3s ease, transform 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '20px'
      }}>
        {/* Face */}
        <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Eyes Container */}
          <div style={{ display: 'flex', gap: '25px', marginBottom: '15px' }}>
            {/* Left Eye */}
            <div style={{ 
              width: '28px', 
              height: '28px', 
              backgroundColor: 'white', 
              borderRadius: '50%', 
              position: 'relative',
              overflow: 'hidden',
              boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.1)',
              border: expression === 'frightened' ? '2px solid #fff' : 'none',
              animation: expression === 'frightened' ? 'shake 0.1s infinite' : 'none'
            }}>
              {expression === 'dead' ? (
                <div style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center', lineHeight: '28px', color: '#333' }}>×</div>
              ) : (
                <div style={{ 
                  width: '12px', 
                  height: '12px', 
                  backgroundColor: '#333', 
                  borderRadius: '50%', 
                  position: 'absolute',
                  left: '8px',
                  top: '8px',
                  ...getEyeStyle(false)
                }} />
              )}
            </div>
            {/* Right Eye */}
            <div style={{ 
              width: '28px', 
              height: '28px', 
              backgroundColor: 'white', 
              borderRadius: '50%', 
              position: 'relative',
              overflow: 'hidden',
              boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.1)',
              animation: expression === 'frightened' ? 'shake 0.1s infinite' : 'none'
            }}>
               {expression === 'dead' ? (
                <div style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center', lineHeight: '28px', color: '#333' }}>×</div>
              ) : (
                <div style={{ 
                  width: '12px', 
                  height: '12px', 
                  backgroundColor: '#333', 
                  borderRadius: '50%', 
                  position: 'absolute',
                  left: '8px',
                  top: '8px',
                  ...getEyeStyle(true)
                }} />
              )}
            </div>
          </div>

          {/* Mouth */}
          <div style={{
            width: expression === 'frightened' ? '40px' : (expression === 'dead' ? '25px' : '20px'),
            height: expression === 'frightened' ? '20px' : (expression === 'dead' ? '4px' : '8px'),
            backgroundColor: '#333',
            borderRadius: expression === 'frightened' ? '50% 50% 10px 10px' : '10px',
            transition: 'all 0.2s ease',
            boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.2)'
          }} />
        </div>
      </div>
      
      {/* Legs */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', position: 'absolute', bottom: '-5px', width: '100%', zIndex: -1 }}>
          <div style={{ width: '18px', height: '25px', backgroundColor: expression === 'dead' ? '#333' : '#45b7af', borderRadius: '8px', boxShadow: '0 5px 10px rgba(0,0,0,0.3)' }} />
          <div style={{ width: '18px', height: '25px', backgroundColor: expression === 'dead' ? '#333' : '#45b7af', borderRadius: '8px', boxShadow: '0 5px 10px rgba(0,0,0,0.3)' }} />
      </div>

      <style>{`
        @keyframes shake {
          0% { transform: translate(1px, 1px) rotate(0deg); }
          20% { transform: translate(-1px, 0px) rotate(-1deg); }
          40% { transform: translate(1px, -1px) rotate(1deg); }
          60% { transform: translate(-1px, 1px) rotate(0deg); }
          80% { transform: translate(1px, 1px) rotate(-1deg); }
          100% { transform: translate(-1px, -2px) rotate(-1deg); }
        }
      `}</style>
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
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
      const handleMouseMove = (e) => {
          setMousePos({ x: e.clientX, y: e.clientY })
      }

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
      
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mousedown', handleClick)
      return () => {
          window.removeEventListener('mousemove', handleMouseMove)
          window.removeEventListener('mousedown', handleClick)
      }
  }, [])

  const removeHole = useCallback((id) => {
      setHoles(h => h.filter(hole => hole.id !== id))
  }, [])

  return (
    <div style={{ 
        width: '100vw', 
        height: '100vh', 
        background: 'linear-gradient(135deg, #1e1e1e 0%, #121212 100%)', 
        cursor: 'none', /* Hide default cursor */
        overflow: 'hidden'
    }}>
      <GunCursor />
      <Mascot mousePos={mousePos} />
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
