import axios from 'axios';

// Configuración base de la API
const API_URL = import.meta.env.VITE_API_URL;

// Crear instancia de axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar el token JWT a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido o expirado - limpiar todo y redirigir
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      // Solo redirigir si no estamos ya en login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH ENDPOINTS ====================

/**
 * Registrar un nuevo usuario
 * @param {Object} userData - Datos del usuario
 * @param {string} userData.firstName o userData.first_name - Nombre
 * @param {string} userData.lastName o userData.last_name - Apellido
 * @param {string} userData.email - Email
 * @param {string} userData.password - Contraseña
 * @param {string} [userData.phone] - Teléfono (opcional)
 * @returns {Promise<Object>} Respuesta con user y token
 */
export const register = async (userData) => {
  // Transformar nombres de campos del frontend al backend
  const backendData = {
    first_name: userData.firstName || userData.first_name,
    last_name: userData.lastName || userData.last_name,
    email: userData.email,
    password: userData.password,
    phone: userData.phone || ''
  };
  
  const response = await api.post('/auth/register', backendData);
  
  // NO guardar token - el usuario debe hacer login después de registrarse
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  
  return response.data;
};

/**
 * Iniciar sesión
 * @param {Object} credentials - Credenciales de acceso
 * @param {string} credentials.email - Email
 * @param {string} credentials.password - Contraseña
 * @returns {Promise<Object>} Respuesta con user y token
 */
export const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  
  // Guardar token y usuario en localStorage
  if (response.data.success && response.data.data) {
    const { token, user } = response.data.data;
    saveAuthData(token, user);
    return { user, token };
  }
  
  return response.data;
};

/**
 * Obtener información del usuario autenticado
 * @returns {Promise<Object>} Datos del usuario
 */
export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

/**
 * Obtener todos los usuarios (solo admin)
 * @returns {Promise<Array>} Lista de usuarios
 */
export const getAllUsers = async () => {
  const response = await api.get('/users');
  return response.data.data || [];
};

/**
 * Obtener usuario por ID
 * @param {string|number} id - ID del usuario
 * @returns {Promise<Object>} Datos del usuario
 */
export const getUserById = async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data.data;
};

/**
 * Actualizar perfil del usuario autenticado
 * @param {Object} profileData - Datos del perfil (firstName, lastName, phone)
 * @returns {Promise<Object>} Usuario actualizado
 */
export const updateProfile = async (profileData) => {
  const response = await api.put('/auth/profile', profileData);
  return response.data.data;
};

/**
 * Actualizar imagen de perfil del usuario autenticado
 * @param {string} profileImage - Imagen en formato base64
 * @returns {Promise<Object>} Usuario actualizado
 */
export const updateProfileImage = async (profileImage) => {
  const response = await api.put('/auth/profile/image', { profileImage });
  return response.data.data;
};

/**
 * Eliminar imagen de perfil del usuario autenticado
 * @returns {Promise<Object>} Usuario actualizado
 */
export const deleteProfileImage = async () => {
  const response = await api.delete('/auth/profile/image');
  return response.data.data;
};

/**
 * Actualizar usuario (admin)
 * @param {string|number} id - ID del usuario
 * @param {Object} userData - Datos a actualizar
 * @returns {Promise<Object>} Usuario actualizado
 */
export const updateUser = async (id, userData) => {
  const response = await api.put(`/users/${id}`, userData);
  return response.data.data;
};

/**
 * Cambiar contraseña
 * @param {string|number} id - ID del usuario
 * @param {Object} passwords - Contraseñas actual y nueva
 * @returns {Promise<Object>} Respuesta
 */
export const updatePassword = async (id, passwords) => {
  const response = await api.put(`/users/password/${id}`, passwords);
  return response.data;
};

/**
 * Desactivar usuario
 * @param {string|number} id - ID del usuario
 * @returns {Promise<Object>} Usuario desactivado
 */
export const deactivateUser = async (id) => {
  const response = await api.delete(`/users/${id}`);
  return response.data.data;
};

