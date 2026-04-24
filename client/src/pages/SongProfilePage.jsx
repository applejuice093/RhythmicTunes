import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { usePlayerStore } from '../store/playerStore';
import { getRawFrequencyData } from '../store/audioReactiveStore';
import { useTheme } from '../context/ThemeContext';

export default function SongProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentSong, isPlaying } = usePlayerStore();
  const { accentHex } = useTheme();
  
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  // Keep user here if this is the currently playing song 
  // (we assume the user navigates here via the player click)
  useEffect(() => {
    if (!currentSong) {
      navigate('/dashboard');
    }
  }, [currentSong, navigate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Set high-res canvas scale
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    window.addEventListener('resize', resize);
    resize();

    // Render Loop for classic NCS Circular Visualizer
    const render = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      const data = getRawFrequencyData(); // 128 bins of Uint8Array
      
      ctx.clearRect(0, 0, width, height);
      
      const cx = width / 2;
      const cy = height / 2;
      
      // Radius slightly larger than the 300px image (150px internal radius + padding)
      const radius = 175; 
      
      // Total bars in the circle for high density look
      const numBars = 72; 
      const barWidth = 5;
      
      for (let i = 0; i < numBars; i++) {
        // We use 36 bins and mirror them for perfect symmetry
        const dataIndex = i < 36 ? Math.floor(i * 0.8) : Math.floor((71 - i) * 0.8); 
        
        const value = data[dataIndex] || 0;
        const amplitude = (value / 255); 
        
        // Dynamic bar growth based on decibel
        const barHeight = Math.max(4, amplitude * 140);
        
        // Spread bars evenly around the circle
        const angle = (i * (Math.PI * 2)) / numBars;
        // Rotate so symmetric center is at bottom
        const rot = angle + Math.PI / 2;
        
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        
        ctx.beginPath();
        ctx.moveTo(0, radius); 
        ctx.lineTo(0, radius + barHeight);
        ctx.lineWidth = barWidth;
        ctx.lineCap = 'round';
        
        // Dynamic Glowing Colors based on amplitude
        ctx.strokeStyle = `rgba(207, 159, 255, ${0.4 + amplitude * 0.6})`; 
        ctx.shadowBlur = 12 + amplitude * 20;
        ctx.shadowColor = accentHex;
        
        ctx.stroke();
        ctx.restore();
      }
      
      rafRef.current = requestAnimationFrame(render);
    };
    
    render();
    
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [accentHex]);

  if (!currentSong) return null;

  return (
    <AppLayout>
      <div className="relative flex min-h-[75vh] flex-col items-center justify-center p-8 overflow-hidden">
        
        <div className="absolute top-0 flex w-full flex-col items-center pt-8 text-center z-10">
          <h1 className="text-4xl font-black text-[var(--text-primary)] drop-shadow-lg">{currentSong.title}</h1>
          <p className="mt-2 text-xl font-bold text-[var(--text-secondary)] drop-shadow-md">{currentSong.artistName || 'Unknown Artist'}</p>
          <div className="mt-4 flex gap-3">
             <span className="glass-card rounded-full px-4 py-1 text-xs font-bold text-[var(--accent)] border border-[var(--border)]">
                {currentSong.genre || 'General'}
             </span>
          </div>
        </div>

        {/* Visualizer Container */}
        <div className="relative flex h-[600px] w-full max-w-[800px] items-center justify-center mt-12">
          
          {/* Central Spinning Record Image */}
          <div 
            className="absolute z-10 aspect-square w-[300px] overflow-hidden rounded-full border-4 border-[rgba(255,255,255,0.05)]"
            style={{ 
              animation: isPlaying ? 'spin 20s linear infinite' : 'none',
              boxShadow: '0 0 50px rgba(0,0,0,0.5)'
            }}
          >
            <img 
              src={currentSong.coverUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80'} 
              alt={currentSong.title} 
              className="h-full w-full object-cover" 
            />
          </div>

          <canvas 
            ref={canvasRef} 
            className="absolute inset-0 h-full w-full pointer-events-none z-0"
          />

        </div>
        
      </div>
      
      {/* Global generic CSS for spin */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AppLayout>
  );
}
