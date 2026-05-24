'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
import { Eye, EyeOff, Lock, ShieldAlert, CheckCircle } from 'lucide-react';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('auth_user');
    if (!raw) { router.push('/login'); return; }
    const user = JSON.parse(raw);
    // ✅ Si pas besoin de changer → rediriger
    if (!user.must_change_password) {
      router.push(user.role === 'admin' ? '/dashboard_admin' : '/dashboard');
      return;
    }
    setCurrentUser(user);
  }, [router]);

  const handleChangePassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      toast.error('Tous les champs sont obligatoires');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/users/${currentUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: newPassword,
          must_change_password: false,
        }),
      });

      if (response.ok) {
        // ✅ Mettre à jour localStorage
        const updated = { ...currentUser, must_change_password: false };
        localStorage.setItem('auth_user', JSON.stringify(updated));
        toast.success('Mot de passe mis à jour !');
        setTimeout(() => {
          router.push(currentUser.role === 'admin' ? '/dashboard_admin' : '/dashboard');
        }, 1000);
      } else {
        toast.error('Erreur lors de la mise à jour');
      }
    } catch {
      toast.error('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center px-4">
      <Toaster position="top-right" />

      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/logo_2.png"
            alt="Ooredoo"
            width={140}
            height={44}
            priority
            style={{ width: '140px', height: 'auto' }}
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6">

          {/* Alerte sécurité */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <ShieldAlert size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-800 font-black text-sm uppercase tracking-wide">Sécurité requise</p>
              <p className="text-amber-700 text-xs font-medium mt-1">
                Pour des raisons de sécurité, vous devez changer votre mot de passe avant d'accéder à votre espace.
              </p>
            </div>
          </div>

          {/* Titre */}
          <div>
            <h1 className="text-2xl font-black text-gray-900">Nouveau mot de passe</h1>
            <p className="text-gray-500 text-sm mt-1">Choisissez un mot de passe sécurisé</p>
          </div>

          <div className="space-y-4">
            {/* Nouveau mot de passe */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-gray-500 uppercase">Nouveau mot de passe</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  placeholder="Minimum 6 caractères"
                  className="w-full p-3 pr-11 border-2 border-gray-200 rounded-xl outline-none focus:border-[#ED1C24] font-medium text-gray-900 transition-all"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {/* Indicateur force */}
              {newPassword && (
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className="h-1 flex-1 rounded-full transition-all"
                      style={{
                        backgroundColor:
                          newPassword.length >= level * 4
                            ? level === 1 ? '#ef4444' : level === 2 ? '#f59e0b' : '#22c55e'
                            : '#e5e7eb'
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Confirmer mot de passe */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-gray-500 uppercase">Confirmer le mot de passe</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full p-3 pr-11 border-2 border-gray-200 rounded-xl outline-none focus:border-[#ED1C24] font-medium text-gray-900 transition-all"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmPassword && (
                <p className={`text-xs font-bold flex items-center gap-1 ${
                  newPassword === confirmPassword ? 'text-emerald-600' : 'text-rose-500'
                }`}>
                  {newPassword === confirmPassword
                    ? <><CheckCircle size={12}/> Les mots de passe correspondent</>
                    : 'Les mots de passe ne correspondent pas'
                  }
                </p>
              )}
            </div>
          </div>

          {/* Bouton */}
          <button
            onClick={handleChangePassword}
            disabled={loading}
            className="w-full bg-[#ED1C24] text-white py-3.5 rounded-xl font-black text-sm uppercase tracking-wide hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Mise à jour...
              </>
            ) : (
              <><Lock size={16} /> Confirmer le nouveau mot de passe</>
            )}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Ooredoo Network Planning — Accès réservé aux membres autorisés
        </p>
      </div>
    </div>
  );
}