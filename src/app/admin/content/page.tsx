'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { getAdminContentService } from '@/lib/admin/clientService';
import { SiteEditableContent } from '@/types';

const defaultContent: SiteEditableContent = {
  eventsIntro: '',
  galleryIntro: '',
  leadershipCurrentYear: 'AY 26-27',
  storyIntro: '',
  storyMissionTitle: '',
  storyMissionBody: '',
  storyActivitiesTitle: '',
  storyActivitiesIntro: '',
  storyActivities: [],
};

type ContentFormState = SiteEditableContent & {
  storyActivitiesText: string;
};

function toContentFormState(content: SiteEditableContent): ContentFormState {
  return {
    ...content,
    storyActivitiesText: content.storyActivities.join('\n'),
  };
}

export default function AdminContentPage() {
  const service = useMemo(() => getAdminContentService(), []);

  const [content, setContent] = useState<ContentFormState>({
    ...defaultContent,
    storyActivitiesText: '',
  });
  const [loading, setLoading] = useState(true);
  const [savingContent, setSavingContent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedContent = await service.getSiteContent();
      setContent(toContentFormState(loadedContent));
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load editable content.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function onSubmitContent(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const storyActivities = content.storyActivitiesText
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);

    if (
      !content.eventsIntro.trim() ||
      !content.galleryIntro.trim() ||
      !content.leadershipCurrentYear.trim() ||
      !content.storyIntro.trim() ||
      !content.storyMissionTitle.trim() ||
      !content.storyMissionBody.trim() ||
      !content.storyActivitiesTitle.trim() ||
      !content.storyActivitiesIntro.trim() ||
      storyActivities.length === 0
    ) {
      setError('All site content fields are required, including at least one story activity.');
      return;
    }

    try {
      setSavingContent(true);
      await service.updateSiteContent({
        eventsIntro: content.eventsIntro.trim(),
        galleryIntro: content.galleryIntro.trim(),
        leadershipCurrentYear: content.leadershipCurrentYear.trim(),
        storyIntro: content.storyIntro.trim(),
        storyMissionTitle: content.storyMissionTitle.trim(),
        storyMissionBody: content.storyMissionBody.trim(),
        storyActivitiesTitle: content.storyActivitiesTitle.trim(),
        storyActivitiesIntro: content.storyActivitiesIntro.trim(),
        storyActivities,
      });
      setSuccess('Site content updated.');
      await loadData();
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : 'Unable to save content.';
      setError(message);
    } finally {
      setSavingContent(false);
    }
  }

  return (
    <div className="space-y-6 text-gray-900">
      <header>
        <h2 className="text-2xl font-bold">Site Content</h2>
        <p className="mt-1 text-sm text-gray-600">
          Update public page text and set the current leadership academic year.
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

      {loading ? <p className="text-sm text-gray-600">Loading content...</p> : null}

      {!loading ? (
        <form onSubmit={onSubmitContent} className="space-y-4 rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold">Public Page Copy</h3>

          <label className="text-sm">
            <span className="mb-1 block font-medium">Events page intro</span>
            <textarea
              value={content.eventsIntro}
              onChange={(event) =>
                setContent({ ...content, eventsIntro: event.target.value })
              }
              className="min-h-24 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-medium">Gallery page intro</span>
            <textarea
              value={content.galleryIntro}
              onChange={(event) =>
                setContent({ ...content, galleryIntro: event.target.value })
              }
              className="min-h-24 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-medium">Current leadership academic year</span>
            <input
              value={content.leadershipCurrentYear}
              onChange={(event) =>
                setContent({ ...content, leadershipCurrentYear: event.target.value })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="AY 26-27"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-medium">Story intro</span>
            <textarea
              value={content.storyIntro}
              onChange={(event) =>
                setContent({ ...content, storyIntro: event.target.value })
              }
              className="min-h-28 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-medium">Story mission title</span>
              <input
                value={content.storyMissionTitle}
                onChange={(event) =>
                  setContent({ ...content, storyMissionTitle: event.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium">Story activities title</span>
              <input
                value={content.storyActivitiesTitle}
                onChange={(event) =>
                  setContent({ ...content, storyActivitiesTitle: event.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>
          </div>

          <label className="text-sm">
            <span className="mb-1 block font-medium">Story mission body</span>
            <textarea
              value={content.storyMissionBody}
              onChange={(event) =>
                setContent({ ...content, storyMissionBody: event.target.value })
              }
              className="min-h-24 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-medium">Story activities intro</span>
            <textarea
              value={content.storyActivitiesIntro}
              onChange={(event) =>
                setContent({ ...content, storyActivitiesIntro: event.target.value })
              }
              className="min-h-20 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-medium">Story activities</span>
            <textarea
              value={content.storyActivitiesText}
              onChange={(event) =>
                setContent({ ...content, storyActivitiesText: event.target.value })
              }
              className="min-h-28 w-full rounded-md border border-gray-300 px-3 py-2"
            />
            <span className="mt-1 block text-xs text-gray-500">
              Put one activity on each line.
            </span>
          </label>

          <button
            type="submit"
            disabled={savingContent}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingContent ? 'Saving...' : 'Save Content'}
          </button>
        </form>
      ) : null}
    </div>
  );
}
