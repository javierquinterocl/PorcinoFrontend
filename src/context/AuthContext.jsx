import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { userService } from '@/services/api';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar si hay un usuario autenticado al cargar la aplicación
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
          try {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            setIsAuthenticated(true);
          } catch (parseError) {
            console.error('Error parseando datos de usuario:', parseError);
            // Limpiar datos corruptos
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error verificando estado de autenticación:', error);
        // Limpiar datos corruptos
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Funcion para registrar un usuario
  const register = async (userData) => {
    try {
      setIsLoading(true);
      
      const registrationData = {
        firstName: userData.firstName?.trim(),
        lastName: userData.lastName?.trim(),
        email: userData.email?.toLowerCase().trim(),
        phone: userData.phone?.trim() || "",
        password: userData.password
      };
      
      // El servicio register devuelve { user, token }
      const response = await userService.register(registrationData);
      
      // NO autenticar automáticamente - el usuario debe hacer login
      // Solo retornar la respuesta
      console.log('Usuario registrado exitosamente:', response);
      return response;
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Funcion para hacer login
  const login = async (credentials) => {
    try {
      setIsLoading(true);
      
      // El servicio login devuelve { user, token }
      const response = await userService.login({
        email: credentials.email.toLowerCase(),
        password: credentials.password
      });
      
      // Actualizar estado local
      if (response.user && response.token) {
        setUser(response.user);
        setIsAuthenticated(true);
        console.log('Login exitoso', response.user);
      } else {
        throw new Error('No se recibió un token de autenticación válido');
      }
      
      return response;
    } catch (error) {
      console.error('Error en login:', error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('No se pudo iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para hacer logout
  const logout = async () => {
    try {
      // Invalidar token en el servidor
      await userService.logout();
    } catch (error) {
      console.error('Error durante el logout:', error);
    } finally {
      // Limpiar estado local siempre
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Funcion para actualizar perfil del usuario autenticado
  const updateProfile = async (userData) => {
    try {
      setIsLoading(true);
      
      // Validar y limpiar datos de actualización
      const updateData = {
        firstName: userData.firstName?.trim(),
        lastName: userData.lastName?.trim(),
        phone: userData.phone?.trim() || ""
      };
      
      // Llamar al endpoint de perfil
      const response = await userService.updateProfile(updateData);
      
      // Actualizar el usuario en el estado local
      if (user) {
        const updatedUser = {
          ...user,
          firstName: response.first_name,
          first_name: response.first_name,
          lastName: response.last_name,
          last_name: response.last_name,
          phone: response.phone,
          updated_at: response.updated_at
        };
        setUser(updatedUser);
        
        // Actualizar localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      return response;
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Función para actualizar imagen de perfil del usuario autenticado
  const updateProfileImage = async (profileImage) => {
    try {
      setIsLoading(true);
      
      // Llamar al endpoint de actualización de imagen
      const response = await userService.updateProfileImage(profileImage);
      
      // Actualizar el usuario en el estado local
      if (user) {
        const updatedUser = {
          ...user,
          profile_image: response.profile_image,
          profileImage: response.profile_image,
          updated_at: response.updated_at
        };
        setUser(updatedUser);
        
        // Actualizar localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      return response;
    } catch (error) {
      console.error('Error actualizando imagen de perfil:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Función para eliminar imagen de perfil del usuario autenticado
  const deleteProfileImage = async () => {
    try {
      setIsLoading(true);
      
      // Llamar al endpoint de eliminación de imagen
      const response = await userService.deleteProfileImage();
      
      // Actualizar el usuario en el estado local
      if (user) {
        const updatedUser = {
          ...user,
          profile_image: null,
          profileImage: null,
          updated_at: response.updated_at
        };
        setUser(updatedUser);
        
        // Actualizar localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      return response;
    } catch (error) {
      console.error('Error eliminando imagen de perfil:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Funcion para actualizar datos del usuario (admin)
  const updateUser = async (userId, userData) => {
    try {
      setIsLoading(true);
      
      // Validar y limpiar datos de actualización
      const updateData = {
        firstName: userData.firstName?.trim(),
        lastName: userData.lastName?.trim(),
        email: userData.email?.toLowerCase().trim(),
        phone: userData.phone?.trim() || ""
      };
      
      const response = await userService.updateUser(userId, updateData);
      
      // Actualizar el usuario en el estado local si es el usuario actual
      if (user && user.id === userId) {
        const updatedUser = { ...user, ...response };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      return response;
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  
  const getAllUsers = useCallback(async () => {
    try {
      
      const response = await userService.getAllUsers();
      return response;
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      throw error;
    }
  }, []);

  // Funciones adicionales para validaciones
  const checkEmailAvailability = async (email) => {
    try {
      return await userService.checkEmailAvailability(email);
    } catch (error) {
      console.error('Error verificando disponibilidad de email:', error);
      throw error;
    }
  };

  const checkCodeAvailability = async (code) => {
    try {
      return await userService.checkCodeAvailability(code);
    } catch (error) {
      console.error('Error verificando disponibilidad de código:', error);
      throw error;
    }
  };

  const checkIdCardAvailability = async (idCard) => {
    try {
      return await userService.checkIdCardAvailability(idCard);
    } catch (error) {
      console.error('Error verificando disponibilidad de cédula:', error);
      throw error;
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    register,
    login,
    logout,
    updateProfile,
    updateProfileImage,
    deleteProfileImage,
    updateUser,
    getAllUsers,
    checkEmailAvailability,
    checkCodeAvailability,
    checkIdCardAvailability,
    setUser,
    setIsAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

