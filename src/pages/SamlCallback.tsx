import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/timesheet';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';

export const SamlCallback = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { handleLogin } = useApp();
  const { toast } = useToast();

  useEffect(() => {
    const processSamlCallback = async () => {
      try {
        setLoading(true);
        
        // В реальном приложении здесь был бы код для валидации SAML response
        // и получения данных пользователя из ответа SAML IdP
        
        // Получаем параметры из URL
        const urlParams = new URLSearchParams(window.location.search);
        const samlResponse = urlParams.get('SAMLResponse');
        const relayState = urlParams.get('RelayState');
        
        if (!samlResponse) {
          throw new Error('SAML Response не найден в URL');
        }
        
        // Получаем сохраненную информацию о запросе
        const samlRequestData = sessionStorage.getItem('saml_request');
        if (!samlRequestData) {
          throw new Error('Информация о SAML запросе не найдена');
        }
        
        const samlRequest = JSON.parse(samlRequestData);
        
        console.log('Received SAML Response, processing...');
        
        // В реальном приложении здесь бы происходила проверка подписи,
        // расшифровка и обработка SAML response на стороне сервера
        
        // Для демонстрации предположим успешную аутентификацию
        // и создадим объект пользователя на основе декодированных данных
        
        // Эмуляция данных, полученных из SAML Response
        const mockUserData = {
          id: '1',
          login: 'saml_user',
          name: 'SAML User',
          type: 'user',
          password: '', // Не требуется для SAML аутентификации
          first_week: '2024-01-01',
          first_custom_week_id: null,
          email: 'saml_user@example.com',
          job_position: 'Инженер',
          description: 'Пользователь SAML',
          department_id: '1',
          deletion_mark: false,
          user_head_id: null,
          hidden: false,
        };
        
        // Создаем объект пользователя с правильными типами
        const appUser: User = {
          id: mockUserData.id,
          username: mockUserData.login,
          name: mockUserData.name,
          role: mockUserData.type as 'admin' | 'user' | 'manager',
          password: '',
          firstWeek: mockUserData.first_week,
          firstCustomWeekId: mockUserData.first_custom_week_id,
          login: mockUserData.login,
          type: mockUserData.type,
          email: mockUserData.email,
          job_position: mockUserData.job_position,
          description: mockUserData.description,
          department_id: mockUserData.department_id,
          departmentId: mockUserData.department_id,
          deletion_mark: mockUserData.deletion_mark,
          user_head_id: mockUserData.user_head_id,
          hidden: mockUserData.hidden,
        };
        
        // Сохраняем в localStorage
        localStorage.setItem('userSession', JSON.stringify(appUser));
        
        // Обновляем состояние приложения
        await handleLogin(appUser);
        
        // Очищаем информацию о запросе
        sessionStorage.removeItem('saml_request');
        
        // Показываем сообщение об успешной аутентификации
        toast({
          title: "SAML Аутентификация успешна",
          description: `Вы вошли как ${appUser.name}`,
        });
        
        // Перенаправляем на главную страницу
        navigate('/');
      } catch (err) {
        console.error('Ошибка обработки SAML callback:', err);
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
        
        toast({
          title: "Ошибка аутентификации",
          description: err instanceof Error ? err.message : 'Не удалось аутентифицироваться через SAML',
          variant: "destructive",
        });
        
        // Перенаправляем на страницу входа после задержки
        setTimeout(() => navigate('/login'), 3000);
      } finally {
        setLoading(false);
      }
    };
    
    processSamlCallback();
  }, [navigate, handleLogin, toast]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {loading ? (
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Обработка аутентификации...</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-500">
          <h2 className="text-xl font-semibold mb-4">Ошибка аутентификации</h2>
          <p>{error}</p>
          <p className="mt-4">Перенаправление на страницу входа...</p>
        </div>
      ) : (
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Аутентификация успешна!</h2>
          <p>Перенаправление в приложение...</p>
        </div>
      )}
    </div>
  );
};

export default SamlCallback;
