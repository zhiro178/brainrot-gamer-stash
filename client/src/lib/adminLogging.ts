// Simple admin logging utility
export interface AdminLog {
  id: string;
  admin_email: string;
  action: string;
  details: string;
  timestamp: string;
  target_user?: string;
}

export const logAdminAction = (action: string, details: string, adminEmail?: string, targetUser?: string) => {
  try {
    const newLog: AdminLog = {
      id: Date.now().toString(),
      admin_email: adminEmail || 'unknown',
      action,
      details,
      timestamp: new Date().toISOString(),
      target_user: targetUser
    };

    // Get existing logs
    const existingLogs = localStorage.getItem('admin_logs');
    let logs: AdminLog[] = [];
    
    if (existingLogs) {
      try {
        logs = JSON.parse(existingLogs);
      } catch (error) {
        console.error('Error parsing existing logs:', error);
        logs = [];
      }
    }

    // Add new log and keep only last 100 entries
    const updatedLogs = [newLog, ...logs].slice(0, 100);
    localStorage.setItem('admin_logs', JSON.stringify(updatedLogs));
    
    console.log('Admin action logged:', newLog);
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
};

export const getAdminLogs = (): AdminLog[] => {
  try {
    const logs = localStorage.getItem('admin_logs');
    return logs ? JSON.parse(logs) : [];
  } catch (error) {
    console.error('Error loading admin logs:', error);
    return [];
  }
};

export const exportAdminLogs = () => {
  try {
    const logs = getAdminLogs();
    const dataStr = JSON.stringify(logs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'admin_logs_export.json');
    linkElement.click();
    
    logAdminAction('EXPORT_LOGS', 'Exported admin logs to JSON file');
  } catch (error) {
    console.error('Error exporting admin logs:', error);
  }
};