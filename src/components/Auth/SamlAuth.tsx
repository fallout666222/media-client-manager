
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { User } from '@/types/timesheet';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SamlAuthProps {
  onLogin: (user: User) => void;
}

export const SamlAuth: React.FC<SamlAuthProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Функция для инициирования SAML авторизации
  const handleSamlLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      // Получение параметров SAML из переменных окружения
      const samlIdpUrl = import.meta.env.VITE_SAML_IDP_URL;
      const samlSpEntityId = import.meta.env.VITE_SAML_SP_ENTITY_ID;
      const samlCallbackUrl = import.meta.env.VITE_SAML_CALLBACK_URL || 
                            `${window.location.origin}/auth/saml-callback`;

      // Проверка наличия необходимых параметров
      if (!samlIdpUrl) {
        throw new Error('saml_not_configured');
      }

      // Создание запроса на авторизацию
      // В реальном приложении это должно быть реализовано на стороне сервера 
      // с помощью библиотеки для SAML, например passport-saml в Node.js
      // Здесь мы просто имитируем перенаправление на IdP
      
      console.log('Initiating SAML authentication...');
      
      // Получаем текущее время для создания ID запроса
      const requestId = `saml-${Date.now()}`;
      
      // Сохраняем информацию о запросе в sessionStorage
      sessionStorage.setItem('saml_request', JSON.stringify({
        id: requestId,
        timestamp: Date.now(),
        callbackUrl: samlCallbackUrl
      }));
      
      // Строим URL для перенаправления на IdP
      // Предполагается, что сервер IdP ожидает GET-запрос
      // В реальности SAML AuthnRequest намного сложнее
      const samlRequest = btoa(`<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" 
                                ID="${requestId}" 
                                Version="2.0" 
                                IssueInstant="${new Date().toISOString()}" 
                                Destination="${samlIdpUrl}" 
                                AssertionConsumerServiceURL="${samlCallbackUrl}" 
                                ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
                                <saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">${samlSpEntityId}</saml:Issuer>
                                </samlp:AuthnRequest>`);
      
      // Перенаправляем пользователя на IdP
      const redirectUrl = `${samlIdpUrl}?SAMLRequest=${encodeURIComponent(samlRequest)}&RelayState=${encodeURIComponent(window.location.origin)}`;
      
      console.log('Redirecting to SAML IdP:', redirectUrl);
      window.location.href = redirectUrl;
    } catch (error) {
      console.error('SAML login error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'unknown_error';
      
      // Устанавливаем соответствующее сообщение об ошибке
      switch(errorMessage) {
        case 'saml_not_configured':
          setError('SAML не настроен. Пожалуйста, обратитесь к администратору системы.');
          break;
        case 'idp_connection_error':
          setError('Не удалось подключиться к серверу SAML IdP. Проверьте сетевое подключение и доступность сервера.');
          break;
        case 'user_not_found':
          setError('Пользователь не найден в системе.');
          break;
        case 'insufficient_permissions':
          setError('Недостаточно прав для входа в систему. Обратитесь к администратору.');
          break;
        default:
          setError('Произошла неизвестная ошибка при авторизации через SAML. Пожалуйста, попробуйте позже или используйте другой метод входа.');
      }
      
      toast({
        title: "Ошибка SAML аутентификации",
        description: "Возникла проблема с единым входом. Пожалуйста, попробуйте еще раз или используйте другой метод входа.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <InfoIcon className="h-4 w-4 text-blue-500" />
        <AlertDescription>
          SAML авторизация позволяет выполнить вход с использованием вашего корпоративного аккаунта.
          Вы будете перенаправлены на страницу входа вашей организации.
        </AlertDescription>
      </Alert>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Button 
        className="w-full"
        onClick={handleSamlLogin}
        disabled={loading}
      >
        {loading ? "Перенаправление..." : "Войти через SAML"}
      </Button>
    </div>
  );
};
