import { useSocket } from '../context/SocketContext';

export default function NotificationToasts() {
  const { notifications, dismissNotif } = useSocket();
  if (!notifications.length) return null;
  return (
    <div className="notif-container">
      {notifications.map(n => (
        <div key={n.id} className={`notif notif-${n.type}`} onClick={() => dismissNotif(n.id)}>
          {n.msg}
        </div>
      ))}
    </div>
  );
}