/**
 * Eliminar usuario permanentemente
 * @param {string|number} id - ID del usuario
 * @returns {Promise<Object>} Usuario eliminado
 */
export const deleteUser = async (id) => {
  const response = await api.delete(`/users/${id}/permanent`);
  return response.data.data;
};

/**
 * Cerrar sesión (limpiar datos locales)
 */
export const logout = () => {
  clearAuthData();
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Guardar token y datos de usuario en localStorage
 * @param {string} token - JWT token
 * @param {Object} user - Datos del usuario
 */
export const saveAuthData = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('authToken', token); // Para compatibilidad con AuthContext
  localStorage.setItem('user', JSON.stringify(user));
};

/**
 * Limpiar datos de autenticación
 */
export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('authToken'); // Para compatibilidad con AuthContext
  localStorage.removeItem('user');
};

/**
 * Obtener token del localStorage
 * @returns {string|null} Token JWT
 */
export const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Obtener usuario del localStorage
 * @returns {Object|null} Datos del usuario
 */
export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

/**
 * Verificar si el usuario está autenticado
 * @returns {boolean} True si hay token
 */
export const isAuthenticated = () => {
  return !!getToken();
};

// ==================== USER SERVICE (para compatibilidad) ====================

export const userService = {
  register,
  login,
  logout,
  getMe,
  getAllUsers,
  getUserById,
  updateProfile,
  updateProfileImage,
  deleteProfileImage,
  updateUser,
  updatePassword,
  deactivateUser,
  deleteUser,
  
  // Password reset methods
  requestPasswordReset: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },
  
  validateResetToken: async (token) => {
    const response = await api.post('/auth/validate-reset-token', { token });
    return response.data;
  },
  
  resetPassword: async ({ token, password }) => {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  }
};

// ==================== SOW SERVICE ====================

export const sowService = {
  getAllSows: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const queryString = params.toString();
    const url = queryString ? `/sows?${queryString}` : '/sows';
    const response = await api.get(url);
    return response.data.data || [];
  },
  
  getSowById: async (id) => {
    const response = await api.get(`/sows/${id}`);
    return response.data.data;
  },
  
  getSowByEarTag: async (earTag) => {
    const response = await api.get(`/sows/ear-tag/${earTag}`);
    return response.data.data;
  },
  
  createSow: async (sowData) => {
    const response = await api.post('/sows', sowData);
    return response.data;
  },
  
  updateSow: async (id, sowData) => {
    const response = await api.put(`/sows/${id}`, sowData);
    return response.data.data;
  },
  
  partialUpdateSow: async (id, sowData) => {
    const response = await api.patch(`/sows/${id}`, sowData);
    return response.data;
  },
  
  deleteSow: async (id) => {
    const response = await api.delete(`/sows/${id}`);
    return response.data;
  },
  
  getSowStats: async () => {
    const response = await api.get('/sows/stats');
    return response.data.data;
  },
  
  // Obtener lista simplificada de cerdas (para selects)
  getSowsSimplified: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const queryString = params.toString();
    const url = queryString ? `/sows/simplified?${queryString}` : '/sows/simplified';
    const response = await api.get(url);
    return response.data.data || [];
  },
  
  uploadPhoto: async (file) => {
    const formData = new FormData();
    formData.append('photo', file);
    
    const response = await api.post('/sows/upload-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.data.photo_url;
  }
};

// ==================== BOAR SERVICE ====================

