import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import socket from '../socket';

const SocketContext = createContext(null);

export const SocketProvider = ({ children, user, token }) => {
  const [connected,       setConnected] = useState(false);
  const [notifications,   setNotifs]   = useState([]);
  const [allNotifications, setAllNotifs] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const addNotif = useCallback((msg, type = 'info') => {
    const id = Date.now();
    const notif = { id, msg, type, timestamp: new Date() };
    setNotifs(prev => [notif, ...prev].slice(0, 20));
    setAllNotifs(prev => [notif, ...prev]);
    setUnreadCount(prev => prev + 1);
    setTimeout(() => setNotifs(prev => prev.filter(n => n.id !== id)), 6000);
  }, []);

  const dismissNotif = (id) => setNotifs(prev => prev.filter(n => n.id !== id));

  const markAllRead = () => setUnreadCount(0);

  const clearAll = () => {
    setAllNotifs([]);
    setUnreadCount(0);
  };

  useEffect(() => {
    if (!user || !token) {
      if (socket.connected) socket.disconnect();
      return;
    }

    socket.auth = { token };
    socket.connect();

    const onConnect    = () => { setConnected(true);  console.log('[WS] Connected', socket.id); };
    const onDisconnect = r  => { setConnected(false); console.log('[WS] Disconnected', r); };
    const onError      = e  => { console.error('[WS] Error', e.message); };

    socket.on('connect',       onConnect);
    socket.on('disconnect',    onDisconnect);
    socket.on('connect_error', onError);

    socket.on('order_placed', ({ message }) => {
      addNotif(message, 'success');
    });

    socket.on('order_status_updated', ({ message, orderId, deliveryStatus }) => {
      addNotif(message, deliveryStatus === 'Delivered' ? 'success' : 'info');
      window.dispatchEvent(new CustomEvent('ws:order_status', {
        detail: { orderId, deliveryStatus }
      }));
    });

    socket.on('new_order_assigned', ({ message, order }) => {
      addNotif(message, 'warning');
      window.dispatchEvent(new CustomEvent('ws:new_assignment', { detail: { order } }));
    });

    socket.on('my_order_updated', ({ orderId, deliveryStatus }) => {
      window.dispatchEvent(new CustomEvent('ws:my_order_updated', {
        detail: { orderId, deliveryStatus }
      }));
    });

    socket.on('verification_result', ({ decision, message }) => {
      addNotif(message, decision === 'Verified' ? 'success' : 'error');
      window.dispatchEvent(new CustomEvent('ws:verification_result', { detail: { decision } }));
    });

    socket.on('admin_new_order', ({ buyerName, amount }) => {
      addNotif(`New order from ${buyerName} — ₹${Number(amount).toFixed(2)}`, 'info');
      window.dispatchEvent(new CustomEvent('ws:admin_new_order'));
      window.dispatchEvent(new CustomEvent('ws:seller_new_order'));
    });

    socket.on('admin_order_updated', ({ transporter, deliveryStatus }) => {
      addNotif(`${transporter} updated order → ${deliveryStatus}`, 'info');
      window.dispatchEvent(new CustomEvent('ws:admin_order_updated'));
    });

    socket.on('transporter_availability_changed', ({ name, availability }) => {
      addNotif(`${name} is now ${availability}`, 'info');
    });

    socket.on('new_listing', ({ listing }) => {
      window.dispatchEvent(new CustomEvent('ws:new_listing', { detail: { listing } }));
    });

    socket.on('low_stock', ({ title, remaining }) => {
      addNotif(`⚠️ Low stock alert: ${title} has only ${remaining}L left`, 'warning');
    });

    socket.on('badge_assigned', ({ badge, message }) => {
      addNotif(message, badge ? 'success' : 'info');
      window.dispatchEvent(new CustomEvent('ws:badge_assigned', { detail: { badge } }));
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('order_placed');
      socket.off('order_status_updated');
      socket.off('new_order_assigned');
      socket.off('my_order_updated');
      socket.off('verification_result');
      socket.off('admin_new_order');
      socket.off('admin_order_updated');
      socket.off('transporter_availability_changed');
      socket.off('new_listing');
      socket.off('low_stock');
      socket.off('badge_assigned');
      socket.disconnect();
    };
  }, [user, token, addNotif]);

  return (
    <SocketContext.Provider value={{ connected, notifications, allNotifications, unreadCount, dismissNotif, addNotif, markAllRead, clearAll, socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
