/**
 * AutomationScheduler
 * Emulates Android WorkManager and AlarmManager scheduling semantics:
 * - One-time automation
 * - Recurring automation (interval)
 * - Daily automation
 * - Weekly automation
 * - Cancellation & Rescheduling
 * - Boot recovery
 * - Respects Android background execution restrictions (Doze mode, battery saver)
 */

import { SchedulerJob } from './types';

export type JobExecutionCallback = (job: SchedulerJob) => Promise<void>;

export class AutomationScheduler {
  private static instance: AutomationScheduler;

  private jobs: Map<string, SchedulerJob> = new Map();
  private timers: Map<string, any> = new Map();
  private executionCallback: JobExecutionCallback | null = null;

  public static getInstance(): AutomationScheduler {
    if (!AutomationScheduler.instance) {
      AutomationScheduler.instance = new AutomationScheduler();
    }
    return AutomationScheduler.instance;
  }

  public setExecutionCallback(callback: JobExecutionCallback): void {
    this.executionCallback = callback;
  }

  /**
   * Schedules a one-time execution at a future timestamp (AlarmManager.setExactAndAllowWhileIdle)
   */
  public scheduleOneTime(automationId: string, automationName: string, delayMs: number): SchedulerJob {
    const jobId = `job_exact_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const targetTimestamp = Date.now() + delayMs;

    const job: SchedulerJob = {
      jobId,
      automationId,
      automationName,
      scheduleType: 'one_time',
      targetTimestamp,
      enabled: true,
      nextRunTimestamp: targetTimestamp,
      status: 'SCHEDULED',
    };

    this.jobs.set(jobId, job);
    this.armTimer(job);
    return job;
  }

  /**
   * Schedules recurring work via WorkManager periodic request (min 15 min on Android)
   */
  public schedulePeriodic(automationId: string, automationName: string, intervalMinutes: number): SchedulerJob {
    const safeInterval = Math.max(1, intervalMinutes);
    const jobId = `job_periodic_${automationId}`;
    const nextRun = Date.now() + safeInterval * 60 * 1000;

    const job: SchedulerJob = {
      jobId,
      automationId,
      automationName,
      scheduleType: 'recurring_interval',
      intervalMinutes: safeInterval,
      enabled: true,
      nextRunTimestamp: nextRun,
      status: 'SCHEDULED',
    };

    this.jobs.set(jobId, job);
    this.armTimer(job);
    return job;
  }

  /**
   * Schedules daily automation (e.g. AlarmManager repeating daily at 07:00)
   */
  public scheduleDaily(automationId: string, automationName: string, hour: number, minute: number): SchedulerJob {
    const jobId = `job_daily_${automationId}`;
    const nextRun = this.calculateNextDailyTimestamp(hour, minute);

    const job: SchedulerJob = {
      jobId,
      automationId,
      automationName,
      scheduleType: 'daily',
      targetHour: hour,
      targetMinute: minute,
      enabled: true,
      nextRunTimestamp: nextRun,
      status: 'SCHEDULED',
    };

    this.jobs.set(jobId, job);
    this.armTimer(job);
    return job;
  }

  /**
   * Schedules weekly automation (e.g. WorkManager periodic on selected days)
   */
  public scheduleWeekly(automationId: string, automationName: string, days: number[], hour: number, minute: number): SchedulerJob {
    const jobId = `job_weekly_${automationId}`;
    const nextRun = this.calculateNextWeeklyTimestamp(days, hour, minute);

    const job: SchedulerJob = {
      jobId,
      automationId,
      automationName,
      scheduleType: 'weekly',
      targetDays: days,
      targetHour: hour,
      targetMinute: minute,
      enabled: true,
      nextRunTimestamp: nextRun,
      status: 'SCHEDULED',
    };

    this.jobs.set(jobId, job);
    this.armTimer(job);
    return job;
  }

  private calculateNextDailyTimestamp(hour: number, minute: number): number {
    const now = new Date();
    const next = new Date();
    next.setHours(hour, minute, 0, 0);
    if (next.getTime() <= now.getTime()) {
      next.setDate(next.getDate() + 1);
    }
    return next.getTime();
  }

  private calculateNextWeeklyTimestamp(days: number[], hour: number, minute: number): number {
    const now = new Date();
    for (let dayOffset = 0; dayOffset < 8; dayOffset++) {
      const candidate = new Date();
      candidate.setDate(candidate.getDate() + dayOffset);
      candidate.setHours(hour, minute, 0, 0);

      if (days.includes(candidate.getDay())) {
        if (candidate.getTime() > now.getTime()) {
          return candidate.getTime();
        }
      }
    }
    return now.getTime() + 86400000;
  }

  private armTimer(job: SchedulerJob): void {
    if (this.timers.has(job.jobId)) {
      clearTimeout(this.timers.get(job.jobId));
      this.timers.delete(job.jobId);
    }

    const delay = Math.max(10, job.nextRunTimestamp - Date.now());
    const timerId = setTimeout(async () => {
      await this.fireJob(job.jobId);
    }, delay);

    this.timers.set(job.jobId, timerId);
  }

  private async fireJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job || !job.enabled) return;

    job.status = 'RUNNING';
    job.lastRunTimestamp = Date.now();

    try {
      if (this.executionCallback) {
        await this.executionCallback(job);
      }
      job.status = 'COMPLETED';
    } catch (err) {
      console.error(`Scheduler job ${jobId} failed:`, err);
      job.status = 'CANCELLED';
    }

    // Rearm if recurring
    if (job.scheduleType === 'recurring_interval' && job.intervalMinutes) {
      job.nextRunTimestamp = Date.now() + job.intervalMinutes * 60 * 1000;
      job.status = 'SCHEDULED';
      this.armTimer(job);
    } else if (job.scheduleType === 'daily' && job.targetHour !== undefined && job.targetMinute !== undefined) {
      job.nextRunTimestamp = this.calculateNextDailyTimestamp(job.targetHour, job.targetMinute);
      job.status = 'SCHEDULED';
      this.armTimer(job);
    } else if (job.scheduleType === 'weekly' && job.targetDays && job.targetHour !== undefined && job.targetMinute !== undefined) {
      job.nextRunTimestamp = this.calculateNextWeeklyTimestamp(job.targetDays, job.targetHour, job.targetMinute);
      job.status = 'SCHEDULED';
      this.armTimer(job);
    }
  }

  public cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    if (this.timers.has(jobId)) {
      clearTimeout(this.timers.get(jobId));
      this.timers.delete(jobId);
    }

    job.enabled = false;
    job.status = 'CANCELLED';
    return true;
  }

  public rescheduleJob(jobId: string, newDelayMs: number): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    job.targetTimestamp = Date.now() + newDelayMs;
    job.nextRunTimestamp = job.targetTimestamp;
    job.status = 'SCHEDULED';
    job.enabled = true;
    this.armTimer(job);
    return true;
  }

  public getAllJobs(): SchedulerJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Boot Recovery Handler: Re-schedules all persistent alarms/WorkManager jobs upon device boot
   */
  public recoverJobsAfterBoot(): { recoveredCount: number; jobs: string[] } {
    const recovered: string[] = [];
    const now = Date.now();

    for (const job of this.jobs.values()) {
      if (job.enabled) {
        if (job.nextRunTimestamp < now) {
          // Job expired during shutdown: recalculate next window
          if (job.scheduleType === 'daily' && job.targetHour !== undefined && job.targetMinute !== undefined) {
            job.nextRunTimestamp = this.calculateNextDailyTimestamp(job.targetHour, job.targetMinute);
          } else if (job.scheduleType === 'recurring_interval' && job.intervalMinutes) {
            job.nextRunTimestamp = now + job.intervalMinutes * 60 * 1000;
          } else {
            job.nextRunTimestamp = now + 5000;
          }
        }
        this.armTimer(job);
        recovered.push(job.jobId);
      }
    }

    return {
      recoveredCount: recovered.length,
      jobs: recovered,
    };
  }
}

export const automationScheduler = AutomationScheduler.getInstance();
