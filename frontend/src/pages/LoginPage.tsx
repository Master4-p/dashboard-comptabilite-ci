import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  if (isAuthenticated) {
    navigate('/', { replace: true });
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const success = login(email, password);
      if (success) {
        addToast('success', 'Connexion réussie.');
        navigate('/', { replace: true });
      } else {
        addToast('error', 'Identifiants incorrects.');
        setError('Email ou mot de passe incorrect.');
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] p-4">
      <div className="card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <img
            src="/logo-sm.png"
            alt="Relais IT"
            className="w-16 h-16 mx-auto mb-4 rounded-xl object-contain"
            style={{ background: 'white' }}
          />
          <h1 className="text-2xl font-bold text-[#111827]">Relais IT</h1>
          <p className="text-sm text-[#64748B] mt-1">Comptabilité — Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="alert-panel-danger text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="admin@relaisit.ci"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="form-label">Mot de passe</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input pr-10"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading}
          >
            {loading ? (
              <span className="animate-pulse">Connexion...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Se connecter
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-[#E2E8F0] text-center">
          <p className="text-xs text-[#94A3B8]">
            Comptes de démonstration :
          </p>
          <p className="text-xs text-[#64748B] mt-1">
            <strong>admin@relaisit.ci</strong> / admin123
          </p>
          <p className="text-xs text-[#64748B]">
            <strong>compta@relaisit.ci</strong> / compta2026
          </p>
        </div>
      </div>
    </div>
  );
}