export const boarService = {
  getAllBoars: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const queryString = params.toString();
    const url = queryString ? `/boars?${queryString}` : '/boars';
    const response = await api.get(url);
    return response.data.data || [];
  },
  
  getBoarById: async (id) => {
    const response = await api.get(`/boars/${id}`);
    return response.data.data;
  },
  
  getBoarByEarTag: async (earTag) => {
    const response = await api.get(`/boars/ear-tag/${earTag}`);
    return response.data.data;
  },
  
  createBoar: async (boarData) => {
    const response = await api.post('/boars', boarData);
    return response.data;
  },
  
  updateBoar: async (id, boarData) => {
    const response = await api.put(`/boars/${id}`, boarData);
    return response.data.data;
  },
  
  partialUpdateBoar: async (id, boarData) => {
    const response = await api.patch(`/boars/${id}`, boarData);
    return response.data;
  },
  
  deleteBoar: async (id) => {
    const response = await api.delete(`/boars/${id}`);
    return response.data;
  },
  
  getBoarStats: async () => {
    const response = await api.get('/boars/stats');
    return response.data.data;
  }
};

// ==================== PIG SERVICE (Legacy - mantener compatibilidad) ====================

export const pigService = {
  // Métodos de sows (para cerdas) - spread primero
  ...sowService,
  
  // Métodos de boars (para verracos) - spread después
  ...boarService,
  
  // Métodos personalizados que sobrescriben o extienden los anteriores
  getAllPigs: async (filters = {}) => {
    try {
      const [sows, boars] = await Promise.all([
        sowService.getAllSows(filters),
        boarService.getAllBoars(filters)
      ]);
      // Combinar y normalizar para compatibilidad con el código existente
      const allPigs = [
        ...sows.map(sow => ({
          ...sow,
          gender: 'FEMALE',
          pigType: 'REPRODUCTORA',
          pigId: sow.ear_tag || sow.id,
          name: sow.alias || sow.ear_tag,
          id: sow.id
        })),
        ...boars.map(boar => ({
          ...boar,
          gender: 'MALE',
          pigType: 'REPRODUCTOR',
          pigId: boar.ear_tag || boar.id,
          name: boar.name || boar.ear_tag,
          id: boar.id
        }))
      ];
      return allPigs;
    } catch (error) {
      console.error('Error obteniendo todos los cerdos:', error);
      throw error;
    }
  },
  
  getPigById: async (id) => {
    try {
      // Intentar primero como cerda
      try {
        const sow = await sowService.getSowById(id);
        return {
          ...sow,
          gender: 'FEMALE',
          pigType: 'REPRODUCTORA',
          pigId: sow.ear_tag || sow.id,
          name: sow.alias || sow.ear_tag,
          id: sow.id
        };
      } catch (sowError) {
        // Si no es cerda, intentar como verraco
        const boar = await boarService.getBoarById(id);
        return {
          ...boar,
          gender: 'MALE',
          pigType: 'REPRODUCTOR',
          pigId: boar.ear_tag || boar.id,
          name: boar.name || boar.ear_tag,
          id: boar.id
        };
      }
    } catch (error) {
      console.error('Error obteniendo cerdo por ID:', error);
      throw error;
    }
  },
  
  // Métodos adicionales para compatibilidad con código existente
  addReproductiveRecord: async (sowId, recordData) => {
    // Este método debería crear un registro reproductivo
    // Por ahora, redirigimos a un endpoint de gestación o servicio
    const response = await api.post(`/sows/${sowId}/reproductive-records`, recordData);
    return response.data;
  },
  
  updateReproductiveRecord: async (sowId, recordId, recordData) => {
    const response = await api.put(`/sows/${sowId}/reproductive-records/${recordId}`, recordData);
    return response.data;
  },
  
  deleteReproductiveRecord: async (sowId, recordId) => {
    const response = await api.delete(`/sows/${sowId}/reproductive-records/${recordId}`);
    return response.data;
  }
};

// ==================== HEAT SERVICE ====================

