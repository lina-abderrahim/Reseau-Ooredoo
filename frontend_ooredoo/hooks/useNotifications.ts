import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface Notification {
  id: number;
  titre: string;
  message: string;
  type: string;
  lu: boolean;
  created_at: string;
}

let socket: Socket | null = null;

export function useNotifications(userId: number | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`http://localhost:3000/notifications/user/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.lu).length);
      }
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    socket = io('http://localhost:3000', {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      setConnected(true);
      socket?.emit('register', userId);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('notification', (notif: Notification) => {
      setNotifications(prev => [notif, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    fetchNotifications();

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [userId, fetchNotifications]);

  const markAsRead = async (id: number) => {
    try {
      await fetch(`http://localhost:3000/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    try {
      await fetch(`http://localhost:3000/notifications/read-all/${userId}`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return { notifications, unreadCount, markAsRead, markAllAsRead, connected };
}