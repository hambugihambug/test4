import React, { useEffect } from 'react';
import { motion, useAnimation, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedProgressProps {
  value: number; // 0-100 사이의 값
  maxValue: number;
  title: string;
  icon?: React.ReactNode;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animated?: boolean; // 애니메이션 활성화 여부
  type?: 'circle' | 'bar'; // 진행 표시기 타입
}

const circleVariants: Variants = {
  hidden: {
    pathLength: 0,
    opacity: 0,
  },
  visible: (i: number) => {
    const delay = 0.3;
    return {
      pathLength: i,
      opacity: 1,
      transition: {
        pathLength: { delay, type: "spring", duration: 1.5, bounce: 0 },
        opacity: { delay, duration: 0.5 }
      }
    };
  }
};

const textVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 10,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.5, 
      delay: 0.8 
    } 
  }
};

const barVariants: Variants = {
  hidden: { 
    width: '0%', 
    opacity: 0 
  },
  visible: (i: number) => ({
    width: `${i}%`,
    opacity: 1,
    transition: { 
      width: { 
        delay: 0.3, 
        type: "spring", 
        duration: 1.5, 
        bounce: 0 
      },
      opacity: { 
        delay: 0.3, 
        duration: 0.5 
      }
    }
  })
};

export const AnimatedProgress: React.FC<AnimatedProgressProps> = ({
  value,
  maxValue,
  title,
  icon,
  color = 'primary',
  size = 'md',
  className,
  animated = true,
  type = 'circle',
}) => {
  const controls = useAnimation();
  const percentage = Math.min(Math.round((value / maxValue) * 100), 100);
  
  useEffect(() => {
    if (animated) {
      controls.start("visible");
    } else {
      controls.set("visible");
    }
  }, [controls, animated, value]);

  const getColorClass = () => {
    switch (color) {
      case 'primary': return 'text-primary stroke-primary fill-primary';
      case 'success': return 'text-green-500 stroke-green-500 fill-green-500';
      case 'warning': return 'text-amber-500 stroke-amber-500 fill-amber-500';
      case 'danger': return 'text-red-500 stroke-red-500 fill-red-500';
      case 'info': return 'text-blue-500 stroke-blue-500 fill-blue-500';
      default: return 'text-primary stroke-primary fill-primary';
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'sm': return { circle: 'w-24 h-24', bar: 'h-3' };
      case 'md': return { circle: 'w-32 h-32', bar: 'h-4' };
      case 'lg': return { circle: 'w-40 h-40', bar: 'h-6' };
      default: return { circle: 'w-32 h-32', bar: 'h-4' };
    }
  };

  if (type === 'circle') {
    return (
      <div className={cn("flex flex-col items-center", className)}>
        <div className={cn("relative", getSizeClass().circle)}>
          <svg 
            className="w-full h-full" 
            viewBox="0 0 100 100"
          >
            {/* 배경 원 */}
            <circle
              cx="50"
              cy="50"
              r="45"
              className="stroke-gray-200 fill-none"
              strokeWidth="6"
            />
            
            {/* 채워지는 원 */}
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              className={cn("fill-none", getColorClass())}
              strokeWidth="6"
              strokeLinecap="round"
              variants={circleVariants}
              initial="hidden"
              animate={controls}
              custom={percentage / 100}
            />
          </svg>
          
          {/* 가운데 아이콘과 텍스트 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {icon && (
              <div className={cn("mb-1", getColorClass())}>
                {icon}
              </div>
            )}
            <motion.div
              variants={textVariants}
              initial="hidden"
              animate={controls}
              className="flex flex-col items-center"
            >
              <span className={cn("text-2xl font-bold", getColorClass())}>
                {percentage}%
              </span>
              <span className="text-sm text-gray-600">{title}</span>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // Bar 타입
  return (
    <div className={cn("w-full", className)}>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{title}</span>
        <span className={cn("text-sm font-medium", getColorClass())}>
          {percentage}%
        </span>
      </div>
      <div className={cn("w-full bg-gray-200 rounded-full overflow-hidden", getSizeClass().bar)}>
        <motion.div
          className={cn("rounded-full", getColorClass().replace('stroke-', 'bg-').replace('fill-', 'bg-'))}
          variants={barVariants}
          initial="hidden"
          animate={controls}
          custom={percentage}
        />
      </div>
    </div>
  );
};

export default AnimatedProgress;