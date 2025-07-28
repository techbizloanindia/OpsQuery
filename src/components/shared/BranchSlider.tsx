'use client';

import React, { useState, useEffect } from 'react';
import { FaBuilding, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface Branch {
  branchCode: string;
  branchName: string;
}

interface BranchSliderProps {
  branches: Branch[];
  colorScheme?: 'blue' | 'green';
  autoSlide?: boolean;
  slideDuration?: number;
}

export default function BranchSlider({ 
  branches, 
  colorScheme = 'blue', 
  autoSlide = true, 
  slideDuration = 3000 
}: BranchSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-slide functionality
  useEffect(() => {
    if (!autoSlide || branches.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === branches.length - 1 ? 0 : prevIndex + 1
      );
    }, slideDuration);

    return () => clearInterval(interval);
  }, [branches.length, autoSlide, slideDuration]);

  // Manual navigation
  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? branches.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex === branches.length - 1 ? 0 : currentIndex + 1);
  };

  // Color scheme styles
  const getColorClasses = () => {
    if (colorScheme === 'green') {
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-800',
        icon: 'text-green-600',
        button: 'text-green-600 hover:text-green-800 hover:bg-green-100',
        dot: 'bg-green-600',
        dotInactive: 'bg-green-200'
      };
    }
    return {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: 'text-blue-600',
      button: 'text-blue-600 hover:text-blue-800 hover:bg-blue-100',
      dot: 'bg-blue-600',
      dotInactive: 'bg-blue-200'
    };
  };

  const colors = getColorClasses();

  // If no branches, return null
  if (!branches || branches.length === 0) {
    return null;
  }

  // If only one branch, display it simply
  if (branches.length === 1) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${colors.bg} ${colors.border} border`}>
        <FaBuilding className={`${colors.icon} text-sm`} />
        <div>
          <div className={`text-sm font-semibold ${colors.text}`}>
            {branches[0].branchCode}
          </div>
          <div className={`text-xs ${colors.text} opacity-75`}>
            {branches[0].branchName}
          </div>
        </div>
      </div>
    );
  }

  // Multiple branches - slide format
  return (
    <div className={`relative flex items-center gap-2 px-3 py-2 rounded-lg ${colors.bg} ${colors.border} border min-w-[200px]`}>
      {/* Navigation - Previous */}
      <button
        onClick={goToPrevious}
        className={`p-1 rounded-full ${colors.button} transition-colors`}
        aria-label="Previous branch"
      >
        <FaChevronLeft className="text-xs" />
      </button>

      {/* Current Branch Display */}
      <div className="flex-1 text-center">
        <div className="flex items-center justify-center gap-2">
          <FaBuilding className={`${colors.icon} text-sm`} />
          <div>
            <div className={`text-sm font-semibold ${colors.text}`}>
              {branches[currentIndex].branchCode}
            </div>
            <div className={`text-xs ${colors.text} opacity-75`}>
              {branches[currentIndex].branchName}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation - Next */}
      <button
        onClick={goToNext}
        className={`p-1 rounded-full ${colors.button} transition-colors`}
        aria-label="Next branch"
      >
        <FaChevronRight className="text-xs" />
      </button>

      {/* Slide Indicators */}
      {branches.length > 1 && (
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1">
          {branches.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                index === currentIndex ? colors.dot : colors.dotInactive
              }`}
              aria-label={`Go to branch ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Branch Counter */}
      <div className={`absolute -top-1 -right-1 ${colors.bg} ${colors.border} border rounded-full px-1.5 py-0.5`}>
        <span className={`text-xs font-medium ${colors.text}`}>
          {currentIndex + 1}/{branches.length}
        </span>
      </div>
    </div>
  );
}
