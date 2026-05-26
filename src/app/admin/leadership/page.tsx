'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import ConfirmActionPanel from '@/components/admin/ConfirmActionPanel';
import { getAdminContentService } from '@/lib/admin/clientService';
import { Leader } from '@/types';

type LeaderFormState = {
  id: string;
  academicYear: string;
  name: string;
  role: string;
  bio: string;
  image: string;
  email: string;
  linkedin: string;
  blurb: string;
  majorYear: string;
  responsibilitiesText: string;
  funFact: string;
  order: string;
  status: 'draft' | 'published';
};

const emptyLeaderForm: LeaderFormState = {
  id: '',
  academicYear: 'AY 26-27',
  name: '',
  role: '',
  bio: '',
  image: '',
  email: '',
  linkedin: '',
  blurb: '',
  majorYear: '',
  responsibilitiesText: '',
  funFact: '',
  order: '',
  status: 'published',
};

function createSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function toLeaderFormState(leader: Leader): LeaderFormState {
  return {
    id: leader.id,
    academicYear: leader.academicYear || 'AY 25-26',
    name: leader.name,
    role: leader.role,
    bio: leader.bio,
    image: leader.image || leader.photo || '',
    email: leader.email || '',
    linkedin: leader.linkedin || leader.social?.linkedin || '',
    blurb: leader.blurb || '',
    majorYear: leader.majorYear || '',
    responsibilitiesText: leader.responsibilities?.join('\n') || '',
    funFact: leader.funFact || '',
    order: typeof leader.order === 'number' ? String(leader.order) : '',
    status: leader.status === 'draft' ? 'draft' : 'published',
  };
}

