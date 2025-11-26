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
        <main className="flex-1 bg-gray-50 overflow-y-auto min-w-0">
          <div className="min-h-full flex flex-col">
            <div className="flex-1 w-full max-w-[1400px] mx-auto px-4 py-4 md:py-6">
              {children}
            </div>
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
}