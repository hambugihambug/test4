import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedWaveProps {
  color?: string;
  height?: number;
  width?: number;
  speed?: number;
  className?: string;
}

export const AnimatedWave: React.FC<AnimatedWaveProps> = ({
  color = '#319795',
  height = 20,
  width = 100,
  speed = 1,
  className,
}) => {
  const waveVariants = {
    animate: {
      x: [0, -100],
      transition: {
        x: {
          repeat: Infinity,
          repeatType: 'loop',
          duration: 2 / speed,
          ease: 'linear',
        },
      },
    },
  };

  return (
    <div 
      className={cn("overflow-hidden relative", className)} 
      style={{ height: height, width: '100%' }}
    >
      <motion.div
        className="absolute w-full h-full"
        variants={waveVariants}
        animate="animate"
      >
        <svg
          viewBox="0 0 100 20"
          preserveAspectRatio="none"
          style={{ width: width + '%', height: '100%' }}
        >
          <path
            d="M0 10 Q25 0, 50 10 T100 10 V20 H0 Z"
            fill={color}
          />
        </svg>
      </motion.div>
    </div>
  );
};

export default AnimatedWave;