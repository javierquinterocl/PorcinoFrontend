import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link, useNavigate } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react"
import AuthLayout from "@/components/AuthLayout"
import AuthHeader from "@/components/AuthHeader"
import AuthCard from "@/components/AuthCard"
import { useAuth } from "@/context/AuthContext"


export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)

  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log("Formulario enviado - Iniciando proceso de registro")
    
    // Limpiar estado anterior
    setError("")
    setIsLoading(true)
    
    try {
      // Validaciones básicas
      if (!firstName || !lastName || !email || !password || !confirmPassword) {
        throw new Error("Los campos nombres, apellidos, email y contraseña son obligatorios")
      }
      
      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new Error("El formato del correo electrónico no es válido")
      }
      
      // Validar longitud de contraseña
      if (password.length < 6) {
        throw new Error("La contraseña debe tener al menos 6 caracteres")
      }
      
      // Validar que las contraseñas coincidan
      if (password !== confirmPassword) {
        throw new Error("Las contraseñas no coinciden")
      }
      
      // Preparar datos según la estructura del backend
      const userData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || "", 
        email: email.toLowerCase().trim(),
        password: password
      }
      
      console.log("Datos preparados para enviar al backend:", {
        ...userData,
        password: "******"
      })
      
      console.log("Enviando solicitud de registro...")
      const response = await registerUser(userData)
      
      console.log("Respuesta del servidor:", response)
      
      console.log("¡Registro exitoso!")
      setRegistrationSuccess(true)
      
      // Limpiar el formulario
      setFirstName("")
      setLastName("")
      setPhone("")
      setEmail("")
      setPassword("")
      setConfirmPassword("")
      
      // Redirigir al login después de mostrar el mensaje
      setTimeout(() => {
        console.log("Redirigiendo a login...")
        navigate("/login", { replace: true })
      }, 2000)
      
    } catch (error) {
      console.error("Error en el proceso de registro:", error)
      
      if (error?.response) {
        console.error("Detalles del error del servidor:", {
          status: error.response.status,
          data: error.response.data
        });
        
        // Si es un error personalizado de nuestro servicio de API
        if (error.message && (
          error.message.includes('correo electrónico') ||
          error.message.includes('documento') ||
          error.message.includes('código')
        )) {
          setError(error.message);
        } else {
          // Otros tipos de errores del servidor
          switch (error.response.status) {
            case 400:
              setError("Datos de registro inválidos. Por favor verifica la información.")
              break;
            case 409:
              setError("El usuario ya existe. Por favor intenta con otros datos (email, cédula o código).")
              break;
            case 500:
              if (error.response.data?.message?.includes('llave duplicad')) {
                setError("Ya existe un usuario con algunos de los datos proporcionados. Por favor verifica el correo, código o número de documento.");
              } else {
                setError("Error interno del servidor. Por favor intenta más tarde.")
              }
              break;
            default:
              setError(error.response.data.message || "Error en el registro")
          }
        }
      } else if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("Ha ocurrido un error inesperado durante el registro")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <AuthCard>
        <AuthHeader 
          title="Crear una cuenta" 
          subtitle="Completa los datos para registrarte en Granme"
        />

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}
        
        {registrationSuccess && (
          <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-700">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              ¡Registro exitoso! Redirigiendo a la página de inicio de sesión...
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="text-sm font-semibold text-[#1a2e02] mb-2 block">
                Nombres
              </Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ingrese sus nombres"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b7c45] focus:border-transparent transition-all duration-200"
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-sm font-semibold text-[#1a2e02] mb-2 block">
                Apellidos
              </Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ingrese sus apellidos"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b7c45] focus:border-transparent transition-all duration-200"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="telefono" className="text-sm font-semibold text-[#1a2e02] mb-2 block">
              Teléfono (opcional)
            </Label>
            <Input
              id="telefono"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ingrese su teléfono"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b7c45] focus:border-transparent transition-all duration-200"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-semibold text-[#1a2e02] mb-2 block">
              Correo electrónico
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ingrese su correo electrónico"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b7c45] focus:border-transparent transition-all duration-200"
              required
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-sm font-semibold text-[#1a2e02] mb-2 block">
              Contraseña
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingrese su contraseña"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b7c45] focus:border-transparent transition-all duration-200"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="text-sm font-semibold text-[#1a2e02] mb-2 block">
              Confirmar contraseña
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme su contraseña"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b7c45] focus:border-transparent transition-all duration-200"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isLoading || registrationSuccess} 
            className="w-full bg-[#6b7c45] hover:bg-[#5a6b35] text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {isLoading ? "REGISTRANDO..." : registrationSuccess ? "REGISTRO EXITOSO" : "REGISTRARSE"}
          </Button>

          <div className="mt-6 text-center text-sm">
            <span className="text-[#4a5c2a]">¿Ya tienes cuenta? </span>
            <Link to="/login" className="font-semibold text-[#6b7c45] hover:text-[#5a6b35] hover:underline transition-colors">
              Ingresa acá
            </Link>
          </div>
        </form>
      </AuthCard>
    </AuthLayout>
  )
}