export default function AdminLeadershipPage() {
  const service = useMemo(() => getAdminContentService(), []);

  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [leaderForm, setLeaderForm] = useState<LeaderFormState>(emptyLeaderForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingLeader, setSavingLeader] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Leader | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedLeaders = await service.listLeaders();
      setLeaders(loadedLeaders);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load leadership entries.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(photoFile);
    setPhotoPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [photoFile]);

  async function onSubmitLeader(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (
      !leaderForm.academicYear.trim() ||
      !leaderForm.name.trim() ||
      !leaderForm.role.trim() ||
      !leaderForm.bio.trim() ||
      (!leaderForm.image.trim() && !photoFile)
    ) {
      setError('Academic year, leader name, role, bio, and image are required.');
      return;
    }

    try {
      setSavingLeader(true);
      let image = leaderForm.image.trim();

      if (photoFile) {
        const upload = await service.uploadLeaderPhoto({
          file: photoFile,
          title: leaderForm.name.trim(),
        });
        image = upload.image;
      }

      await service.saveLeader({
        id: leaderForm.id.trim() || createSlug(leaderForm.name),
        academicYear: leaderForm.academicYear.trim(),
        name: leaderForm.name.trim(),
        role: leaderForm.role.trim(),
        bio: leaderForm.bio.trim(),
        image,
        photo: image,
        email: leaderForm.email.trim() || undefined,
        linkedin: leaderForm.linkedin.trim() || undefined,
        social: leaderForm.linkedin.trim()
          ? { linkedin: leaderForm.linkedin.trim() }
          : undefined,
        blurb: leaderForm.blurb.trim() || undefined,
        majorYear: leaderForm.majorYear.trim() || undefined,
        responsibilities: leaderForm.responsibilitiesText
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
        funFact: leaderForm.funFact.trim() || undefined,
        order:
          leaderForm.order.trim() && !Number.isNaN(Number(leaderForm.order))
            ? Number(leaderForm.order)
            : undefined,
        status: leaderForm.status,
      });
      setSuccess('Leadership entry saved.');
      setLeaderForm(emptyLeaderForm);
      setPhotoFile(null);
      await loadData();
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : 'Unable to save leadership entry.';
      setError(message);
    } finally {
      setSavingLeader(false);
    }
  }

  async function onDeleteLeaderConfirmed() {
    if (!deleteTarget) {
      return;
    }

    try {
      setSavingLeader(true);
      setError(null);
      setSuccess(null);
      await service.deleteLeader(deleteTarget.id);
      setSuccess('Leadership entry deleted.');
      if (leaderForm.id === deleteTarget.id) {
        setLeaderForm(emptyLeaderForm);
      }
      setDeleteTarget(null);
      await loadData();
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : 'Unable to delete leadership entry.';
      setError(message);
    } finally {
      setSavingLeader(false);
    }
  }

  const photoPreview = photoPreviewUrl || leaderForm.image;

  return (
    <div className="space-y-6 text-gray-900">
      <header>
        <h2 className="text-2xl font-bold">Leadership Management</h2>
        <p className="mt-1 text-sm text-gray-600">
          Add and edit board members by academic year.
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

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={onSubmitLeader} className="space-y-4 rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">
              {leaderForm.id ? 'Edit Leadership Entry' : 'Add Leadership Entry'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setLeaderForm(emptyLeaderForm);
                setPhotoFile(null);
              }}
              className="rounded-md border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-medium">Academic year</span>
              <input
                value={leaderForm.academicYear}
                onChange={(event) =>
                  setLeaderForm({ ...leaderForm, academicYear: event.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="AY 26-27"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium">Name</span>
              <input
                value={leaderForm.name}
                onChange={(event) =>
                  setLeaderForm({ ...leaderForm, name: event.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium">Role</span>
              <input
                value={leaderForm.role}
                onChange={(event) =>
                  setLeaderForm({ ...leaderForm, role: event.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>
          </div>

          <label className="text-sm">
            <span className="mb-1 block font-medium">Photo upload</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => setPhotoFile(event.target.files?.[0] || null)}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
            <span className="mt-1 block text-xs text-gray-500">
              Choose a JPG, PNG, or WEBP image. Upload happens when you save.
            </span>
          </label>

          {photoPreview ? (
            <div className="rounded-md border border-gray-200 p-3">
              <p className="text-xs text-gray-600">
                {photoFile ? 'Photo preview' : 'Current photo preview'}
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoPreview}
                alt="Leader preview"
                className="mt-2 h-44 w-full rounded-md object-cover"
              />
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-medium">Major / year</span>
              <input
                value={leaderForm.majorYear}
                onChange={(event) =>
                  setLeaderForm({ ...leaderForm, majorYear: event.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium">Display order</span>
              <input
                type="number"
                value={leaderForm.order}
                onChange={(event) =>
                  setLeaderForm({ ...leaderForm, order: event.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>
          </div>

          <label className="text-sm">
            <span className="mb-1 block font-medium">Bio</span>
            <textarea
              value={leaderForm.bio}
              onChange={(event) =>
                setLeaderForm({ ...leaderForm, bio: event.target.value })
              }
              className="min-h-24 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-medium">Email</span>
              <input
                value={leaderForm.email}
                onChange={(event) =>
                  setLeaderForm({ ...leaderForm, email: event.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium">LinkedIn URL</span>
              <input
                value={leaderForm.linkedin}
                onChange={(event) =>
                  setLeaderForm({ ...leaderForm, linkedin: event.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-medium">Blurb</span>
              <textarea
                value={leaderForm.blurb}
                onChange={(event) =>
                  setLeaderForm({ ...leaderForm, blurb: event.target.value })
                }
                className="min-h-20 w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium">Fun fact</span>
              <textarea
                value={leaderForm.funFact}
                onChange={(event) =>
                  setLeaderForm({ ...leaderForm, funFact: event.target.value })
                }
                className="min-h-20 w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>
          </div>

          <label className="text-sm">
            <span className="mb-1 block font-medium">Responsibilities</span>
            <textarea
              value={leaderForm.responsibilitiesText}
              onChange={(event) =>
                setLeaderForm({
                  ...leaderForm,
                  responsibilitiesText: event.target.value,
                })
              }
              className="min-h-24 w-full rounded-md border border-gray-300 px-3 py-2"
            />
            <span className="mt-1 block text-xs text-gray-500">
              Put one responsibility on each line.
            </span>
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-medium">Status</span>
            <select
              value={leaderForm.status}
              onChange={(event) =>
                setLeaderForm({
                  ...leaderForm,
                  status: event.target.value as 'draft' | 'published',
                })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </label>

          <button
            type="submit"
            disabled={savingLeader}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingLeader ? 'Saving...' : 'Save Leadership Entry'}
          </button>
        </form>

        <div className="rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold">Leadership Entries</h3>

          {loading ? <p className="mt-3 text-sm text-gray-600">Loading leaders...</p> : null}

          {!loading && leaders.length === 0 ? (
            <p className="mt-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
              No leadership entries yet.
            </p>
          ) : null}

          {!loading && leaders.length > 0 ? (
            <ul className="mt-3 space-y-3">
              {leaders.map((leader) => (
                <li key={leader.id} className="rounded-md border border-gray-200 bg-gray-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{leader.name}</p>
                      <p className="text-sm text-gray-600">{leader.role}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-gray-200 px-2 py-1">
                          {leader.academicYear || 'AY 25-26'}
                        </span>
                        <span className="rounded-full bg-gray-200 px-2 py-1">
                          {leader.status === 'draft' ? 'Draft' : 'Published'}
                        </span>
                        {typeof leader.order === 'number' ? (
                          <span className="rounded-full bg-gray-200 px-2 py-1">
                            Order {leader.order}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setLeaderForm(toLeaderFormState(leader));
                          setPhotoFile(null);
                        }}
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-white"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(leader)}
                        className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      <ConfirmActionPanel
        open={Boolean(deleteTarget)}
        title="Delete leadership entry"
        description={
          deleteTarget
            ? `Delete ${deleteTarget.name}? This removes the person from the public leadership page.`
            : ''
        }
        confirmLabel="Delete leader"
        busy={savingLeader}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={onDeleteLeaderConfirmed}
      />
    </div>
  );
}
