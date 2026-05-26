'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import ConfirmActionPanel from '@/components/admin/ConfirmActionPanel';
import { getAdminContentService } from '@/lib/admin/clientService';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_UPLOAD_SIZE_BYTES,
} from '@/lib/admin/constants';
import { GalleryContentRecord } from '@/types';

type UploadFormState = {
  eventName: string;
  date: string;
  status: 'draft' | 'published';
};

const defaultUploadState: UploadFormState = {
  eventName: '',
  date: '',
  status: 'published',
};

function validateFiles(files: File[]) {
  const issues: string[] = [];

  if (files.length === 0) {
    issues.push('Select at least one image file.');
  }

  for (const file of files) {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
      issues.push(`Unsupported format: ${file.name}`);
    }
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      issues.push(`File is larger than 5MB: ${file.name}`);
    }
  }

  return issues;
}

function sortGalleryEvents(items: GalleryContentRecord[]) {
  return [...items].sort(
    (a, b) => b.date.localeCompare(a.date) || a.eventName.localeCompare(b.eventName)
  );
}

export default function AdminGalleryPage() {
  const service = useMemo(() => getAdminContentService(), []);

  const [items, setItems] = useState<GalleryContentRecord[]>([]);
  const [uploadForm, setUploadForm] = useState<UploadFormState>(defaultUploadState);
  const [files, setFiles] = useState<File[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<GalleryContentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const gallery = await service.listGallery();
      setItems(sortGalleryEvents(gallery));
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : 'Failed to load gallery.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function validateUpload() {
    const issues = validateFiles(files);
    if (!uploadForm.eventName.trim()) issues.push('Event name is required.');
    if (!uploadForm.date) issues.push('Date is required.');
    return issues;
  }

  async function onUpload(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const issues = validateUpload();
    if (issues.length > 0) {
      setError(issues.join(' '));
      return;
    }

    try {
      setUploading(true);
      await service.uploadGalleryEvent({
        files,
        eventName: uploadForm.eventName.trim(),
        date: uploadForm.date,
        status: uploadForm.status,
      });
      setSuccess(`Uploaded ${files.length} image${files.length === 1 ? '' : 's'} successfully.`);
      setUploadForm(defaultUploadState);
      setFiles([]);
      await loadData();
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : 'Unable to upload gallery event.';
      setError(message);
    } finally {
      setUploading(false);
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
      await service.deleteGalleryEvent(deleteTarget.id);
      setSuccess('Gallery event deleted.');
      setDeleteTarget(null);
      await loadData();
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : 'Unable to delete gallery event.';
      setError(message);
    } finally {
      setDeleting(false);
    }
  }

  const previews = files.slice(0, 8);

  return (
    <div className="space-y-6 text-gray-900">
      <header>
        <h2 className="text-2xl font-bold">Gallery Management</h2>
        <p className="mt-1 text-sm text-gray-600">
          Add an event name, pick a date, then upload many images in one batch.
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
        <form onSubmit={onUpload} className="space-y-4 rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold">Upload Event Gallery</h3>

          <label className="text-sm">
            <span className="mb-1 block font-medium">Event name</span>
            <input
              value={uploadForm.eventName}
              onChange={(event) =>
                setUploadForm({ ...uploadForm, eventName: event.target.value })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="e.g. Fall Feast 2026"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-medium">Date</span>
              <input
                type="date"
                value={uploadForm.date}
                onChange={(event) =>
                  setUploadForm({ ...uploadForm, date: event.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium">Status</span>
              <select
                value={uploadForm.status}
                onChange={(event) =>
                  setUploadForm({
                    ...uploadForm,
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

          <label className="text-sm">
            <span className="mb-1 block font-medium">Images</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={(event) => setFiles(Array.from(event.target.files || []))}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
            <span className="mt-1 block text-xs text-gray-500">
              Select one or many files. JPG, PNG, WEBP. Max size per file: 5MB.
            </span>
          </label>

          {previews.length > 0 ? (
            <div className="rounded-md border border-gray-200 p-3">
              <p className="text-xs text-gray-600">
                {files.length} file{files.length === 1 ? '' : 's'} selected
              </p>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {previews.map((file) => {
                  const previewUrl = URL.createObjectURL(file);
                  return (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={file.name + file.lastModified}
                      src={previewUrl}
                      alt={file.name}
                      className="h-16 w-full rounded object-cover"
                      onLoad={() => URL.revokeObjectURL(previewUrl)}
                    />
                  );
                })}
              </div>
              {files.length > previews.length ? (
                <p className="mt-2 text-xs text-gray-500">
                  +{files.length - previews.length} more not shown in preview.
                </p>
              ) : null}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={uploading}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? 'Uploading...' : 'Upload Gallery Event'}
          </button>
        </form>

        <div className="rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold">Uploaded Gallery Events</h3>

          {loading ? <p className="mt-3 text-sm text-gray-600">Loading gallery...</p> : null}

          {!loading && items.length === 0 ? (
            <p className="mt-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
              No gallery events yet.
            </p>
          ) : null}

          {!loading && items.length > 0 ? (
            <ul className="mt-3 space-y-3">
              {items.map((item) => (
                <li key={item.id} className="rounded-md border border-gray-200 bg-gray-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{item.eventName}</p>
                      <p className="text-xs text-gray-600">{new Date(item.date).toLocaleDateString()}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-gray-200 px-2 py-1">{item.status}</span>
                        <span className="rounded-full bg-gray-200 px-2 py-1">
                          {item.images.length} image{item.images.length === 1 ? '' : 's'}
                        </span>
                      </div>
                      {item.images.length > 0 ? (
                        <div className="mt-3 grid grid-cols-5 gap-2">
                          {item.images.slice(0, 5).map((image) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={image.id}
                              src={image.src}
                              alt={item.eventName}
                              className="h-12 w-full rounded object-cover"
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      <ConfirmActionPanel
        open={Boolean(deleteTarget)}
        title="Delete gallery event"
        description={
          deleteTarget
            ? `Delete ${deleteTarget.eventName}? This removes all uploaded images for this event.`
            : ''
        }
        confirmLabel="Delete event gallery"
        busy={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={onDeleteConfirmed}
      />
    </div>
  );
}
