import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ActivityLevelProps {
  level: number; // 1-5 사이의 활동 수준
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animated?: boolean;
}

export const ActivityLevel: React.FC<ActivityLevelProps> = ({
  level,
  size = 'md',
  className,
  animated = true,
}) => {
  // 활동 수준에 따라 색상 결정
  const getColor = (index: number) => {
    if (index < level) {
      switch (level) {
        case 1: return 'bg-blue-500';
        case 2: return 'bg-green-500';
        case 3: return 'bg-yellow-500';
        case 4: return 'bg-orange-500';
        case 5: return 'bg-red-500';
        default: return 'bg-gray-300';
      }
    }
    return 'bg-gray-300';
  };

  // 크기에 따른 스타일 결정
  const getSizeStyles = () => {
    switch (size) {
      case 'sm': return { bar: 'h-2', gap: 'gap-1' };
      case 'md': return { bar: 'h-3', gap: 'gap-1.5' };
      case 'lg': return { bar: 'h-4', gap: 'gap-2' };
      default: return { bar: 'h-3', gap: 'gap-1.5' };
    }
  };

  const barVariants = {
    initial: { height: 0 },
    animate: (i: number) => ({
      height: '100%',
      transition: { 
        duration: 0.4,
        delay: i * 0.1,
        type: 'spring',
        stiffness: 200
      }
    })
  };

  const { bar: barHeight, gap } = getSizeStyles();

  return (
    <div className={cn("flex items-end", gap, className)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div 
          key={i} 
          className="relative flex-1 bg-gray-200 rounded overflow-hidden"
          style={{ height: `${i * 5 + 10}px` }}
        >
          <motion.div
            className={cn("absolute bottom-0 w-full rounded", getColor(i))}
            variants={animated ? barVariants : undefined}
            initial={animated ? "initial" : false}
            animate={animated ? "animate" : undefined}
            custom={i}
          />
        </div>
      ))}
    </div>
  );
};

export default ActivityLevel;