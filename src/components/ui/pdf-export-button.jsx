import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function PdfExportButton({ reportTitle, reportType }: PdfExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const handleExport = () => {
    setIsExporting(true)

    // Simulamos la generación del PDF
    setTimeout(() => {
      setIsExporting(false)

      toast({
        title: "Reporte exportado",
        description: `El reporte "${reportTitle}" ha sido exportado como PDF.`,
        duration: 3000,
      })
    }, 1500)
  }

  return (
    <Button onClick={handleExport} disabled={isExporting}>
      <FileDown className="mr-2 h-4 w-4" />
      {isExporting ? "Exportando..." : "Exportar PDF"}
    </Button>
  )
}

