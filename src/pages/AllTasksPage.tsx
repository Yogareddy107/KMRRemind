import React, { useState, useMemo } from 'react';
import { useReminders } from '../context/ReminderContext';
import { ReminderCard } from '../components/reminders/ReminderCard';
import { EmptyState } from '../components/common/EmptyState';
import { Reminder, ReminderOccurrence, Priority } from '../types/database';
import { Search, Filter, ArrowUpDown, Plus } from 'lucide-react';
import { Button } from '../components/common/Button';

interface AllTasksPageProps {
  onOpenCreateModal: () => void;
  onEditReminder: (reminder: Reminder) => void;
}

export const AllTasksPage: React.FC<AllTasksPageProps> = ({
  onOpenCreateModal,
  onEditReminder,
}) => {
  const {
    occurrences,
    completeOccurrence,
    reopenOccurrence,
    snoozeOccurrence,
    dismissOccurrence,
    deleteReminder,
    togglePauseReminder,
  } = useReminders();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<Priority | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'due_asc' | 'due_desc' | 'priority' | 'title'>('due_asc');

  // Filtered and sorted occurrences
  const filteredOccurrences = useMemo(() => {
    return occurrences
      .filter((occ: ReminderOccurrence) => {
        const rem = occ.reminder;
        if (!rem) return false;

        // Search query
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchTitle = rem.title.toLowerCase().includes(q);
          const matchDesc = rem.description?.toLowerCase().includes(q);
          const matchCat = rem.category?.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchCat) return false;
        }

        // Category
        if (selectedCategory !== 'all' && rem.category !== selectedCategory) {
          return false;
        }

        // Priority
        if (selectedPriority !== 'all' && rem.priority !== selectedPriority) {
          return false;
        }

        // Status
        if (selectedStatus === 'pending') {
          if (occ.status === 'completed') return false;
        } else if (selectedStatus === 'completed') {
          if (occ.status !== 'completed') return false;
        }

        return true;
      })
      .sort((a: ReminderOccurrence, b: ReminderOccurrence) => {
        if (sortBy === 'due_asc') {
          return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
        }
        if (sortBy === 'due_desc') {
          return new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime();
        }
        if (sortBy === 'priority') {
          const weights: Record<string, number> = { high: 3, medium: 2, low: 1 };
          return (weights[b.reminder?.priority || 'medium'] || 0) - (weights[a.reminder?.priority || 'medium'] || 0);
        }
        if (sortBy === 'title') {
          return (a.reminder?.title || '').localeCompare(b.reminder?.title || '');
        }
        return 0;
      });
  }, [occurrences, search, selectedCategory, selectedPriority, selectedStatus, sortBy]);

  const categories = ['all', 'General', 'Work', 'Personal', 'Health', 'Finance', 'Learning'];

  return (
    <div className="space-y-5">
      {/* Header & New Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">All Tasks & Reminders</h2>
          <p className="text-xs text-slate-400">
            Search, filter by category and priority, and manage your full task queue.
          </p>
        </div>
        <Button size="sm" onClick={onOpenCreateModal}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          New Reminder
        </Button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="space-y-3 rounded-xl border border-matte-border bg-matte-surface p-3.5 shadow-matte-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search tasks, notes, or categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-matte-border bg-matte-input pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-matte-accent"
            />
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value as any)}
              className="rounded-lg border border-matte-border bg-matte-input px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-matte-accent"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="rounded-lg border border-matte-border bg-matte-input px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-matte-accent"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Only</option>
            <option value="completed">Completed Only</option>
          </select>

          {/* Sort By */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-lg border border-matte-border bg-matte-input px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-matte-accent"
            >
              <option value="due_asc">Due Date (Earliest First)</option>
              <option value="due_desc">Due Date (Latest First)</option>
              <option value="priority">Priority (High to Low)</option>
              <option value="title">Title (A–Z)</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 text-xs">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mr-1">
            Category:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-md px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-matte-accent text-white shadow-matte-sm'
                  : 'bg-matte-elevated text-slate-400 hover:text-slate-200 border border-matte-border'
              }`}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      {filteredOccurrences.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredOccurrences.map((occ: ReminderOccurrence) => (
            <ReminderCard
              key={occ.id}
              occurrence={occ}
              onComplete={completeOccurrence}
              onReopen={reopenOccurrence}
              onSnooze={snoozeOccurrence}
              onDismiss={dismissOccurrence}
              onEdit={onEditReminder}
              onDelete={deleteReminder}
              onTogglePause={togglePauseReminder}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No tasks match your filters"
          description={
            search || selectedCategory !== 'all' || selectedPriority !== 'all'
              ? 'Try adjusting your search keywords or filter settings.'
              : 'You have not added any tasks yet. Click below to schedule one!'
          }
          actionText="Create Reminder"
          onAction={onOpenCreateModal}
        />
      )}
    </div>
  );
};
