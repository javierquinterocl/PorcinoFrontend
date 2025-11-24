import { useState, useCallback } from 'react';
import { sowService } from '@/services/api';

/**
 * Hook personalizado para gestionar operaciones CRUD de cerdas
 */
export const useSows = () => {
  const [sows, setSows] = useState([]);
  const [currentSow, setCurrentSow] = useState(null);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Obtener todas las cerdas con filtros opcionales
   */
  const fetchSows = useCallback(async (filters = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await sowService.getAll(filters);
      setSows(data);
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error obteniendo cerdas:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Obtener estadísticas de cerdas
   */
  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await sowService.getStats();
      setStats(data);
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error obteniendo estadísticas:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Obtener una cerda por ID
   */
  const fetchSowById = useCallback(async (id) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await sowService.getById(id);
      setCurrentSow(data);
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error obteniendo cerda:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Obtener una cerda por arete
   */
  const fetchSowByEarTag = useCallback(async (earTag) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await sowService.getByEarTag(earTag);
      setCurrentSow(data);
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error obteniendo cerda por arete:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Crear una nueva cerda
   */
  const createSow = useCallback(async (sowData) => {
    try {
      setIsLoading(true);
      setError(null);
      const newSow = await sowService.create(sowData);
      
      // Actualizar lista local
      setSows(prevSows => [...prevSows, newSow]);
      
      return newSow;
    } catch (err) {
      setError(err.message);
      console.error('Error creando cerda:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Actualizar una cerda completamente
   */
  const updateSow = useCallback(async (id, sowData) => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedSow = await sowService.update(id, sowData);
      
      // Actualizar lista local
      setSows(prevSows => 
        prevSows.map(sow => sow.id === id ? updatedSow : sow)
      );
      
      // Actualizar cerda actual si es la misma
      if (currentSow?.id === id) {
        setCurrentSow(updatedSow);
      }
      
      return updatedSow;
    } catch (err) {
      setError(err.message);
      console.error('Error actualizando cerda:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentSow]);

  /**
   * Actualizar campos específicos de una cerda
   */
  const partialUpdateSow = useCallback(async (id, sowData) => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedSow = await sowService.partialUpdate(id, sowData);
      
      // Actualizar lista local
      setSows(prevSows => 
        prevSows.map(sow => sow.id === id ? updatedSow : sow)
      );
      
      // Actualizar cerda actual si es la misma
      if (currentSow?.id === id) {
        setCurrentSow(updatedSow);
      }
      
      return updatedSow;
    } catch (err) {
      setError(err.message);
      console.error('Error actualizando cerda (parcial):', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentSow]);

  /**
   * Descartar una cerda (soft delete)
   */
  const discardSow = useCallback(async (id) => {
    try {
      setIsLoading(true);
      setError(null);
      const deletedSow = await sowService.softDelete(id);
      
      // Actualizar lista local
      setSows(prevSows => 
        prevSows.map(sow => sow.id === id ? deletedSow : sow)
      );
      
      return deletedSow;
    } catch (err) {
      setError(err.message);
      console.error('Error descartando cerda:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Eliminar una cerda permanentemente
   */
  const deleteSow = useCallback(async (id) => {
    try {
      setIsLoading(true);
      setError(null);
      await sowService.delete(id);
      
      // Remover de lista local
      setSows(prevSows => prevSows.filter(sow => sow.id !== id));
      
      // Limpiar cerda actual si es la misma
      if (currentSow?.id === id) {
        setCurrentSow(null);
      }
      
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error eliminando cerda:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentSow]);

  /**
   * Limpiar cerda actual
   */
  const clearCurrentSow = useCallback(() => {
    setCurrentSow(null);
  }, []);

  /**
   * Limpiar error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Estado
    sows,
    currentSow,
    stats,
    isLoading,
    error,
    
    // Métodos
    fetchSows,
    fetchStats,
    fetchSowById,
    fetchSowByEarTag,
    createSow,
    updateSow,
    partialUpdateSow,
    discardSow,
    deleteSow,
    clearCurrentSow,
    clearError
  };
};

export default useSows;
