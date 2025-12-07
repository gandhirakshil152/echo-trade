import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface PriceDisplayProps {
  price: number;
  currency?: string;
  className?: string;
  showFlash?: boolean;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  price,
  currency = 'INR',
  className,
  showFlash = true
}) => {
  const [flashClass, setFlashClass] = useState('');
  const prevPriceRef = useRef<number>(price);

  useEffect(() => {
    if (showFlash && prevPriceRef.current !== price) {
      const diff = price - prevPriceRef.current;
      if (diff > 0) {
        setFlashClass('price-flash-gain');
      } else if (diff < 0) {
        setFlashClass('price-flash-loss');
      }
      
      prevPriceRef.current = price;
      
      const timeout = setTimeout(() => {
        setFlashClass('');
      }, 500);
      
      return () => clearTimeout(timeout);
    }
  }, [price, showFlash]);

  const formatPrice = (value: number) => {
    const symbol = currency === 'INR' ? '₹' : '$';
    return symbol + value.toLocaleString('en-IN', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  return (
    <span className={cn('inline-block rounded px-1 transition-all', flashClass, className)}>
      {formatPrice(price)}
    </span>
  );
};
