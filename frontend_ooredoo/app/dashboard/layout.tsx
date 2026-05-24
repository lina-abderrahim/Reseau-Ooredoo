'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Map, PlusCircle, FileText,
  Cpu, LogOut, Menu, ChevronLeft, Send, X, MessageSquare, ShieldCheck
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationsPanel from '@/components/NotificationsPanel';

function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user' as const, text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/chat/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input }),
      });
      const data = await response.json();
      const botText = typeof data.answer === 'string' ? data.answer : "Désolé, je rencontre une difficulté technique.";
      setMessages((prev) => [...prev, { role: 'ai', text: botText }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'ai', text: "Erreur : impossible de joindre le serveur." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-80 md:w-96 bg-white border border-gray-100 rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-white border-b border-gray-100 p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                <MessageSquare size={16} />
              </div>
              <div>
                <p className="font-bold text-xs text-gray-900 tracking-tight">Ooredoo Assistant</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <p className="text-[10px] text-gray-400 font-medium">En ligne</p>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-gray-50 text-gray-400 hover:text-gray-600 rounded-lg p-1.5 transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="h-80 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
            {messages.length === 0 && (
              <div className="text-center mt-12 space-y-2">
                <div className="w-12 h-12 bg-white rounded-xl border border-gray-100 flex items-center justify-center mx-auto text-gray-400 shadow-sm">
                  <Cpu size={20} />
                </div>
                <h4 className="text-xs font-bold text-gray-800 tracking-tight">Support Technique SIG</h4>
                <p className="text-gray-400 text-xs px-4 font-medium leading-relaxed">
                  Une question sur la 4G/5G ou vos cartes ? Je suis là pour vous aider.
                </p>
              </div>
            )}
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-xl text-xs font-medium leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-red-600 text-white rounded-tr-none'
                    : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>

          <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Posez votre question..."
              className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs text-gray-900 outline-none focus:border-red-600/30 focus:bg-white transition-colors"
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="bg-red-600 text-white p-2.5 rounded-xl hover:bg-red-700 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-red-600 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-red-700 hover:scale-105 transition-all active:scale-95 group"
      >
        {isOpen ? <X size={20} /> : <MessageSquare size={20} className="group-hover:scale-105 transition-transform" />}
      </button>
    </div>
  );
}

