'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import ConfirmActionPanel from '@/components/admin/ConfirmActionPanel';
import { getAdminContentService } from '@/lib/admin/clientService';
import { EventContentRecord } from '@/types';

type EventFormState = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  location: string;
  image: string;
  summary: string;
  description: string;
  status: 'draft' | 'published';
};

const emptyForm: EventFormState = {
  id: '',
  title: '',
  startAt: '',
  endAt: '',
  location: '',
  image: '',
  summary: '',
  description: '',
  status: 'published',
};

function createSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function normalizeDateTime(value: string) {
  if (!value) {
    return '';
  }

  return `${value}:00`;
}

function toDateTimeLocal(value: string) {
  if (!value) {
    return '';
  }

  return value.slice(0, 16);
}

function sortForView(events: EventContentRecord[]) {
  return [...events].sort(
    (a, b) =>
      new Date(a.start).getTime() - new Date(b.start).getTime() ||
      a.id.localeCompare(b.id)
  );
}

function toFormState(event: EventContentRecord): EventFormState {
  return {
    id: event.id,
    title: event.title,
    startAt: toDateTimeLocal(event.start),
    endAt: toDateTimeLocal(event.end),
    location: event.location,
    image: event.image,
    summary: event.summary,
    description: event.description,
    status: event.status,
  };
}