export const heatService = {
  // Obtener todos los celos
  getAllHeats: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const queryString = params.toString();
    const url = queryString ? `/heats?${queryString}` : '/heats';
    const response = await api.get(url);
    return response.data.data || [];
  },
  
  // Obtener celo por ID
  getHeatById: async (id) => {
    const response = await api.get(`/heats/${id}`);
    return response.data.data;
  },
  
  // Obtener celos de una cerda
  getHeatsBySowId: async (sowId) => {
    const response = await api.get(`/heats/sow/${sowId}`);
    return response.data.data || [];
  },
  
  // Obtener último celo de una cerda
  getLastHeatBySowId: async (sowId) => {
    const response = await api.get(`/heats/sow/${sowId}/last`);
    return response.data.data;
  },
  
  // Obtener celos pendientes de servicio
  getPendingHeats: async () => {
    const response = await api.get('/heats/pending');
    return response.data.data || [];
  },
  
  // Obtener estadísticas de celos
  getHeatStats: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const queryString = params.toString();
    const url = queryString ? `/heats/stats?${queryString}` : '/heats/stats';
    const response = await api.get(url);
    return response.data.data;
  },
  
  // Crear nuevo celo
  createHeat: async (heatData) => {
    const response = await api.post('/heats', heatData);
    return response.data;
  },
  
  // Actualizar celo completo
  updateHeat: async (id, heatData) => {
    const response = await api.put(`/heats/${id}`, heatData);
    return response.data.data;
  },
  
  // Actualizar campos específicos del celo
  partialUpdateHeat: async (id, heatData) => {
    const response = await api.patch(`/heats/${id}`, heatData);
    return response.data;
  },
  
  // Actualizar solo el estado del celo
  updateHeatStatus: async (id, status, notes = null) => {
    const response = await api.patch(`/heats/${id}/status`, { status, notes });
    return response.data;
  },
  
  // Eliminar celo
  deleteHeat: async (id) => {
    const response = await api.delete(`/heats/${id}`);
    return response.data;
  }
};

// ==================== SERVICE SERVICE ====================

export const serviceService = {
  // Obtener todos los servicios
  getAllServices: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const queryString = params.toString();
    const url = queryString ? `/services?${queryString}` : '/services';
    const response = await api.get(url);
    return response.data.data || [];
  },
  
  // Obtener un servicio por ID
  getServiceById: async (id) => {
    const response = await api.get(`/services/${id}`);
    return response.data.data;
  },
  
  // Obtener servicios de una cerda
  getServicesBySow: async (sowId) => {
    const response = await api.get(`/services/sow/${sowId}`);
    return response.data.data || [];
  },
  
  // Obtener servicios de un celo
  getServicesByHeat: async (heatId) => {
    const response = await api.get(`/services/heat/${heatId}`);
    return response.data.data || [];
  },
  
  // Obtener estadísticas de servicios
  getServiceStats: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const queryString = params.toString();
    const url = queryString ? `/services/stats?${queryString}` : '/services/stats';
    const response = await api.get(url);
    return response.data.data;
  },
  
  // Crear nuevo servicio
  createService: async (serviceData) => {
    const response = await api.post('/services', serviceData);
    return response.data;
  },
  
  // Actualizar servicio
  updateService: async (id, serviceData) => {
    const response = await api.put(`/services/${id}`, serviceData);
    return response.data.data;
  },
  
  // Eliminar servicio
  deleteService: async (id) => {
    const response = await api.delete(`/services/${id}`);
    return response.data;
  }
};

// ==================== PREGNANCY SERVICE ====================

