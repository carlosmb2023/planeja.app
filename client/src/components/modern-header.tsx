import React from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Link } from 'wouter';
import { ThemeToggle } from './theme-toggle';
import { NotificationBell } from './notification-system';

interface ModernHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  actionButton?: React.ReactNode;
  gradient?: boolean;
}

export default function ModernHeader({ 
  title, 
  subtitle, 
  showBackButton = true, 
  actionButton,
  gradient = true 
}: ModernHeaderProps) {
  return (
    <header className={`
      ${gradient ? 'bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700' : 'bg-white/80 backdrop-blur-xl border-b border-gray-200/50'}
      sticky top-0 z-50 shadow-lg
    `}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <Link href="/" className={`
                p-2 -ml-2 rounded-lg transition-all duration-200
                ${gradient 
                  ? 'text-white/80 hover:text-white hover:bg-white/10' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }
              `}>
                <ArrowLeft className="h-5 w-5" />
              </Link>
            )}
            
            <div className="flex items-center space-x-3">
              <div className={`
                p-2 rounded-xl
                ${gradient 
                  ? 'bg-white/20 backdrop-blur-sm' 
                  : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                }
              `}>
                <Sparkles className={`h-6 w-6 ${gradient ? 'text-white' : 'text-white'}`} />
              </div>
              
              <div>
                <h1 className={`
                  font-display text-xl font-bold tracking-tight
                  ${gradient ? 'text-white' : 'text-gray-900'}
                `}>
                  {title}
                </h1>
                {subtitle && (
                  <p className={`
                    text-sm font-medium
                    ${gradient ? 'text-white/80' : 'text-gray-500'}
                  `}>
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <NotificationBell />
            <ThemeToggle />
            {actionButton}
          </div>
        </div>
      </div>
    </header>
  );
}
