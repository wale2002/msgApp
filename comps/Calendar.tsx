"use client";

import React, { useState, useEffect } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
} from "date-fns";
import { FaCalendar } from "react-icons/fa";
import styles from "../styles/Calendar.module.css";

interface Task {
  id: string;
  title: string;
  dateTime: string;
  description?: string;
}

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Initialize tasks from localStorage on client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTasks = localStorage.getItem("tasks");
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      }
    }
  }, []);

  // Save tasks to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("tasks", JSON.stringify(tasks));
    }
  }, [tasks]);

  // Request notification permission
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission !== "granted"
    ) {
      Notification.requestPermission().then((permission) => {
        if (permission !== "granted") {
          console.log("Notification permission denied");
        }
      });
    }
  }, []);

  // Check for due tasks and trigger notifications
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      tasks.forEach((task) => {
        const taskDateTime = new Date(task.dateTime);
        if (
          now.getTime() >= taskDateTime.getTime() &&
          now.getTime() < taskDateTime.getTime() + 60000
        ) {
          if (
            typeof window !== "undefined" &&
            Notification.permission === "granted"
          ) {
            new Notification(task.title, {
              body:
                task.description ||
                `Task due at ${format(taskDateTime, "h:mm a")}`,
              icon: "/favicon.ico",
            });
          }
        }
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [tasks]);

  const handleDateClick = (day: Date) => {
    if (isSameMonth(day, currentDate)) {
      setSelectedDate(day);
      const title = prompt("Enter task title:");
      if (!title) return;
      const time = prompt("Enter time (e.g., 14:30 for 2:30 PM):");
      let dateTime = day;
      if (time) {
        const [hours, minutes] = time.split(":").map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          dateTime = new Date(day.setHours(hours, minutes, 0, 0));
        } else {
          alert("Invalid time format. Using 00:00.");
          dateTime = new Date(day.setHours(0, 0, 0, 0));
        }
      }
      const description = prompt("Enter task description (optional):");
      const newTask: Task = {
        id: `${Date.now()}-${Math.random()}`,
        title,
        dateTime: dateTime.toISOString(),
        description: description || undefined,
      };
      setTasks([...tasks, newTask]);
      alert(
        `Task "${title}" set for ${format(dateTime, "MMMM d, yyyy h:mm a")}`
      );
    }
  };

  const prevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const startDay = startOfWeek(startOfMonth(currentDate));
  const endDay = endOfWeek(endOfMonth(currentDate));
  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const weeks: Date[][] = [];
  let week: Date[] = [];
  let day = startDay;
  while (day <= endDay) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
    day = new Date(day.getTime() + 24 * 60 * 60 * 1000);
  }
  if (week.length > 0) weeks.push(week);

  return (
    <div className={styles.calendar}>
      <div className={styles.calendarHeader}>
        <button onClick={prevMonth} aria-label="Previous Month">
          ←
        </button>
        <div className={styles.calendarTitle}>
          <FaCalendar size={24} className={styles.icon} />
          <h2>{format(currentDate, "MMMM yyyy")}</h2>
        </div>
        <div className={styles.calendarActions}>
          <button onClick={nextMonth} aria-label="Next Month">
            →
          </button>
        </div>
      </div>
      <div className={styles.calendarGrid}>
        <div className={styles.calendarWeekdays}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className={styles.weekday}>
              {day}
            </div>
          ))}
        </div>
        {weeks.map((week, index) => (
          <div key={index} className={styles.calendarWeek}>
            {week.map((day) => (
              <div
                key={day.toString()}
                className={`${styles.calendarDay} ${
                  !isSameMonth(day, currentDate) ? styles.disabled : ""
                } ${isSameDay(day, new Date()) ? styles.today : ""} ${
                  selectedDate && isSameDay(day, selectedDate)
                    ? styles.selected
                    : ""
                } ${
                  tasks.some((task) => isSameDay(new Date(task.dateTime), day))
                    ? styles.hasTask
                    : ""
                }`}
                onClick={() => handleDateClick(day)}
                role="button"
                tabIndex={isSameMonth(day, currentDate) ? 0 : -1}
                onKeyDown={(e) => e.key === "Enter" && handleDateClick(day)}
              >
                {format(day, "d")}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Calendar;