export const pregnancyService = {
  // Obtener todas las gestaciones
  getAllPregnancies: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const queryString = params.toString();
    const url = queryString ? `/pregnancies?${queryString}` : '/pregnancies';
    const response = await api.get(url);
    return response.data.data || [];
  },
  
  // Obtener gestación por ID
  getPregnancyById: async (id) => {
    const response = await api.get(`/pregnancies/${id}`);
    return response.data.data;
  },
  
  // Obtener gestaciones de una cerda
  getPregnanciesBySowId: async (sowId) => {
    const response = await api.get(`/pregnancies/sow/${sowId}`);
    return response.data.data || [];
  },
  
  // Obtener gestación activa de una cerda
  getActivePregnancyBySowId: async (sowId) => {
    const response = await api.get(`/pregnancies/sow/${sowId}/active`);
    return response.data.data;
  },
  
  // Obtener gestaciones próximas a parto
  getUpcomingPregnancies: async (daysAhead = 7) => {
    const response = await api.get(`/pregnancies/upcoming?days=${daysAhead}`);
    return response.data.data || [];
  },
  
  // Obtener gestaciones vencidas
  getOverduePregnancies: async () => {
    const response = await api.get('/pregnancies/overdue');
    return response.data.data || [];
  },
  
  // Obtener gestaciones pendientes de confirmación
  getPendingConfirmation: async () => {
    const response = await api.get('/pregnancies/pending-confirmation');
    return response.data.data || [];
  },
  
  // Obtener estadísticas de gestaciones
  getPregnancyStats: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const queryString = params.toString();
    const url = queryString ? `/pregnancies/stats?${queryString}` : '/pregnancies/stats';
    const response = await api.get(url);
    return response.data.data;
  },
  
  // Crear nueva gestación
  createPregnancy: async (pregnancyData) => {
    const response = await api.post('/pregnancies', pregnancyData);
    return response.data;
  },
  
  // Actualizar gestación completa
  updatePregnancy: async (id, pregnancyData) => {
    const response = await api.put(`/pregnancies/${id}`, pregnancyData);
    return response.data.data;
  },
  
  // Actualizar campos específicos de la gestación
  partialUpdatePregnancy: async (id, pregnancyData) => {
    const response = await api.patch(`/pregnancies/${id}`, pregnancyData);
    return response.data;
  },
  
  // Actualizar solo el estado de la gestación
  updatePregnancyStatus: async (id, status, notes = null) => {
    const response = await api.patch(`/pregnancies/${id}/status`, { status, notes });
    return response.data;
  },
  
  // Confirmar gestación
  confirmPregnancy: async (id, confirmationData) => {
    const response = await api.patch(`/pregnancies/${id}/confirm`, confirmationData);
    return response.data;
  },
  
  // Eliminar gestación
  deletePregnancy: async (id) => {
    const response = await api.delete(`/pregnancies/${id}`);
    return response.data;
  }
};

export const supplierService = {
  // Métodos relacionados con proveedores
};

export const productService = {
  // Métodos relacionados con productos
};

export const productOutputService = {
  // Métodos relacionados con salidas de productos
};

// ==================== ABORTION SERVICE ====================

export const abortionService = {
  // Obtener todos los abortos
  getAllAbortions: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const queryString = params.toString();
    const url = queryString ? `/abortions?${queryString}` : '/abortions';
    const response = await api.get(url);
    return response.data.data || [];
  },
  
  // Obtener aborto por ID
  getAbortionById: async (id) => {
    const response = await api.get(`/abortions/${id}`);
    return response.data.data;
  },
  
  // Obtener abortos de una cerda
  getAbortionsBySowId: async (sowId) => {
    const response = await api.get(`/abortions/sow/${sowId}`);
    return response.data.data || [];
  },
  
  // Crear nuevo aborto
  createAbortion: async (abortionData) => {
    const response = await api.post('/abortions', abortionData);
    return response.data;
  },
  
  // Actualizar aborto
  updateAbortion: async (id, abortionData) => {
    const response = await api.put(`/abortions/${id}`, abortionData);
    return response.data.data;
  },
  
  // Eliminar aborto
  deleteAbortion: async (id) => {
    const response = await api.delete(`/abortions/${id}`);
    return response.data;
  }
};

export const reproductiveDataService = {
  // Registrar detección de celo
  addHeatDetection: async (sowId, heatData) => {
    const response = await api.post(`/sows/${sowId}/heat-detections`, heatData);
    return response.data;
  },
  
  // Registrar monitoreo de gestación
  addGestationMonitoring: async (sowId, monitoringData) => {
    const response = await api.post(`/sows/${sowId}/gestation-monitoring`, monitoringData);
    return response.data;
  },
  
  // Agregar detalles del parto
  addFarrowingDetails: async (sowId, recordId, farrowingData) => {
    const response = await api.post(`/sows/${sowId}/reproductive-records/${recordId}/farrowing-details`, farrowingData);
    return response.data;
  },
  
  // Registrar aborto
  addAbortion: async (sowId, abortionData) => {
    const response = await api.post(`/sows/${sowId}/abortions`, abortionData);
    return response.data;
  }
};

