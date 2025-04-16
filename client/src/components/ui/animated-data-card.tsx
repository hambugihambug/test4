import React, { useEffect } from 'react';
import { motion, useAnimation, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AnimatedDataCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string | number;
  };
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
  animated?: boolean;
}

export const AnimatedDataCard: React.FC<AnimatedDataCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = 'default',
  className,
  animated = true,
}) => {
  const controls = useAnimation();
  const valueControls = useAnimation();
  
  useEffect(() => {
    if (animated) {
      controls.start({
        y: 0,
        opacity: 1,
        transition: {
          duration: 0.5,
        }
      });
      
      valueControls.start({
        scale: [0.9, 1.1, 1],
        opacity: [0, 1, 1],
        transition: {
          duration: 0.7,
          times: [0, 0.7, 1],
          delay: 0.2
        }
      });
    }
  }, [controls, valueControls, animated]);

  const getColorClass = () => {
    switch (color) {
      case 'primary': return 'bg-primary/10 text-primary';
      case 'success': return 'bg-green-50 text-green-700';
      case 'warning': return 'bg-amber-50 text-amber-700';
      case 'danger': return 'bg-red-50 text-red-700';
      case 'info': return 'bg-blue-50 text-blue-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };
  
  const getTrendIcon = () => {
    if (!trend) return null;
    
    const commonClassNames = "ml-2 inline-flex items-center text-xs font-medium";
    
    if (trend.direction === 'up') {
      return (
        <span className={`${commonClassNames} text-green-600`}>
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          {trend.value}
        </span>
      );
    } else if (trend.direction === 'down') {
      return (
        <span className={`${commonClassNames} text-red-600`}>
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          {trend.value}
        </span>
      );
    } else {
      return (
        <span className={`${commonClassNames} text-gray-600`}>
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7 10a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          {trend.value}
        </span>
      );
    }
  };

  return (
    <motion.div
      initial={animated ? { y: 20, opacity: 0 } : false}
      animate={controls}
      className={className}
    >
      <Card className={cn("overflow-hidden border")}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-md font-medium">{title}</CardTitle>
            {icon && (
              <motion.div
                initial={animated ? { scale: 0.5, opacity: 0 } : false}
                animate={animated ? { scale: 1, opacity: 1 } : false}
                transition={{ duration: 0.5 }}
                className={cn(
                  "p-2 rounded-full",
                  getColorClass()
                )}
              >
                {icon}
              </motion.div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div>
            <motion.div 
              className="flex items-center"
              animate={valueControls}
            >
              <span className="text-2xl font-bold">{value}</span>
              {getTrendIcon()}
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AnimatedDataCard;