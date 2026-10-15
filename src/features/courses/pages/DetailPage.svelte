<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import ChangeCoverModal from "../modals/ChangeCoverModal.svelte";
  import ChangeModal from "../modals/ChangeModal.svelte";
  import ContentModal from "../modals/ContentModal.svelte";
  import { coursesStore } from "../states/coursesStore";
  import { usersStore } from "../../users/states/usersStore";
  import { formatDate, showConfirmDialog, showErrorDialog } from "../../../helpers/toolsHelper";
  import {
    ArrowLeft,
    ImagePlus,
    PenLine,
    Trash2,
    Calendar,
    Plus,
    Pencil,
    Video,
    Users,
    Star,
    CircleCheck,
    UserPlus,
    LogOut,
    LoaderCircle,
  } from "lucide-svelte";

  export let courseId: number | string;

  $: profile = $usersStore.profile;
  $: course = $coursesStore.course;
  $: contents = getContents(course);
  $: ratings = getRatings(course);
  // Antarmuka pemilik didahulukan bila pengguna sekaligus pemilik dan peserta.
  $: isOwner = !!course && String(course.user_id) === String(profile?.id);
  $: isStudent = !isOwner && !!course && (course.students || []).map(Number).includes(Number(profile?.id));

  let showCoverModal = false;
  let showEditModal = false;
  let showContentModal = false;
  let selectedContent: any = null;
  let ratingValue = "5";
  let ratingComment = "";
  let ratingLoading = false;

  function getContents(c: any): any[] {
    if (c && c.contents) return c.contents;
    return [];
  }

  function getRatings(c: any): any[] {
    if (c && c.ratings) return c.ratings;
    return [];
  }

  onMount(() => {
    if (courseId) {
      coursesStore.asyncSetCourse(courseId);
    }
  });

  let prevId = courseId;
  $: if (courseId !== prevId) {
    prevId = courseId;
    coursesStore.asyncSetCourse(courseId);
  }

  $: if ($coursesStore.isCourse) {
    coursesStore.setIsCourse(false);
    if (!course) {
      goto("/");
    }
  }

  $: if ($coursesStore.isCourseDelete) {
    coursesStore.setIsCourseDelete(false);
    if ($coursesStore.isCourseDeleted) {
      coursesStore.setIsCourseDeleted(false);
      goto("/");
    }
  }

  $: if ($coursesStore.isStudentJoin) {
    coursesStore.setIsStudentJoin(false);
    if ($coursesStore.isStudentJoined) {
      coursesStore.setIsStudentJoined(false);
      coursesStore.asyncSetCourse(courseId);
    }
  }

  $: if ($coursesStore.isStudentLeave) {
    coursesStore.setIsStudentLeave(false);
    if ($coursesStore.isStudentLeft) {
      coursesStore.setIsStudentLeft(false);
      coursesStore.asyncSetCourse(courseId);
    }
  }

  $: if ($coursesStore.isRatingChange) {
    coursesStore.setIsRatingChange(false);
    ratingLoading = false;
    if ($coursesStore.isRatingChanged) {
      coursesStore.setIsRatingChanged(false);
      ratingComment = "";
      coursesStore.asyncSetCourse(courseId);
    }
  }

  $: if ($coursesStore.isContentDelete) {
    coursesStore.setIsContentDelete(false);
    if ($coursesStore.isContentDeleted) {
      coursesStore.setIsContentDeleted(false);
      coursesStore.asyncSetCourse(courseId);
    }
  }

  async function handleDelete() {
    const result = await showConfirmDialog("Apakah Anda yakin ingin menghapus kursus ini?");
    if (result.isConfirmed) {
      coursesStore.asyncSetIsCourseDelete(course.id);
    }
  }

  function handleJoin() {
    coursesStore.asyncSetIsStudentJoin(course.id);
  }

  async function handleLeave() {
    const result = await showConfirmDialog("Apakah Anda yakin ingin keluar dari kursus ini?");
    if (result.isConfirmed) {
      coursesStore.asyncSetIsStudentLeave(course.id);
    }
  }

  function handleSubmitRating() {
    if (!ratingComment.trim()) {
      showErrorDialog("Komentar tidak boleh kosong");
      return;
    }
    ratingLoading = true;
    coursesStore.asyncSetIsRatingChange(course.id, Number(ratingValue), ratingComment.trim());
  }

  function handleAddContent() {
    selectedContent = null;
    showContentModal = true;
  }

  function handleEditContent(content: any) {
    selectedContent = content;
    showContentModal = true;
  }

  async function handleDeleteContent(content: any) {
    const result = await showConfirmDialog("Apakah Anda yakin ingin menghapus konten ini?");
    if (result.isConfirmed) {
      coursesStore.asyncSetIsContentDelete(content.id);
    }
  }
</script>

