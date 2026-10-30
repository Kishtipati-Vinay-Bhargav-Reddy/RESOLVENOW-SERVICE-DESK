import { useCallback, useEffect, useState } from "react";
import { getUnreadNotificationCount } from "../services/api";
import { NotificationCountContext } from "./NotificationCountContext";

export function NotificationCountProvider({ enabled, children }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const refreshUnreadCount = useCallback(async () => {
    if (!enabled) return 0;
    const { data } = await getUnreadNotificationCount();
    const count = Number(data?.count || 0);
    setUnreadCount(count);
    return count;
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    const refresh = () => refreshUnreadCount().catch(() => { if (active) setUnreadCount(0); });
    refresh();
    window.addEventListener("notifications:changed", refresh);
    return () => {
      active = false;
      window.removeEventListener("notifications:changed", refresh);
    };
  }, [enabled, refreshUnreadCount]);

  return <NotificationCountContext.Provider value={{ unreadCount, refreshUnreadCount }}>
    {children}
  </NotificationCountContext.Provider>;
}
