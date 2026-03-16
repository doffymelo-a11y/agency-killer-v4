// ═══════════════════════════════════════════════════════════════
// Calendar View Component with Drag & Drop
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { supabase } from '../../lib/supabase';
import { AGENTS } from '../../types';
import type { Task } from '../../types';

export interface CalendarViewProps {
  tasks: Task[];
  onLaunchTask: (taskId: string) => void;
  onTaskDateChange?: (taskId: string, newDate: string) => void;
}

export default function CalendarView({ tasks, onLaunchTask, onTaskDateChange }: CalendarViewProps) {
  const [isDragging, setIsDragging] = useState(false);

  const events = tasks.map((task) => {
    const agent = AGENTS[task.assignee];
    return {
      id: task.id,
      title: task.title,
      start: task.due_date,
      backgroundColor: agent.color.primary,
      borderColor: agent.color.primary,
      textColor: 'white',
      extendedProps: {
        agent: agent,
        task: task,
      },
    };
  });

  const handleEventDrop = async (info: any) => {
    const taskId = info.event.id;
    const newDate = info.event.start?.toISOString().split('T')[0];

    if (!newDate) {
      info.revert();
      return;
    }

    try {
      // Update task due date in Supabase
      const { error } = await supabase
        .from('tasks')
        .update({ due_date: newDate })
        .eq('id', taskId);

      if (error) throw error;

      // Call parent callback if provided
      if (onTaskDateChange) {
        onTaskDateChange(taskId, newDate);
      }

      // Success feedback
      console.log(`[Calendar] Tâche déplacée avec succès au ${newDate}`);
    } catch (error) {
      console.error('[Calendar] Erreur lors du déplacement de la tâche:', error);
      // Revert the event to its original position
      info.revert();
      alert('Erreur lors du déplacement de la tâche. Veuillez réessayer.');
    }
  };

  return (
    <div className="p-4">
      <div className={`calendar-container ${isDragging ? 'is-dragging' : ''}`}>
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={frLocale}
          events={events}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek',
          }}
          // Enable drag & drop
          editable={true}
          droppable={false}
          eventDurationEditable={false}
          eventStartEditable={true}
          eventDrop={handleEventDrop}
          // Drag feedback
          eventDragStart={() => setIsDragging(true)}
          eventDragStop={() => setIsDragging(false)}
          // Click to open task
          eventClick={(info) => {
            if (!isDragging) {
              onLaunchTask(info.event.id);
            }
          }}
          eventContent={(eventInfo) => {
            const agent = eventInfo.event.extendedProps.agent;
            const task = eventInfo.event.extendedProps.task;
            const statusColors = {
              todo: 'bg-slate-500',
              in_progress: 'bg-blue-500',
              blocked: 'bg-amber-500',
              done: 'bg-green-500',
            };
            const statusBg = statusColors[task.status] || 'bg-slate-500';

            return (
              <div className="flex items-center gap-1 px-1 py-0.5 overflow-hidden cursor-move">
                <img
                  src={agent.avatar}
                  alt={agent.name}
                  className="w-4 h-4 rounded-full flex-shrink-0"
                />
                <span className="text-xs truncate flex-1">{eventInfo.event.title}</span>
                <div className={`w-2 h-2 rounded-full ${statusBg} flex-shrink-0`} title={task.status}></div>
              </div>
            );
          }}
          height="auto"
          dayMaxEvents={3}
          // Custom styling
          eventClassNames="transition-all hover:opacity-90"
        />
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>💡 Astuce :</strong> Glissez-déposez les tâches sur le calendrier pour modifier leur date d'échéance. Cliquez sur une tâche pour la lancer.
        </p>
      </div>

      {/* Custom CSS for drag feedback */}
      <style>
        {`
          .calendar-container.is-dragging .fc-event {
            cursor: grabbing !important;
          }

          .fc-event {
            cursor: grab !important;
          }

          .fc-event:active {
            cursor: grabbing !important;
          }

          .fc-event-dragging {
            opacity: 0.6;
            z-index: 9999 !important;
          }
        `}
      </style>
    </div>
  );
}
