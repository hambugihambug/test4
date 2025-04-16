import React, { useEffect } from 'react';
import { motion, useAnimation, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, AlertCircle, AlertTriangle, Clock, X } from 'lucide-react';

interface AnimatedStatusProps {
  status: 'success' | 'warning' | 'error' | 'pending' | 'inactive';
  title: string;
  description?: string;
  className?: string;
  animated?: boolean;
  icon?: React.ReactNode;
}

export const AnimatedStatus: React.FC<AnimatedStatusProps> = ({
  status,
  title,
  description,
  className,
  animated = true,
  icon,
}) => {
  const controls = useAnimation();
  
  useEffect(() => {
    if (animated) {
      if (status === 'warning' || status === 'error') {
        controls.start({
          scale: [1, 1.05, 1],
          transition: {
            repeat: Infinity,
            repeatType: 'reverse',
            duration: status === 'error' ? 0.7 : 1.5,
          }
        });
      } else if (status === 'pending') {
        controls.start({
          rotate: [0, 360],
          transition: {
            repeat: Infinity,
            duration: 2,
            ease: 'linear',
          }
        });
      }
    }
  }, [controls, animated, status]);

  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-amber-50 border-amber-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'pending': return 'bg-blue-50 border-blue-200';
      case 'inactive': return 'bg-gray-50 border-gray-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };
  
  const getTextColor = () => {
    switch (status) {
      case 'success': return 'text-green-700';
      case 'warning': return 'text-amber-700';
      case 'error': return 'text-red-700';
      case 'pending': return 'text-blue-700';
      case 'inactive': return 'text-gray-700';
      default: return 'text-gray-700';
    }
  };
  
  const getStatusIcon = () => {
    if (icon) return icon;
    
    switch (status) {
      case 'success': return <Check className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'error': return <X className="h-5 w-5 text-red-500" />;
      case 'pending': return <Clock className="h-5 w-5 text-blue-500" />;
      case 'inactive': return <AlertCircle className="h-5 w-5 text-gray-500" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'success': return '정상';
      case 'warning': return '주의';
      case 'error': return '위험';
      case 'pending': return '진행 중';
      case 'inactive': return '비활성';
      default: return '알 수 없음';
    }
  };

  return (
    <Card className={cn(getStatusColor(), className)}>
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center space-x-2">
          <motion.div animate={controls}>
            {getStatusIcon()}
          </motion.div>
          <CardTitle className={cn("text-lg", getTextColor())}>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <span className={cn("text-sm font-medium", getTextColor())}>
            상태: {getStatusText()}
          </span>
          {status === 'pending' && (
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
              }}
              className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs"
            >
              진행 중...
            </motion.div>
          )}
        </div>
        {description && (
          <p className="text-sm text-gray-600 mt-2">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default AnimatedStatus;