export default function AdminEventsPage() {
  const service = useMemo(() => getAdminContentService(), []);

  const [events, setEvents] = useState<EventContentRecord[]>([]);
  const [form, setForm] = useState<EventFormState>(emptyForm);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreviewUrl, setPosterPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EventContentRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const loaded = await service.listEvents();
      setEvents(sortForView(loaded));
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : 'Failed to load events.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!posterFile) {
      setPosterPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(posterFile);
    setPosterPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [posterFile]);

  function validateForm(input: EventFormState) {
    const issues: string[] = [];

    if (!input.title.trim()) issues.push('Title is required.');
    if (!input.startAt) issues.push('Start date and time are required.');
    if (!input.endAt) issues.push('End date and time are required.');
    if (!input.location.trim()) issues.push('Location is required.');
    if (!input.image.trim() && !posterFile) {
      issues.push('Poster upload is required.');
    }
    if (!input.summary.trim()) issues.push('Summary is required.');
    if (!input.description.trim()) issues.push('Description is required.');

    if (input.startAt && input.endAt) {
      const startDate = new Date(normalizeDateTime(input.startAt));
      const endDate = new Date(normalizeDateTime(input.endAt));
      if (endDate < startDate) {
        issues.push('End date/time must be after start date/time.');
      }
    }

    return issues;
  }

  function startCreate() {
    setSuccess(null);
    setError(null);
    setForm(emptyForm);
    setPosterFile(null);
  }

  function startEdit(event: EventContentRecord) {
    setSuccess(null);
    setError(null);
    setForm(toFormState(event));
    setPosterFile(null);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const issues = validateForm(form);
    if (issues.length > 0) {
      setError(issues.join(' '));
      return;
    }

    try {
      setSubmitting(true);
      let image = form.image.trim();

      if (posterFile) {
        const upload = await service.uploadEventPoster({
          file: posterFile,
          title: form.title.trim(),
        });
        image = upload.image;
      }

      const normalized: EventContentRecord = {
        id: form.id.trim() || `${createSlug(form.title)}-${form.startAt.slice(0, 10).replace(/-/g, '')}`,
        title: form.title.trim(),
        start: normalizeDateTime(form.startAt),
        end: normalizeDateTime(form.endAt),
        location: form.location.trim(),
        image,
        summary: form.summary.trim(),
        description: form.description.trim(),
        status: form.status,
      };

      await service.saveEvent(normalized);
      setSuccess('Event saved successfully.');
      startCreate();
      await loadData();
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : 'Unable to save event.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function onDeleteConfirmed() {
    if (!deleteTarget) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);
      setSuccess(null);
      await service.deleteEvent(deleteTarget.id);
      setSuccess('Event deleted.');
      await loadData();
      if (form.id === deleteTarget.id) {
        startCreate();
      }
      setDeleteTarget(null);
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : 'Unable to delete event.';
      setError(message);
    } finally {
      setDeleting(false);
    }
  }

  const posterPreview = posterPreviewUrl || form.image;

  return (
    <div className="space-y-6 text-gray-900">
      <header>
        <h2 className="text-2xl font-bold">Events Management</h2>
        <p className="mt-1 text-sm text-gray-600">
          Create and update events with a simpler schedule editor and poster uploads.
        </p>
      </header>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {success}
        </p>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={onSubmit} className="space-y-5 rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold">{form.id ? 'Edit Event' : 'Create Event'}</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-medium">Title</span>
              <input
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium">Status</span>
              <select
                value={form.status}
                onChange={(event) =>
                  setForm({
                    ...form,
                    status: event.target.value as 'draft' | 'published',
                  })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </label>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-900">Event Schedule</p>
            <p className="mt-1 text-xs text-gray-600">Pick start and end date-time in one step.</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block font-medium">Starts</span>
                <input
                  type="datetime-local"
                  value={form.startAt}
                  onChange={(event) => setForm({ ...form, startAt: event.target.value })}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2"
                />
              </label>

              <label className="text-sm">
                <span className="mb-1 block font-medium">Ends</span>
                <input
                  type="datetime-local"
                  value={form.endAt}
                  onChange={(event) => setForm({ ...form, endAt: event.target.value })}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2"
                />
              </label>
            </div>
          </div>

          <label className="text-sm">
            <span className="mb-1 block font-medium">Location</span>
            <input
              value={form.location}
              onChange={(event) => setForm({ ...form, location: event.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-medium">Poster upload</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => setPosterFile(event.target.files?.[0] || null)}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
            <span className="mt-1 block text-xs text-gray-500">
              Choose a JPG, PNG, or WEBP poster. Upload happens when you save.
            </span>
          </label>

          {posterPreview ? (
            <div className="rounded-md border border-gray-200 p-3">
              <p className="text-xs text-gray-600">
                {posterFile ? 'Poster preview' : 'Current poster preview'}
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={posterPreview}
                alt="Event preview"
                className="mt-2 h-44 w-full rounded-md object-cover"
              />
            </div>
          ) : null}

          <label className="text-sm">
            <span className="mb-1 block font-medium">Summary</span>
            <textarea
              value={form.summary}
              onChange={(event) => setForm({ ...form, summary: event.target.value })}
              className="min-h-20 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-medium">Description</span>
            <textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              className="min-h-28 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Saving...' : 'Save Event'}
            </button>
            <button
              type="button"
              onClick={startCreate}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Clear Form
            </button>
          </div>
        </form>

        <div className="rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold">Existing Events</h3>

          {loading ? <p className="mt-3 text-sm text-gray-600">Loading events...</p> : null}

          {!loading && events.length === 0 ? (
            <p className="mt-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
              No events yet. Create your first event.
            </p>
          ) : null}

          {!loading && events.length > 0 ? (
            <ul className="mt-3 space-y-3">
              {events.map((eventItem) => {
                const isPast = new Date(eventItem.start) < new Date();
                return (
                  <li
                    key={eventItem.id}
                    className="rounded-md border border-gray-200 bg-gray-50 p-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex gap-3">
                        {eventItem.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={eventItem.image}
                            alt={eventItem.title}
                            className="h-16 w-16 rounded-md object-cover"
                          />
                        ) : null}
                        <div>
                          <p className="font-semibold text-gray-900">{eventItem.title}</p>
                          <p className="text-xs text-gray-600">
                            {new Date(eventItem.start).toLocaleString()} -{' '}
                            {new Date(eventItem.end).toLocaleString()}
                          </p>
                          <p className="mt-1 text-xs text-gray-600">{eventItem.location}</p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            <span className="rounded-full bg-gray-200 px-2 py-1">
                              {isPast ? 'Past' : 'Upcoming'}
                            </span>
                            <span className="rounded-full bg-gray-200 px-2 py-1">
                              {eventItem.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(eventItem)}
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-white"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(eventItem)}
                          className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </section>

      <ConfirmActionPanel
        open={Boolean(deleteTarget)}
        title="Delete event"
        description={
          deleteTarget
            ? `Delete ${deleteTarget.title}? This removes it from the admin dashboard and public events listings.`
            : ''
        }
        confirmLabel="Delete event"
        busy={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={onDeleteConfirmed}
      />
    </div>
  );
}
