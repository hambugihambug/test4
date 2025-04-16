import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';

interface SafetyScoreCardProps {
  score: number; // 0-100 사이의 점수
  title?: string;
  description?: string;
  className?: string;
  animated?: boolean;
}

const scoreEmojis = ['😰', '🙁', '😐', '🙂', '😀'];

export const SafetyScoreCard: React.FC<SafetyScoreCardProps> = ({
  score,
  title = '안전 점수',
  description,
  className,
  animated = true,
}) => {
  const controls = useAnimation();
  
  useEffect(() => {
    if (animated) {
      controls.start({
        scale: [0.8, 1.2, 1],
        opacity: [0, 1],
        transition: { 
          duration: 0.5,
          times: [0, 0.7, 1]
        }
      });
    }
  }, [controls, animated]);

  // 0-100 점수를 0-4 인덱스로 변환 (이모지 배열 인덱스)
  const emojiIndex = Math.min(Math.floor(score / 20), 4);
  
  // 점수에 따라 아이콘과 색상 선택
  const getScoreColor = () => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-blue-500';
    if (score >= 40) return 'text-amber-500';
    if (score >= 20) return 'text-orange-500';
    return 'text-red-500';
  };
  
  const getScoreIcon = () => {
    if (score >= 80) return <ShieldCheck className="h-6 w-6 text-green-500" />;
    if (score >= 60) return <Shield className="h-6 w-6 text-blue-500" />;
    if (score >= 40) return <Shield className="h-6 w-6 text-amber-500" />;
    if (score >= 20) return <ShieldAlert className="h-6 w-6 text-orange-500" />;
    return <AlertTriangle className="h-6 w-6 text-red-500" />;
  };
  
  const getScoreDescription = () => {
    if (!description) {
      if (score >= 80) return '매우 안전한 상태입니다';
      if (score >= 60) return '안전한 상태입니다';
      if (score >= 40) return '주의가 필요합니다';
      if (score >= 20) return '위험 상태입니다';
      return '매우 위험한 상태입니다';
    }
    return description;
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          {getScoreIcon()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-2">
          <motion.span 
            className={cn("text-3xl font-bold", getScoreColor())}
            animate={controls}
          >
            {score}
          </motion.span>
          <motion.span 
            className="text-4xl"
            initial={{ rotate: 0 }}
            animate={{ rotate: animated ? [0, -25, 25, -15, 15, 0] : 0 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            {scoreEmojis[emojiIndex]}
          </motion.span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
          <motion.div 
            className={cn(
              "h-2.5 rounded-full",
              score >= 80 ? "bg-green-500" : 
              score >= 60 ? "bg-blue-500" : 
              score >= 40 ? "bg-amber-500" : 
              score >= 20 ? "bg-orange-500" : "bg-red-500"
            )}
            style={{ width: `${score}%` }}
            initial={{ width: "0%" }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1 }}
          />
        </div>
        
        <p className="text-sm text-gray-600">{getScoreDescription()}</p>
      </CardContent>
    </Card>
  );
};

export default SafetyScoreCard;