'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeOff, AlertCircle, Mail, Lock, LogIn } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Email et mot de passe sont obligatoires');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
          setError('Email ou mot de passe incorrect');
        } else if (response.status === 404) {
          setError('Aucun compte trouvé avec cet email');
        } else {
          setError(data?.message || 'Connexion invalide');
        }
        return;
      }

      const user = await response.json();

      // ✅ Clé séparée selon le rôle pour éviter les conflits entre onglets
      const storageKey = user.role === 'admin' ? 'auth_admin' : 'auth_user';

      // ✅ Vider l'ancienne session de l'autre rôle
      if (user.role === 'admin') {
        sessionStorage.removeItem('auth_user');
      } else {
        sessionStorage.removeItem('auth_admin');
      }

      sessionStorage.setItem(storageKey, JSON.stringify(user));

      if (user.must_change_password) {
        router.push('/change-password');
      } else {
        router.push(user.role === 'admin' ? '/dashboard_admin' : '/dashboard');
      }

    } catch {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center px-4 font-sans text-gray-900 selection:bg-[#ED1C24] selection:text-white">
      <Toaster position="top-right" />

      <div className="w-full max-w-[420px] space-y-8">
        
        <div className="flex flex-col items-center">
          <Image
            src="/logo_2.png"
            alt="Ooredoo"
            width={140}
            height={44}
            priority
            style={{ width: '140px', height: 'auto' }}
          />
        </div>

        <div className="bg-[#FAFACA] bg-gray-50/50 rounded-[2rem] border border-gray-100 p-8 space-y-6 shadow-sm">
          
          {error && (
            <div className="flex items-center gap-3 p-3.5 bg-red-50 border border-red-100 rounded-xl">
              <AlertCircle size={16} className="text-[#ED1C24] flex-shrink-0" />
              <p className="text-red-700 text-xs font-bold leading-none">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                Email
              </label>
              <div className="relative group">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#ED1C24] transition-colors" />
                <input
                  type="email"
                  placeholder="your.name@ooredoo.tn"
                  className="w-full bg-white border border-gray-200 focus:border-[#ED1C24] rounded-xl p-3.5 pl-12 outline-none text-sm font-medium transition-all focus:ring-4 focus:ring-[#ED1C24]/10"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                Password
              </label>
              <div className="relative group">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#ED1C24] transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  className="w-full bg-white border border-gray-200 focus:border-[#ED1C24] rounded-xl p-3.5 pl-12 pr-12 outline-none text-sm font-medium transition-all focus:ring-4 focus:ring-[#ED1C24]/10"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-[#ED1C24] hover:bg-neutral-950 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2.5 shadow-md shadow-[#ED1C24]/10 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={14} />
                <span>Log In</span>
              </>
            )}
          </button>

        </div>

        <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-wider">
          Direction des Technologies Réseau — Ooredoo Tunisie
        </p>

      </div>
    </div>
  );
}