function SidebarItem({ href, icon, label, active, collapsed }: any) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-xs transition-all group ${
        active
          ? 'bg-red-600 text-white shadow-sm font-bold'
          : 'text-gray-500 hover:bg-red-50/50 hover:text-red-600'
      } ${collapsed ? 'justify-center' : ''}`}
    >
      <span className={`${active ? 'scale-105' : 'group-hover:scale-105 text-gray-400 group-hover:text-red-600'} transition-transform`}>
        {icon}
      </span>
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

export default function IngenieurLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const hasChecked = useRef(false);

  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(userId);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const checkAuth = async () => {
      const raw = localStorage.getItem('auth_user');
      if (!raw) { router.replace('/login'); return; }
      const user = JSON.parse(raw);
      if (!user || user.role !== 'ingenieur') { router.replace('/login'); return; }

      setUserName(user.name || 'Ingénieur');
      setUserId(user.id);

      try {
        const userRes = await fetch(`http://localhost:3000/users/${user.id}`);
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.must_change_password) setMustChangePassword(true);
        }
      } catch (err) { console.error(err); }

      setReady(true);
    };

    checkAuth();
  }, [router]);

  const handleChangePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch(`http://localhost:3000/users/${userId}/change-password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      if (res.ok) {
        toast.success('Sécurité mise à jour !');
        setMustChangePassword(false);
      } else {
        toast.error('Erreur lors du changement');
      }
    } catch { toast.error('Erreur de connexion'); }
    finally { setChangingPassword(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_user');
    router.push('/login');
  };

  if (!ready) return (
    <div className="flex flex-col items-center justify-center h-screen bg-white gap-3">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-600 border-t-transparent" />
      <p className="text-xs font-semibold tracking-wider text-gray-400">Initialisation...</p>
    </div>
  );

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans">

      {/* SIDEBAR */}
      <aside className={`bg-white border-r border-gray-100 flex flex-col flex-shrink-0 shadow-sm transition-all duration-300 relative z-40 ${
        collapsed ? 'w-20' : 'w-64'
      }`}>
        <div className="h-20 flex items-center justify-center px-4 border-b border-gray-50">
          {!collapsed ? (
            <Link href="/dashboard" className="transition-transform hover:scale-[1.02]">
              <Image src="/logo_2.png" alt="Ooredoo" width={110} height={30} priority className="cursor-pointer" />
            </Link>
          ) : (
            <Link href="/dashboard">
              <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm cursor-pointer hover:bg-red-700 transition-colors">
                O
              </div>
            </Link>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <SidebarItem href="/dashboard" icon={<LayoutDashboard size={16} />} label="Dashboard" active={pathname === '/dashboard'} collapsed={collapsed} />
          <SidebarItem href="/dashboard/cartes" icon={<Map size={16} />} label="Mes cartes" active={pathname.startsWith('/dashboard/cartes')} collapsed={collapsed} />
          <SidebarItem href="/dashboard/creer" icon={<PlusCircle size={16} />} label="Nouveau Projet" active={pathname.includes('/creer')} collapsed={collapsed} />
          <div className="my-3 border-t border-gray-100 mx-2" />
          <SidebarItem href="/dashboard/demandes" icon={<FileText size={16} />} label="Demandes Admin" active={pathname.startsWith('/dashboard/demandes')} collapsed={collapsed} />
          <SidebarItem href="/dashboard/ingenieur/technologies" icon={<Cpu size={16} />} label="Technologies" active={pathname.includes('/ingenieur/technologies')} collapsed={collapsed} />
        </nav>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-8 bg-white border border-gray-200 rounded-lg p-1 shadow-sm hover:bg-gray-50 transition-all z-50 text-red-600"
        >
          {collapsed ? <Menu size={12} /> : <ChevronLeft size={12} />}
        </button>

        <div className="p-3 border-t border-gray-100 bg-gray-50/40">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-600 font-semibold text-xs transition-all ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={16} />
            {!collapsed && "Déconnexion"}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-20 bg-white border-b border-gray-100 px-8 flex items-center justify-between flex-shrink-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-1 h-4 bg-red-600 rounded-full" />
            <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">SIG Network Planner</span>
          </div>
          <div className="flex items-center gap-4">
            <NotificationsPanel notifications={notifications} unreadCount={unreadCount} onMarkAsRead={markAsRead} onMarkAllAsRead={markAllAsRead} />
            
            <div className="h-4 w-px bg-gray-200" />

            <div className="flex items-center gap-2.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
              <div className="w-6 h-6 bg-red-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                {userName.slice(0, 1).toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-gray-700">{userName}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-gray-50/40">
          {children}
        </main>
      </div>

      <ChatBot />

      {/* MODAL SÉCURITÉ */}
      {mustChangePassword && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-gray-100">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4 text-red-600">
                <ShieldCheck size={24} />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Sécurité requise</h2>
              <p className="text-gray-500 mt-1 text-xs">Veuillez personnaliser votre mot de passe pour continuer.</p>
            </div>
            <div className="space-y-3">
              <input
                type="password"
                placeholder="Nouveau mot de passe"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-red-600 text-xs transition-colors"
              />
              <input
                type="password"
                placeholder="Confirmation du mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-red-600 text-xs transition-colors"
              />
              <button
                onClick={handleChangePassword}
                disabled={changingPassword || !newPassword}
                className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold text-xs hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {changingPassword ? 'Mise à jour...' : 'Valider mon compte'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toaster position="bottom-left" toastOptions={{
        style: {
          borderRadius: '12px',
          padding: '12px 18px',
          fontWeight: '600',
          fontSize: '12px',
          background: '#ffffff',
          color: '#1f2937',
          border: '1px solid #f3f4f6'
        }
      }} />
    </div>
  );
}