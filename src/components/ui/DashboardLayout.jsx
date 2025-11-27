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
    <div className="h-screen grid grid-rows-[auto_1fr] overflow-hidden">
      <Header toggleSidebar={toggleSidebar} />
      
      <div className="grid md:grid-cols-[auto_1fr] overflow-hidden">
        {/* Sidebar - ahora maneja su propia visibilidad */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        {/* Contenido principal con scroll */}
        <div className="grid grid-rows-[1fr_auto] overflow-hidden">
          <main className="overflow-y-auto bg-gray-50">
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