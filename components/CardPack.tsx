
import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface CardPackProps {
  onClick: () => void;
  disabled: boolean;
  isOpening: boolean;
}

export const CardPack: React.FC<CardPackProps> = ({ onClick, disabled, isOpening }) => {
  const controls = useAnimation();
  const [ripped, setRipped] = useState(false);

  useEffect(() => {
    if (isOpening) {
      sequence();
    }
  }, [isOpening]);

  const sequence = async () => {
    await controls.start({
      x: [0, -10, 10, -10, 10, 0],
      scale: [1, 1.02, 0.98, 1],
      transition: { duration: 0.4 }
    });
    setRipped(true);
  };

  return (
    <div className="relative w-72 h-[420px] perspective-1000 group cursor-pointer" onClick={!disabled && !isOpening ? onClick : undefined}>
        
        {/* Glow behind */}
        <motion.div 
            animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.9, 1.05, 0.9], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute inset-0 bg-anime-blue blur-3xl opacity-40 -z-10"
        />

        <motion.div
            animate={controls}
            whileHover={!disabled && !isOpening ? { rotateY: 15, rotateX: 5, y: -10 } : {}}
            className={`w-full h-full relative transform-style-3d transition-transform duration-500 ease-out ${disabled ? 'grayscale brightness-50' : ''}`}
        >
            {/* --- Pack Top (Tearable) --- */}
            <motion.div 
                className="absolute top-0 left-0 w-full h-[15%] z-20 origin-bottom transform-style-3d"
                animate={ripped ? { y: -60, rotateZ: 15, opacity: 0 } : {}}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-gray-300 to-white border-x-4 border-t-4 border-anime-dark rounded-t-xl overflow-hidden flex items-center justify-center">
                     <div className="w-full h-1 bg-black/10 absolute top-2" />
                     <div className="text-[9px] font-black tracking-[0.3em] text-gray-500 uppercase">Tear Here / 撕开</div>
                </div>
                {/* Sawtooth bottom of top part */}
                <div className="absolute bottom-[-6px] left-0 w-full h-[10px] bg-white border-b-4 border-anime-dark clip-path-jagged z-30" style={{ clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)' }}></div>
            </motion.div>

            {/* --- Pack Body --- */}
            <div className="absolute bottom-0 left-0 w-full h-[88%] z-10 bg-gradient-to-br from-anime-dark to-slate-900 border-4 border-anime-dark rounded-b-xl shadow-2xl flex flex-col items-center overflow-hidden transform-style-3d">
                
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-comic-speed opacity-10" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-anime-blue/20 to-transparent opacity-50" />
                
                {/* Diagonal Stripes */}
                <div className="absolute top-20 left-0 w-[150%] h-32 bg-anime-orange/90 -skew-y-12 origin-top-left border-y-4 border-anime-dark shadow-lg" />
                <div className="absolute top-24 left-0 w-[150%] h-2 bg-white/20 -skew-y-12 origin-top-left" />

                <div className="relative z-10 mt-16 flex flex-col items-center w-full">
                    <div className="bg-anime-blue text-white text-[10px] font-bold px-4 py-1 mb-2 uppercase tracking-widest skew-x-12 border border-white">
                        <span className="-skew-x-12 block">Series 3.0</span>
                    </div>
                    
                    <h1 className="font-tech text-7xl text-white leading-none drop-shadow-[4px_4px_0_#000] italic">
                        EPE
                    </h1>
                    
                    <div className="w-full bg-anime-dark text-anime-blue py-1 text-center font-mono text-[10px] uppercase tracking-widest my-2 border-y border-anime-blue/50">
                        Elite Performance
                    </div>

                    <div className="w-28 h-28 border-2 border-white rounded-full flex items-center justify-center bg-anime-dark/50 mt-4 relative shadow-[0_0_20px_#38b6ff] group-hover:scale-105 transition-transform">
                         <div className="absolute inset-0 rounded-full border border-dashed border-anime-blue animate-spin-slow opacity-50" />
                         <span className="font-comic text-5xl text-anime-orange drop-shadow-md">?</span>
                    </div>
                </div>

                <div className="mt-auto mb-6 text-[8px] font-mono text-gray-500 uppercase tracking-widest text-center px-4">
                    Contains Random Loot<br/>
                    <span className="text-anime-orange">SSR Probability UP</span>
                </div>
            </div>

            {/* Side Thickness (3D effect) */}
            <div className="absolute right-0 top-0 h-full w-[15px] bg-slate-800 origin-right rotate-y-90 border-r border-y border-anime-dark translate-x-[-2px]" />
            <div className="absolute left-0 top-0 h-full w-[15px] bg-slate-700 origin-left rotate-y--90 border-l border-y border-anime-dark translate-x-[2px]" />
        </motion.div>
    </div>
  );
};
