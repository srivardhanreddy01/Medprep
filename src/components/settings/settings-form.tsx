"use client";
import { useActionState, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Input, Label, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { saveSettings, type SettingsState } from "./actions";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface SettingsValues {
  display_name: string;
  target_exam_id: string;
  exam_date: string;
  timezone: string;
  daily_minutes: number;
  study_days: number[];
  desired_retention: number;
  max_new_cards_per_day: number;
  email_reminders: boolean;
  browser_reminders: boolean;
}

export function SettingsForm({
  values,
  exams,
  onboarding,
}: {
  values: SettingsValues;
  exams: { id: string; name: string; region: string }[];
  onboarding?: boolean;
}) {
  const [state, action] = useActionState<SettingsState, FormData>(saveSettings, undefined);
  const tzRef = useRef<HTMLInputElement>(null);
  const [retention, setRetention] = useState(values.desired_retention);

  // Detect the browser time zone at submit time during onboarding.
  const onSubmit = () => {
    if (onboarding && tzRef.current) tzRef.current.value = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  };

  return (
    <form action={action} onSubmit={onSubmit} className="space-y-6">
      {onboarding && <input type="hidden" name="onboarding" value="1" />}
      <input ref={tzRef} type="hidden" name="timezone" defaultValue={values.timezone} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="display_name">Name</Label>
          <Input id="display_name" name="display_name" defaultValue={values.display_name} required maxLength={80} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="target_exam_id">Target exam</Label>
          <Select id="target_exam_id" name="target_exam_id" defaultValue={values.target_exam_id || "usmle-step1"}>
            {exams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.region})
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="exam_date">Exam date</Label>
          <Input id="exam_date" name="exam_date" type="date" defaultValue={values.exam_date} />
          <p className="text-xs text-muted-foreground">Optional. Used for the countdown and to prioritize practice.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="daily_minutes">Study time per day (minutes)</Label>
          <Input id="daily_minutes" name="daily_minutes" type="number" min={10} max={960} step={5} defaultValue={values.daily_minutes} required />
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Study days</legend>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d, i) => (
            <label key={d} className="flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary-soft">
              <input type="checkbox" name="study_days" value={i} defaultChecked={values.study_days.includes(i)} className="accent-[var(--primary)]" />
              {d}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="desired_retention">Retention target: {Math.round(retention * 100)}%</Label>
          <input
            id="desired_retention"
            name="desired_retention"
            type="range"
            min={0.7}
            max={0.97}
            step={0.01}
            value={retention}
            onChange={(e) => setRetention(Number(e.target.value))}
            className="w-full accent-[var(--primary)]"
          />
          <p className="text-xs text-muted-foreground">
            The probability of recall FSRS aims for at each review. Higher means more frequent reviews. 90% is a good default.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="max_new_cards_per_day">New flashcards per day</Label>
          <Input id="max_new_cards_per_day" name="max_new_cards_per_day" type="number" min={0} max={500} defaultValue={values.max_new_cards_per_day} />
        </div>
      </div>

      {!onboarding && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Reminders (with your consent)</legend>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="email_reminders" defaultChecked={values.email_reminders} className="accent-[var(--primary)]" />
            Email me when reviews are due
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="browser_reminders" defaultChecked={values.browser_reminders} className="accent-[var(--primary)]" />
            Browser notifications
          </label>
          <p className="text-xs text-muted-foreground">Your preference is saved now; reminder delivery arrives in Phase 2.</p>
        </fieldset>
      )}

      <p className="text-xs text-muted-foreground">Time zone: {onboarding ? "detected from your browser" : values.timezone}</p>
      {state?.error && <Alert variant="destructive">{state.error}</Alert>}
      {state?.saved && <Alert variant="success">Settings saved.</Alert>}
      <SubmitButton pendingText="Saving…">{onboarding ? "Start studying" : "Save settings"}</SubmitButton>
    </form>
  );
}