// ==================== BIRTH SERVICE ====================

export const birthService = {
  // Obtener todos los partos
  getAllBirths: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const queryString = params.toString();
    const url = queryString ? `/births?${queryString}` : '/births';
    const response = await api.get(url);
    return response.data.data || [];
  },
  
  // Obtener parto por ID
  getBirthById: async (id) => {
    const response = await api.get(`/births/${id}`);
    return response.data.data;
  },
  
  // Obtener partos de una cerda
  getBirthsBySowId: async (sowId) => {
    const response = await api.get(`/births/sow/${sowId}`);
    return response.data.data || [];
  },
  
  // Obtener último parto de una cerda
  getLastBirthBySowId: async (sowId) => {
    const response = await api.get(`/births/sow/${sowId}/last`);
    return response.data.data;
  },
  
  // Obtener partos recientes
  getRecentBirths: async (days = 30) => {
    const response = await api.get(`/births/recent?days=${days}`);
    return response.data.data || [];
  },
  
  // Obtener partos problemáticos
  getProblematicBirths: async () => {
    const response = await api.get('/births/problematic');
    return response.data.data || [];
  },
  
  // Obtener estadísticas de partos
  getBirthStats: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const queryString = params.toString();
    const url = queryString ? `/births/stats?${queryString}` : '/births/stats';
    const response = await api.get(url);
    return response.data.data;
  },
  
  // Crear nuevo parto
  createBirth: async (birthData) => {
    const response = await api.post('/births', birthData);
    return response.data;
  },
  
  // Actualizar parto completo
  updateBirth: async (id, birthData) => {
    const response = await api.put(`/births/${id}`, birthData);
    return response.data.data;
  },
  
  // Actualizar campos específicos del parto
  partialUpdateBirth: async (id, birthData) => {
    const response = await api.patch(`/births/${id}`, birthData);
    return response.data;
  },
  
  // Eliminar parto
  deleteBirth: async (id) => {
    const response = await api.delete(`/births/${id}`);
    return response.data;
  }
};

// Servicio de Lechones
export const pigletService = {
  getAllPiglets: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const queryString = params.toString();
    const url = queryString ? `/piglets?${queryString}` : '/piglets';
    const response = await api.get(url);
    return response.data.data || [];
  },
  getPigletById: async (id) => {
    const response = await api.get(`/piglets/${id}`);
    return response.data.data;
  },
  getPigletByEarTag: async (earTag) => {
    const response = await api.get(`/piglets/ear-tag/${earTag}`);
    return response.data.data;
  },
  getPigletsByBirthId: async (birthId) => {
    const response = await api.get(`/piglets/birth/${birthId}`);
    return response.data.data || [];
  },
  getPigletsBySowId: async (sowId) => {
    const response = await api.get(`/piglets/sow/${sowId}`);
    return response.data.data || [];
  },
  getPigletsReadyForWeaning: async (minDays = 21) => {
    const response = await api.get(`/piglets/ready-weaning?min_days=${minDays}`);
    return response.data.data || [];
  },
  getStats: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const queryString = params.toString();
    const url = queryString ? `/piglets/stats?${queryString}` : '/piglets/stats';
    const response = await api.get(url);
    return response.data.data;
  },
  getByBirthId: async (birthId) => {
    const response = await api.get(`/piglets/birth/${birthId}`);
    return response.data.data;
  },
  createPiglet: async (pigletData) => {
    const response = await api.post('/piglets', pigletData);
    return response.data;
  },
  updatePiglet: async (id, pigletData) => {
    const response = await api.put(`/piglets/${id}`, pigletData);
    return response.data.data;
  },
  partialUpdatePiglet: async (id, pigletData) => {
    const response = await api.patch(`/piglets/${id}`, pigletData);
    return response.data.data;
  },
  softDeletePiglet: async (id, reason = 'vendido') => {
    const response = await api.delete(`/piglets/${id}/soft`, { data: { reason } });
    return response.data;
  },
  deletePiglet: async (id) => {
    const response = await api.delete(`/piglets/${id}`);
    return response.data;
  }
};

