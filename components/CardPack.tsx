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
    // 1. Shake
    await controls.start({
      x: [0, -5, 5, -5, 5, 0],
      rotateZ: [0, -2, 2, -2, 2, 0],
      scale: [1, 1.05, 0.95, 1.1],
      transition: { duration: 0.5 }
    });
    // 2. Rip trigger
    setRipped(true);
  };

  return (
    <div className="relative w-64 h-96 perspective-1000 group select-none">
        {/* Comic "RIPPED" Text Effect */}
        {ripped && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.5, rotate: -15 }}
                animate={{ opacity: 1, scale: 1.5, rotate: 0 }}
                className="absolute top-0 left-[-50px] z-50 font-comic text-6xl text-epe-yellow text-shadow-comic"
                style={{ textShadow: '4px 4px 0 #000' }}
            >
                TEAR!!
            </motion.div>
        )}

        {/* Glow/Aura */}
        <motion.div 
            animate={{ 
                rotate: [0, 360],
                scale: [1, 1.2, 1]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-50px] bg-gradient-to-r from-epe-neon/30 to-epe-pink/30 rounded-full blur-3xl -z-10"
        />

        {/* 3D Container */}
        <motion.div
            animate={controls}
            whileHover={!disabled && !isOpening ? { scale: 1.05, rotateY: 10, rotateX: 5 } : {}}
            className={`w-full h-full relative transform-style-3d transition-transform duration-300 ${disabled ? 'grayscale brightness-50' : ''}`}
            onClick={!disabled && !isOpening ? onClick : undefined}
            style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
        >
            {/* --- TOP PART OF PACK (The part that rips off) --- */}
            <motion.div 
                className="absolute top-0 left-0 w-full h-[25%] z-20 transform-style-3d origin-bottom"
                animate={ripped ? { y: -200, rotateZ: 45, opacity: 0 } : {}}
                transition={{ duration: 0.4, ease: "easeIn" }}
            >
                {/* Front Top */}
                <div className="absolute inset-0 bg-gradient-to-br from-epe-neon via-blue-600 to-purple-700 border-2 border-black clip-jagged-bottom flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-30"></div>
                    <div className="text-white font-tech text-xs tracking-[0.3em] uppercase absolute top-2">EPE GACHA</div>
                    <div className="w-full h-full bg-white/10 absolute skew-y-12 top-[-50%]"></div>
                </div>
                {/* Back Top (Darker) */}
                <div className="absolute inset-0 bg-blue-900 translate-z-[-20px] rounded-t-lg clip-jagged-bottom"></div>
            </motion.div>

            {/* --- FLASH EFFECT INSIDE --- */}
            <motion.div 
                 animate={ripped ? { opacity: [0, 1, 0], scale: [0.8, 2] } : { opacity: 0 }}
                 transition={{ duration: 0.3, delay: 0.1 }}
                 className="absolute top-[20%] left-0 w-full h-[20%] bg-white blur-xl z-10"
            />

            {/* --- BOTTOM PART OF PACK (Body) --- */}
            <div className="absolute bottom-0 left-0 w-full h-[80%] z-10 transform-style-3d">
                
                {/* Front Face */}
                <div className="absolute inset-0 bg-gradient-to-br from-epe-neon via-blue-600 to-purple-700 border-x-2 border-b-2 border-black rounded-b-xl overflow-hidden backface-hidden flex flex-col items-center justify-center shadow-comic">
                     {/* Manga Speed Lines Overlay */}
                    <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,#000_2px,#000_4px)]"></div>
                    
                    {/* Art Content */}
                    <div className="relative z-10 text-center transform -skew-x-6">
                        <div className="bg-epe-yellow text-black font-comic text-xl px-2 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] inline-block mb-2 rotate-2">
                            SUPER RARE!
                        </div>
                        <h1 className="text-7xl font-comic text-white drop-shadow-[4px_4px_0_rgba(0,0,0,1)] stroke-black" style={{ WebkitTextStroke: '2px black' }}>
                            EPE
                        </h1>
                        <h2 className="text-2xl font-tech text-epe-neon mt-[-10px] drop-shadow-md">
                            COLLECTION
                        </h2>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute bottom-4 w-full px-4 flex justify-between items-center text-[10px] font-mono text-white/70">
                        <span>SERIES 01</span>
                        <span>LIMITED EDITION</span>
                    </div>
                </div>

                {/* Back Face */}
                <div className="absolute inset-0 bg-gray-900 border-2 border-black rounded-b-xl backface-hidden rotate-y-180 flex items-center justify-center">
                    <div className="text-gray-500 font-mono text-xs p-4 text-center">
                        <p>EPE OFFICIAL</p>
                        <p className="mt-2">PROBABILITY APPLIES</p>
                    </div>
                </div>

                {/* Side Faces (Thickness) */}
                <div className="absolute left-0 top-0 bottom-0 w-[20px] bg-blue-800 origin-left rotate-y-90 border-y border-l border-black"></div>
                <div className="absolute right-0 top-0 bottom-0 w-[20px] bg-blue-800 origin-right rotate-y--90 border-y border-r border-black"></div>
            </div>
        </motion.div>
    </div>
  );
};