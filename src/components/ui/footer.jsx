export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[#1a2e02] text-white py-3 px-6 flex-shrink-0">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-gray-300">
        <p>&copy; {currentYear} Granme. Todos los derechos reservados.</p>
        <p>Sistema de Gestión de Granjas Porcinas</p>
      </div>
    </footer>
  )
}