{#if !profile || !course}
  <div class="flex flex-col items-center justify-center py-20" role="status" aria-label="Memuat">
    <div class="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
{:else}
  <div class="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <a
        href="/"
        data-testid="back-to-courses-link"
        class="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-indigo-700 transition-colors"
      >
        <ArrowLeft size={18} />
        Kembali ke Kursus
      </a>

      <div class="flex flex-wrap items-center gap-2">
        {#if isOwner}
          <button
            type="button"
            data-testid="edit-cover-btn"
            on:click={() => (showCoverModal = true)}
            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200/60 transition-colors"
          >
            <ImagePlus size={16} />
            Ubah Sampul
          </button>
          <button
            type="button"
            data-testid="edit-detail-course-btn"
            on:click={() => (showEditModal = true)}
            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 transition-colors"
          >
            <PenLine size={16} />
            Ubah Data
          </button>
          <button
            type="button"
            data-testid="delete-detail-course-btn"
            on:click={handleDelete}
            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-red-800 bg-red-50 hover:bg-red-100 border border-red-200/60 transition-colors"
          >
            <Trash2 size={16} />
            Hapus
          </button>
        {:else if isStudent}
          <button
            type="button"
            data-testid="leave-course-btn"
            on:click={handleLeave}
            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-red-800 bg-red-50 hover:bg-red-100 border border-red-200/60 transition-colors"
          >
            <LogOut size={16} />
            Keluar dari Kursus
          </button>
        {:else}
          <button
            type="button"
            data-testid="join-course-btn"
            on:click={handleJoin}
            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-white bg-indigo-700 hover:bg-indigo-800 transition-colors"
          >
            <UserPlus size={16} />
            Daftar Kursus
          </button>
        {/if}
      </div>
    </div>

    <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      {#if course.cover}
        <div class="relative w-full h-64 sm:h-80 bg-slate-900 overflow-hidden">
          <img src={course.cover} alt={`Sampul ${course.title}`} class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
        </div>
      {/if}

      <div class="p-6 sm:p-8 space-y-6">
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <span class="font-mono text-xs font-bold text-slate-600">{"#" + course.id}</span>
            {#if isOwner}
              <span data-testid="role-badge" class="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">Pemilik</span>
            {:else if isStudent}
              <span data-testid="role-badge" class="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">Peserta</span>
            {/if}
          </div>

          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{course.title}</h1>

          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
            {#if course.author?.name}
              <span data-testid="course-author">Pengajar: <strong class="text-slate-800">{course.author.name}</strong></span>
            {/if}
            <div class="flex items-center gap-1.5">
              <Calendar size={14} class="shrink-0" />
              <span>Diperbarui: <strong class="text-slate-800">{formatDate(course.updated_at)}</strong></span>
            </div>
          </div>
        </div>

        <p
          data-testid="course-detail-description"
          class="text-slate-700 bg-slate-50/60 p-5 rounded-2xl border border-slate-100 leading-relaxed whitespace-pre-line"
        >
          {course.description || "Tidak ada deskripsi untuk kursus ini."}
        </p>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="rounded-2xl border border-slate-200 p-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-600 flex items-center gap-1.5"><Users size={14} /> Peserta</p>
            <p data-testid="stat-students" class="text-2xl font-black text-slate-800 mt-1">{`${(course.students || []).length}`}</p>
          </div>
          <div class="rounded-2xl border border-slate-200 p-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-600 flex items-center gap-1.5"><Video size={14} /> Konten</p>
            <p data-testid="stat-contents" class="text-2xl font-black text-slate-800 mt-1">{`${contents.length}`}</p>
          </div>
          <div class="rounded-2xl border border-slate-200 p-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-600 flex items-center gap-1.5"><Star size={14} /> Rating</p>
            <p data-testid="stat-rating" class="text-2xl font-black text-slate-800 mt-1">{course.avg_ratings ? Number(course.avg_ratings).toFixed(1) : "-"}</p>
          </div>
          {#if isStudent}
            <div class="rounded-2xl border border-slate-200 p-4">
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-600 flex items-center gap-1.5"><CircleCheck size={14} /> Progres</p>
              <p data-testid="stat-progress" class="text-2xl font-black text-emerald-700 mt-1">{`${Number(course.my_percentage_finished || 0).toFixed(0)}%`}</p>
            </div>
          {/if}
        </div>

        <section aria-labelledby="contents-heading" class="space-y-3">
          <div class="flex items-center justify-between gap-3">
            <h2 id="contents-heading" class="text-lg font-bold text-slate-900">{`Daftar Konten (${contents.length})`}</h2>
            {#if isOwner}
              <button
                type="button"
                data-testid="add-content-btn"
                on:click={handleAddContent}
                class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-white bg-indigo-700 hover:bg-indigo-800 transition-colors"
              >
                <Plus size={16} strokeWidth={2.5} />
                Tambah Konten
              </button>
            {/if}
          </div>

          {#if contents.length === 0}
            <div data-testid="contents-empty" class="text-center py-10 text-slate-600 border border-dashed border-slate-300 rounded-2xl">
              <Video size={32} class="mx-auto text-slate-400 mb-2" />
              <p class="text-sm font-medium">Belum ada konten pada kursus ini.</p>
            </div>
          {:else}
            <ul class="space-y-2">
              {#each contents as content, index (content.id)}
                <li
                  data-testid={`content-row-${content.id}`}
                  class="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-200 bg-white"
                >
                  {#if isOwner || isStudent}
                    <a
                      href={`/courses/${course.id}/contents/${content.id}`}
                      data-testid={`content-link-${content.id}`}
                      class="min-w-0 flex-1 flex items-center gap-3 group"
                    >
                      <span class="w-9 h-9 shrink-0 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-sm font-bold">{index + 1}</span>
                      <span class="block font-semibold text-slate-800 truncate group-hover:text-indigo-700">{content.title}</span>
                    </a>
                  {:else}
                    <div class="min-w-0 flex-1 flex items-center gap-3">
                      <span class="w-9 h-9 shrink-0 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-sm font-bold">{index + 1}</span>
                      <span class="block font-semibold text-slate-800 truncate">{content.title}</span>
                    </div>
                  {/if}

                  {#if isStudent && content.my_status_finished}
                    <span data-testid={`content-finished-${content.id}`} class="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full shrink-0">
                      <CircleCheck size={14} /> Selesai
                    </span>
                  {/if}

                  {#if isOwner}
                    <div class="inline-flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        data-testid={`edit-content-${content.id}`}
                        aria-label={`Ubah konten ${content.title}`}
                        on:click={() => handleEditContent(content)}
                        class="p-1.5 text-slate-700 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        type="button"
                        data-testid={`delete-content-${content.id}`}
                        aria-label={`Hapus konten ${content.title}`}
                        on:click={() => handleDeleteContent(content)}
                        class="p-1.5 text-slate-700 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  {/if}
                </li>
              {/each}
            </ul>
          {/if}
        </section>

        <section aria-labelledby="ratings-heading" class="space-y-3">
          <h2 id="ratings-heading" class="text-lg font-bold text-slate-900">{`Rating & Ulasan (${ratings.length})`}</h2>

          {#if isStudent}
            <form
              data-testid="rating-form"
              on:submit|preventDefault={handleSubmitRating}
              class="rounded-2xl border border-slate-200 p-4 space-y-3"
            >
              <div>
                <label for="rating-select" class="block text-sm font-semibold text-slate-700 mb-1.5">Rating</label>
                <select
                  id="rating-select"
                  data-testid="rating-select"
                  bind:value={ratingValue}
                  class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                >
                  <option value="5">5 - Sangat baik</option>
                  <option value="4">4 - Baik</option>
                  <option value="3">3 - Cukup</option>
                  <option value="2">2 - Kurang</option>
                  <option value="1">1 - Buruk</option>
                </select>
              </div>
              <div>
                <label for="rating-comment" class="block text-sm font-semibold text-slate-700 mb-1.5">Komentar</label>
                <textarea
                  id="rating-comment"
                  data-testid="rating-comment"
                  bind:value={ratingComment}
                  rows="3"
                  placeholder="Tulis pengalaman belajarmu..."
                  class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                ></textarea>
              </div>
              <button
                type="submit"
                data-testid="rating-submit-btn"
                disabled={ratingLoading}
                class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-xl disabled:opacity-60 transition-colors"
              >
                {#if ratingLoading}
                  <LoaderCircle size={16} class="animate-spin" />
                  <span>Menyimpan...</span>
                {:else}
                  <Star size={16} />
                  <span>Simpan Rating</span>
                {/if}
              </button>
            </form>
          {/if}

          {#if ratings.length === 0}
            <p data-testid="ratings-empty" class="text-sm text-slate-600">Belum ada rating untuk kursus ini.</p>
          {:else}
            <ul class="space-y-2">
              {#each ratings as rating, i (i)}
                <li data-testid={`rating-row-${i}`} class="rounded-2xl border border-slate-200 p-3.5">
                  <p class="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <span>{rating.name}</span>
                    <span class="inline-flex items-center gap-1 text-xs text-amber-800"><Star size={14} />{`${rating.ratings}/5`}</span>
                  </p>
                  {#if rating.comment}
                    <p class="text-sm text-slate-700 mt-1">{rating.comment}</p>
                  {/if}
                </li>
              {/each}
            </ul>
          {/if}
        </section>
      </div>
    </div>

    <ChangeCoverModal show={showCoverModal} {course} onClose={() => (showCoverModal = false)} />

    <ChangeModal show={showEditModal} courseId={course.id} onClose={() => (showEditModal = false)} />

    <ContentModal
      show={showContentModal}
      courseId={course.id}
      content={selectedContent}
      onClose={() => (showContentModal = false)}
    />
  </div>
{/if}
