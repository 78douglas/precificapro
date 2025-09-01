import { useAuth } from '@getmocha/users-service/react';
import { LogIn } from 'lucide-react';

export default function LoginButton() {
  const { redirectToLogin } = useAuth();

  return (
    <button
      onClick={redirectToLogin}
      className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
    >
      <LogIn className="w-5 h-5" />
      Entrar com Google
    </button>
  );
}
