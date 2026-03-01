// ═══════════════════════════════════════════════════════════════
// Calendar View Component
// ═══════════════════════════════════════════════════════════════

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import frLocale from '@fullcalendar/core/locales/fr';
import { AGENTS } from '../../types';
import type { Task } from '../../types';

export interface CalendarViewProps {
  tasks: Task[];
  onLaunchTask: (taskId: string) => void;
}

export default function CalendarView({ tasks, onLaunchTask }: CalendarViewProps) {
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

  return (
    <div className="p-4">
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        locale={frLocale}
        events={events}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek',
        }}
        eventClick={(info) => {
          onLaunchTask(info.event.id);
        }}
        eventContent={(eventInfo) => {
          const agent = eventInfo.event.extendedProps.agent;
          return (
            <div className="flex items-center gap-1 px-1 py-0.5 overflow-hidden">
              <img
                src={agent.avatar}
                alt={agent.name}
                className="w-4 h-4 rounded-full flex-shrink-0"
              />
              <span className="text-xs truncate">{eventInfo.event.title}</span>
            </div>
          );
        }}
        height="auto"
        dayMaxEvents={3}
      />
    </div>
  );
}
