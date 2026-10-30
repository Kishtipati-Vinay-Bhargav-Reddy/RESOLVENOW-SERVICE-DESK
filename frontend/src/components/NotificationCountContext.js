import { createContext, useContext } from "react";

export const NotificationCountContext = createContext(null);

export function useNotificationCount() {
  const context = useContext(NotificationCountContext);
  if (!context) throw new Error("useNotificationCount must be used inside NotificationCountProvider");
  return context;
}