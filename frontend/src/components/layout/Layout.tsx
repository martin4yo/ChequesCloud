import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useUIStore } from '../../store/uiStore';
import { cn } from '../../lib/utils';

const Layout: React.FC = () => {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className={cn(
        'flex flex-col flex-1 overflow-hidden transition-all duration-300',
        sidebarOpen ? 'lg:ml-0' : 'lg:ml-0'
      )}>
        <Header />
        
        <main className="flex-1 overflow-auto">
          <div className="h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;