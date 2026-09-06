'use client';

import { useState } from 'react';
import { Bell, X, CheckCheck, Map, FileText, Clock } from 'lucide-react';

interface Notification {
  id: number;
  titre: string;
  message: string;
  type: string;
  lu: boolean;
  created_at: string;
}

interface Props {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
}

const TYPE_ICON: Record<string, any> = {
  carte_acceptee:   { icon: Map,      color: 'text-green-600',  bg: 'bg-green-100' },
  carte_refusee:    { icon: Map,      color: 'text-red-600',    bg: 'bg-red-100' },
  carte_en_attente: { icon: Clock,    color: 'text-yellow-600', bg: 'bg-yellow-100' },
  nouvelle_demande: { icon: FileText, color: 'text-blue-600',   bg: 'bg-blue-100' },
};

export default function NotificationsPanel({
  notifications, unreadCount, onMarkAsRead, onMarkAllAsRead,
}: Props) {
  const [open, setOpen] = useState(false);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'À l\'instant';
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Bouton cloche */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-gray-100 transition-all"
      >
        <Bell size={20} className="text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#ED1C24] text-white text-[10px] font-black rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-[#ED1C24]" />
                <h3 className="font-black text-gray-900 text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-[#ED1C24] text-white text-xs font-bold rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllAsRead}
                    className="text-xs text-gray-500 hover:text-[#ED1C24] font-bold flex items-center gap-1"
                  >
                    <CheckCheck size={12} /> Tout lire
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X size={14} className="text-gray-500" />
                </button>
              </div>
            </div>

            {/* Liste */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-400 text-sm font-medium">Aucune notification</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const typeConfig = TYPE_ICON[notif.type] || { icon: Bell, color: 'text-gray-600', bg: 'bg-gray-100' };
                  const Icon = typeConfig.icon;
                  return (
                    <div
                      key={notif.id}
                      onClick={() => !notif.lu && onMarkAsRead(notif.id)}
                      className={`flex gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!notif.lu ? 'bg-blue-50' : ''}`}
                    >
                      <div className={`p-2 ${typeConfig.bg} rounded-xl flex-shrink-0 h-fit`}>
                        <Icon size={14} className={typeConfig.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-gray-900 text-xs truncate">{notif.titre}</p>
                          {!notif.lu && <span className="w-2 h-2 bg-[#ED1C24] rounded-full flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{formatDate(notif.created_at)}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}


