import { useState, useEffect } from 'react';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { Footer } from './footer';

export function DashboardLayout({ children }) {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Detectar tamaño de pantalla para controlar visibilidad del sidebar en móviles
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header toggleSidebar={toggleSidebar} />
      
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Sidebar - ahora maneja su propia visibilidad */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        {/* Contenido principal con scroll independiente */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <main className="flex-1 bg-gray-50 overflow-y-auto">
            <div className="w-full max-w-[1400px] mx-auto px-4 py-4 md:py-6">
              {children}
            </div>
          </main>
          
          <Footer />
        </div>
      </div>
    </div>
  );
}