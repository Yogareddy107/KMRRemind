import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useReminders } from './context/ReminderContext';
import { NavView, ReminderFormData } from './types';
import { Reminder } from './types/database';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { Footer } from './components/layout/Footer';
import { InstallPromptBanner } from './components/pwa/InstallPromptBanner';
import { ReminderFormModal } from './components/reminders/ReminderFormModal';
import { DashboardPage } from './pages/DashboardPage';
import { AllTasksPage } from './pages/AllTasksPage';
import { UpcomingPage } from './pages/UpcomingPage';
import { CalendarPage } from './pages/CalendarPage';
import { CompletedPage } from './pages/CompletedPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { LoginPage } from './pages/LoginPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { audioManager } from './lib/audio';
import { Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const {
    createReminder,
    updateReminder,
    completeOccurrence,
    snoozeOccurrence,
    dismissOccurrence,
    refreshData,
  } = useReminders();

  const [currentView, setCurrentView] = useState<NavView>('dashboard');
  const [isResetPasswordView, setIsResetPasswordView] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);

  // Service Worker communication: listen for notification click actions
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data) return;

      if (data.type === 'NOTIFICATION_ACTION') {
        const { action, occurrenceId } = data;
        if (action === 'complete' && occurrenceId) {
          completeOccurrence(occurrenceId);
        } else if (action === 'snooze' && occurrenceId) {
          snoozeOccurrence(occurrenceId, 10);
        } else if (action === 'dismiss' && occurrenceId) {
          dismissOccurrence(occurrenceId);
        }
      } else if (data.type === 'PUSH_NOTIFICATION_RECEIVED') {
        audioManager.playChime();
        refreshData();
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [completeOccurrence, snoozeOccurrence, dismissOccurrence, refreshData]);

  // Handle URL query parameters for PWA shortcuts (e.g. ?action=new, ?view=today)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const view = params.get('view');
    const occurrenceId = params.get('occurrenceId');

    if (action === 'new') {
      setIsCreateModalOpen(true);
    } else if (action === 'complete' && occurrenceId) {
      completeOccurrence(occurrenceId);
    } else if (action === 'snooze' && occurrenceId) {
      snoozeOccurrence(occurrenceId, 10);
    } else if (action === 'dismiss' && occurrenceId) {
      dismissOccurrence(occurrenceId);
    }

    if (view === 'today') {
      setCurrentView('dashboard');
    }

    // Clean URL query params without reloading
    if (window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [completeOccurrence, snoozeOccurrence, dismissOccurrence]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-matte-bg">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-matte-accent" />
          <p className="text-xs font-semibold text-slate-400">Loading KMR Remind...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    if (isResetPasswordView) {
      return <ResetPasswordPage onBackToLogin={() => setIsResetPasswordView(false)} />;
    }
    return <LoginPage onForgotPasswordClick={() => setIsResetPasswordView(true)} />;
  }

  const handleCreateOrUpdate = async (formData: ReminderFormData) => {
    if (editingReminder) {
      return await updateReminder(editingReminder.id, formData);
    } else {
      return await createReminder(formData);
    }
  };

  const handleOpenEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setIsCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingReminder(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-matte-bg text-slate-100 font-sans selection:bg-matte-accent selection:text-white antialiased">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={setCurrentView}
        onOpenCreateModal={() => {
          setEditingReminder(null);
          setIsCreateModalOpen(true);
        }}
      />

      {/* Main Layout Area */}
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <Sidebar
          currentView={currentView}
          onNavigate={setCurrentView}
          isAdminUnlocked={isAdminUnlocked}
        />

        {/* Content Pane */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {/* PWA Install Banner */}
          <InstallPromptBanner />

          {/* Views */}
          {currentView === 'dashboard' && (
            <DashboardPage
              onOpenCreateModal={() => {
                setEditingReminder(null);
                setIsCreateModalOpen(true);
              }}
              onEditReminder={handleOpenEdit}
              onNavigateToView={setCurrentView}
            />
          )}

          {currentView === 'all' && (
            <AllTasksPage
              onOpenCreateModal={() => {
                setEditingReminder(null);
                setIsCreateModalOpen(true);
              }}
              onEditReminder={handleOpenEdit}
            />
          )}

          {currentView === 'upcoming' && (
            <UpcomingPage
              onOpenCreateModal={() => {
                setEditingReminder(null);
                setIsCreateModalOpen(true);
              }}
              onEditReminder={handleOpenEdit}
            />
          )}

          {currentView === 'calendar' && (
            <CalendarPage
              onOpenCreateModal={() => {
                setEditingReminder(null);
                setIsCreateModalOpen(true);
              }}
              onEditReminder={handleOpenEdit}
            />
          )}

          {currentView === 'completed' && (
            <CompletedPage
              onOpenCreateModal={() => {
                setEditingReminder(null);
                setIsCreateModalOpen(true);
              }}
              onEditReminder={handleOpenEdit}
            />
          )}

          {currentView === 'settings' && <SettingsPage />}

          {currentView === 'admin' && (
            <AdminDashboard onLock={() => {
              setIsAdminUnlocked(false);
              setCurrentView('dashboard');
            }} />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav currentView={currentView} onNavigate={setCurrentView} />

      {/* Footer with Alarm Emoji Admin Button */}
      <Footer
        onNavigate={setCurrentView}
        onAdminUnlocked={() => setIsAdminUnlocked(true)}
        isAdminUnlocked={isAdminUnlocked}
      />

      {/* Create / Edit Reminder Modal */}
      {isCreateModalOpen && (
        <ReminderFormModal
          isOpen={isCreateModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleCreateOrUpdate}
          initialData={editingReminder}
        />
      )}
    </div>
  );
};
