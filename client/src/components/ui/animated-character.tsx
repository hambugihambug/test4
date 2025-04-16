import React, { useEffect } from 'react';
import { motion, useAnimation, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedCharacterProps {
  character: string; // 표시할 이모티콘 문자
  state: 'idle' | 'happy' | 'sad' | 'alert'; // 캐릭터 상태
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animated?: boolean;
  title?: string;
  description?: string;
}

export const AnimatedCharacter: React.FC<AnimatedCharacterProps> = ({
  character,
  state = 'idle',
  size = 'md',
  className,
  animated = true,
  title,
  description,
}) => {
  const controls = useAnimation();
  
  useEffect(() => {
    if (animated) {
      if (state === 'idle') {
        controls.start({
          y: [0, -5, 0],
          transition: {
            repeat: Infinity,
            repeatType: 'reverse',
            duration: 2,
          }
        });
      } else if (state === 'happy') {
        controls.start({
          rotate: [0, 10, -10, 10, 0],
          scale: [1, 1.1, 1],
          transition: {
            rotate: {
              repeat: Infinity,
              repeatType: 'reverse',
              duration: 1.5,
            },
            scale: {
              repeat: Infinity,
              repeatType: 'reverse',
              duration: 1,
              delay: 0.5,
            }
          }
        });
      } else if (state === 'sad') {
        controls.start({
          y: [0, 5, 0],
          scale: [1, 0.95, 1],
          transition: {
            repeat: Infinity,
            repeatType: 'reverse',
            duration: 2,
          }
        });
      } else if (state === 'alert') {
        controls.start({
          scale: [1, 1.2, 1],
          rotate: [0, 5, -5, 5, 0],
          transition: {
            scale: {
              repeat: Infinity,
              repeatType: 'reverse',
              duration: 0.5,
            },
            rotate: {
              repeat: Infinity,
              repeatType: 'reverse',
              duration: 0.3,
              delay: 0.15,
            }
          }
        });
      }
    }
  }, [controls, animated, state]);

  // 크기에 따른 스타일 정의
  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'text-4xl';
      case 'md': return 'text-6xl';
      case 'lg': return 'text-8xl';
      default: return 'text-6xl';
    }
  };
  
  // 상태에 따른 배경색과 테두리 색상 정의
  const getStateClass = () => {
    switch (state) {
      case 'happy': return 'bg-green-50 border-green-200';
      case 'sad': return 'bg-blue-50 border-blue-200';
      case 'alert': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className={cn(
        "rounded-full p-6 border-2 flex items-center justify-center mb-3",
        getStateClass()
      )}>
        <motion.div
          animate={controls}
          className={cn(
            "select-none",
            getSizeClass()
          )}
        >
          {character}
        </motion.div>
      </div>
      
      {title && (
        <h3 className="text-lg font-medium text-center">{title}</h3>
      )}
      
      {description && (
        <p className="text-sm text-gray-600 text-center mt-1">{description}</p>
      )}
    </div>
  );
};

export default AnimatedCharacter;