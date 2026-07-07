'use client';

import React from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  customSrc?: string;
}

export function Logo({ className = '', size = 'md', showText = true, customSrc }: LogoProps) {
  const sizes = { sm: 40, md: 56, lg: 120 };
  const px = sizes[size];
  const textSizes = { sm: 'text-sm', md: 'text-base', lg: 'text-2xl' };
  const subSizes = { sm: 'text-[10px]', md: 'text-xs', lg: 'text-sm' };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex-shrink-0" style={{ width: px, height: px }}>
        <Image
          src={customSrc || '/images/logo.png'}
          alt="Spectra Solar"
          width={px}
          height={px}
          className="rounded-xl object-contain"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `<div class="w-full h-full rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold shadow-sm" style="font-size:${px * 0.45}px">S</div>`;
            }
          }}
        />
      </div>
      {showText && (
        <div className="min-w-0">
          <h1 className={`${textSizes[size]} font-bold text-gray-900 dark:text-gray-100 truncate leading-tight`}>Spectra Solar</h1>
          <p className={`${subSizes[size]} text-gray-500 dark:text-gray-400 truncate leading-tight`}>CRM Platform</p>
        </div>
      )}
    </div>
  );
}