// Servicio de Eventos del Calendario
export const calendarEventService = {
  getAllEvents: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const queryString = params.toString();
    const url = queryString ? `/calendar-events?${queryString}` : '/calendar-events';
    const response = await api.get(url);
    return response.data.data || [];
  },
  getEventById: async (id) => {
    const response = await api.get(`/calendar-events/${id}`);
    return response.data.data;
  },
  getEventsByMonth: async (year, month) => {
    const response = await api.get(`/calendar-events/month/${year}/${month}`);
    return response.data.data || [];
  },
  getUpcomingEvents: async (days = 7) => {
    const response = await api.get(`/calendar-events/upcoming?days=${days}`);
    return response.data.data || [];
  },
  createEvent: async (eventData) => {
    const response = await api.post('/calendar-events', eventData);
    return response.data;
  },
  updateEvent: async (id, eventData) => {
    const response = await api.put(`/calendar-events/${id}`, eventData);
    return response.data.data;
  },
  deleteEvent: async (id) => {
    const response = await api.delete(`/calendar-events/${id}`);
    return response.data;
  }
};

// ==================== REPORT SERVICE ====================

export const reportService = {
  // Obtener estadísticas de reproductores
  getReproductorsStats: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    
    const queryString = queryParams.toString();
    const url = queryString ? `/reports/reproductors?${queryString}` : '/reports/reproductors';
    const response = await api.get(url);
    return response.data.data;
  },
  
  // Obtener estadísticas de datos reproductivos
  getReproductiveStats: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.sowId) queryParams.append('sowId', params.sowId);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    
    const queryString = queryParams.toString();
    const url = queryString ? `/reports/reproductive?${queryString}` : '/reports/reproductive';
    const response = await api.get(url);
    return response.data.data;
  },
  
  // Obtener KPIs productivos
  getProductivityKPIs: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.sowId) queryParams.append('sowId', params.sowId);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    
    const queryString = queryParams.toString();
    const url = queryString ? `/reports/kpis?${queryString}` : '/reports/kpis';
    const response = await api.get(url);
    return response.data.data;
  },
};

// ==================== NOTIFICATION SERVICE ====================

export const notificationService = {
  // Obtener todas las notificaciones
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.is_read !== undefined) params.append('is_read', filters.is_read);
    if (filters.type) params.append('type', filters.type);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);
    
    const queryString = params.toString();
    const url = queryString ? `/notifications?${queryString}` : '/notifications';
    const response = await api.get(url);
    return response.data.data || [];
  },
  
  // Obtener notificaciones no leídas
  getUnread: async () => {
    const response = await api.get('/notifications/unread');
    return response.data.data || [];
  },
  
  // Obtener contador de no leídas
  getUnreadCount: async () => {
    const response = await api.get('/notifications/count');
    return response.data.data?.count || 0;
  },
  
  // Obtener una notificación por ID
  getById: async (id) => {
    const response = await api.get(`/notifications/${id}`);
    return response.data.data;
  },
  
  // Crear notificación
  create: async (notificationData) => {
    const response = await api.post('/notifications', notificationData);
    return response.data.data;
  },
  
  // Marcar como leída
  markAsRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data.data;
  },
  
  // Marcar todas como leídas
  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data.data;
  },
  
  // Eliminar notificación
  delete: async (id) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data.data;
  },
  
  // Eliminar todas
  deleteAll: async () => {
    const response = await api.delete('/notifications');
    return response.data.data;
  }
};

export default api;
