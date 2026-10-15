<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { coursesStore } from "../states/coursesStore";
  import { usersStore } from "../../users/states/usersStore";
  import { getYoutubeEmbedUrl } from "../utils/youtube";
  import { ArrowLeft, Video, CircleCheck, Circle, LoaderCircle, ExternalLink } from "lucide-svelte";

  export let courseId: number | string;
  export let contentId: number | string;

  let updating = false;

  $: profile = $usersStore.profile;
  $: course = $coursesStore.course;
  $: content = $coursesStore.content;
  $: isOwner = !!course && String(course.user_id) === String(profile?.id);
  $: isStudent = !isOwner && !!course && (course.students || []).map(Number).includes(Number(profile?.id));
  $: embedUrl = content ? getYoutubeEmbedUrl(content.youtube) : null;
  $: isFinished = !!content && !!content.my_status_finished;

  onMount(() => {
    coursesStore.asyncSetCourse(courseId);
    coursesStore.asyncSetContent(contentId);
  });

  let prevContentId = contentId;
  $: if (contentId !== prevContentId) {
    prevContentId = contentId;
    coursesStore.asyncSetContent(contentId);
  }

  $: if ($coursesStore.isContent) {
    coursesStore.setIsContent(false);
    if (!content) {
      goto(`/courses/${courseId}`);
    }
  }

  $: if ($coursesStore.isCourse) {
    coursesStore.setIsCourse(false);
    if (!course) {
      goto("/");
    }
  }

  $: if ($coursesStore.isLearnChange) {
    coursesStore.setIsLearnChange(false);
    updating = false;
    if ($coursesStore.isLearnChanged) {
      coursesStore.setIsLearnChanged(false);
      coursesStore.asyncSetContent(contentId);
    }
  }

  function handleToggleFinished() {
    updating = true;
    coursesStore.asyncSetIsLearnChange(content.id, isFinished ? 0 : 1);
  }
</script>

{#if !profile || !content}
  <div class="flex flex-col items-center justify-center py-20" role="status" aria-label="Memuat">
    <div class="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
{:else}
  <div class="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
    <a
      href={`/courses/${courseId}`}
      data-testid="back-to-course-link"
      class="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-indigo-700 transition-colors"
    >
      <ArrowLeft size={18} />
      Kembali ke Kursus
    </a>

    <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      {#if embedUrl}
        <div class="aspect-video w-full bg-slate-900">
          <iframe
            data-testid="content-player"
            src={embedUrl}
            title={`Video: ${content.title}`}
            loading="lazy"
            class="w-full h-full"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>
      {:else}
        <div data-testid="content-invalid" class="p-8 text-center text-slate-700 bg-slate-50">
          <Video size={36} class="mx-auto text-slate-500 mb-2" />
          <p class="font-medium">Tautan YouTube tidak dapat ditampilkan.</p>
          <a
            href={content.youtube}
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 mt-2 text-sm font-semibold text-indigo-700 hover:underline"
          >
            Buka tautan <ExternalLink size={14} />
          </a>
        </div>
      {/if}

      <div class="p-6 sm:p-8 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-600">
              {course ? course.title : ""}
            </p>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{content.title}</h1>
          </div>

          {#if isStudent}
            <button
              type="button"
              data-testid="toggle-finished-btn"
              disabled={updating}
              on:click={handleToggleFinished}
              class="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors disabled:opacity-60 {isFinished
                ? 'text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100'
                : 'text-white bg-indigo-700 hover:bg-indigo-800'}"
            >
              {#if updating}
                <LoaderCircle size={18} class="animate-spin" />
                <span>Menyimpan...</span>
              {:else if isFinished}
                <CircleCheck size={18} />
                <span>Selesai (batalkan)</span>
              {:else}
                <Circle size={18} />
                <span>Tandai Selesai</span>
              {/if}
            </button>
          {/if}
        </div>

        {#if !isOwner && !isStudent}
          <p data-testid="not-student-note" class="text-sm text-slate-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
            Daftar pada kursus ini untuk mencatat progres belajarmu.
          </p>
        {/if}
      </div>
    </div>
  </div>
{/if}
