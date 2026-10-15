<script lang="ts">
  import { onMount } from "svelte";
  import AddModal from "../modals/AddModal.svelte";
  import ChangeModal from "../modals/ChangeModal.svelte";
  import { coursesStore } from "../states/coursesStore";
  import { usersStore } from "../../users/states/usersStore";
  import { formatDate, showConfirmDialog } from "../../../helpers/toolsHelper";
  import {
    Plus,
    GraduationCap,
    Users,
    Video,
    Eye,
    Pencil,
    Trash2,
    Funnel,
    Search,
    LoaderCircle,
    Star,
  } from "lucide-svelte";

  let loadingCourses = false;
  let onlyMine = false;
  let searchQuery = "";
  let showAddModal = false;
  let showChangeModal = false;
  let selectedCourseId: number | string | null = null;

  $: profile = $usersStore.profile;
  $: courses = $coursesStore.courses || [];

  onMount(() => {
    loadCourses();
  });

  function loadCourses() {
    loadingCourses = true;
    Promise.resolve(coursesStore.asyncSetCourses(onlyMine)).finally(() => {
      loadingCourses = false;
    });
  }

  let prevOnlyMine = onlyMine;
  $: if (onlyMine !== prevOnlyMine) {
    prevOnlyMine = onlyMine;
    loadCourses();
  }

  $: if ($coursesStore.isCourseDelete) {
    coursesStore.setIsCourseDelete(false);
    if ($coursesStore.isCourseDeleted) {
      coursesStore.setIsCourseDeleted(false);
      loadCourses();
    }
  }

  function isOwner(course: any): boolean {
    return String(course.user_id) === String(profile.id);
  }

  function studentCount(course: any): number {
    return course.students ? course.students.length : 0;
  }

  function ratingLabel(course: any): string {
    return course.avg_ratings ? Number(course.avg_ratings).toFixed(1) : "-";
  }

  function authorName(course: any): string {
    if (course.author && course.author.name) return course.author.name;
    return "-";
  }

  function handleEditCourse(courseId: number | string) {
    selectedCourseId = courseId;
    showChangeModal = true;
  }

  async function handleDeleteCourse(courseId: number | string) {
    const result = await showConfirmDialog("Apakah Anda yakin ingin menghapus kursus ini?");
    if (result.isConfirmed) {
      coursesStore.asyncSetIsCourseDelete(courseId);
    }
  }

  $: filteredCourses = courses.filter((course) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const title = course.title ? course.title.toLowerCase() : "";
    const description = course.description ? course.description.toLowerCase() : "";
    return title.includes(q) || description.includes(q);
  });

  $: totalCount = courses.length;
  $: joinedCount = courses.filter((c) => (c.students || []).includes(profile?.id as number)).length;
  $: totalContents = courses.reduce((sum, c) => sum + (c.total_contents ? Number(c.total_contents) : 0), 0);
</script>

{#if profile}
  <div class="space-y-8 animate-in fade-in duration-300">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Daftar Kursus</h1>
        <p class="text-sm text-slate-600 mt-1">
          Temukan kursus baru atau kelola kursus yang kamu buat sendiri.
        </p>
      </div>
      <button
        type="button"
        data-testid="add-course-btn"
        on:click={() => (showAddModal = true)}
        class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-700 hover:bg-indigo-800 shadow-md shadow-indigo-600/25 transition-all self-start sm:self-auto"
      >
        <Plus size={18} strokeWidth={2.5} />
        <span>Tambah Kursus</span>
      </button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-600">Total Kursus</p>
          <p data-testid="stat-total" class="text-3xl font-black text-slate-800 mt-1">{totalCount}</p>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
          <GraduationCap size={26} strokeWidth={2} />
        </div>
      </div>

      <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-600">Kursus Diikuti</p>
          <p data-testid="stat-joined" class="text-3xl font-black text-emerald-700 mt-1">{joinedCount}</p>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
          <Users size={26} strokeWidth={2} />
        </div>
      </div>

      <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-600">Total Konten</p>
          <p data-testid="stat-contents" class="text-3xl font-black text-amber-700 mt-1">{totalContents}</p>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
          <Video size={26} strokeWidth={2} />
        </div>
      </div>
    </div>

    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div class="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="relative flex-1 max-w-md">
          <Search size={18} class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            type="search"
            aria-label="Cari kursus"
            data-testid="search-course-input"
            bind:value={searchQuery}
            placeholder="Cari judul atau deskripsi..."
            class="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
          />
        </div>

        <div class="flex items-center gap-2.5">
          <span class="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
            <Funnel size={16} /> Filter:
          </span>
          <div class="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-700">
            <button
              type="button"
              data-testid="filter-all-btn"
              aria-pressed={!onlyMine}
              on:click={() => (onlyMine = false)}
              class="px-3 py-1.5 rounded-lg transition-all {!onlyMine ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}"
            >
              Semua
            </button>
            <button
              type="button"
              data-testid="filter-mine-btn"
              aria-pressed={onlyMine}
              on:click={() => (onlyMine = true)}
              class="px-3 py-1.5 rounded-lg transition-all {onlyMine ? 'bg-white text-indigo-800 shadow-xs' : 'hover:text-slate-900'}"
            >
              Milik Saya
            </button>
          </div>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-slate-700">
          <thead class="bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-600 border-b border-slate-100">
            <tr>
              <th scope="col" class="px-5 py-3.5 text-center w-16">ID</th>
              <th scope="col" class="px-5 py-3.5">Kursus</th>
              <th scope="col" class="px-5 py-3.5 hidden md:table-cell">Pengajar</th>
              <th scope="col" class="px-5 py-3.5 hidden lg:table-cell">Diperbarui</th>
              <th scope="col" class="px-5 py-3.5">Statistik</th>
              <th scope="col" class="px-5 py-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#if loadingCourses && filteredCourses.length === 0}
              <tr>
                <td colspan="6" class="px-6 py-12 text-center text-slate-600">
                  <LoaderCircle size={36} class="mx-auto text-indigo-600 animate-spin mb-2" />
                  <p class="font-medium">Memuat daftar kursus...</p>
                </td>
              </tr>
            {:else if filteredCourses.length === 0}
              <tr>
                <td colspan="6" class="px-6 py-12 text-center text-slate-600">
                  <GraduationCap size={40} class="mx-auto text-slate-500 mb-2" />
                  <p class="font-medium">Belum ada data kursus yang cocok.</p>
                </td>
              </tr>
            {:else}
              {#each filteredCourses as course (course.id)}
                <tr data-testid={`course-row-${course.id}`} class="hover:bg-slate-50/70 transition-colors">
                  <td class="px-5 py-4 text-center font-mono text-xs font-bold text-slate-600">
                    {"#" + course.id}
                  </td>
                  <td class="px-5 py-4">
                    <div class="flex items-center gap-3">
                      {#if course.cover}
                        <img
                          src={course.cover}
                          alt=""
                          width="40"
                          height="40"
                          loading="lazy"
                          class="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                      {/if}
                      <div>
                        <p class="font-semibold text-slate-800 leading-snug">{course.title}</p>
                        {#if course.description}
                          <p class="text-xs text-slate-600 line-clamp-1 mt-0.5">{course.description}</p>
                        {/if}
                      </div>
                    </div>
                  </td>
                  <td class="px-5 py-4 hidden md:table-cell text-xs text-slate-700">{authorName(course)}</td>
                  <td class="px-5 py-4 hidden lg:table-cell text-xs text-slate-700">
                    {formatDate(course.updated_at)}
                  </td>
                  <td class="px-5 py-4">
                    <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-700">
                      <span class="inline-flex items-center gap-1"><Users size={14} />{`${studentCount(course)} peserta`}</span>
                      <span class="inline-flex items-center gap-1"><Video size={14} />{`${course.total_contents ? Number(course.total_contents) : 0} konten`}</span>
                      <span class="inline-flex items-center gap-1"><Star size={14} />{`${ratingLabel(course)}`}</span>
                    </div>
                  </td>
                  <td class="px-5 py-4 text-right">
                    <div class="inline-flex items-center gap-1.5">
                      <a
                        href={`/courses/${course.id}`}
                        data-testid={`view-course-${course.id}`}
                        aria-label={`Lihat detail ${course.title}`}
                        class="p-1.5 text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Eye size={18} />
                      </a>
                      {#if isOwner(course)}
                        <button
                          type="button"
                          data-testid={`edit-course-${course.id}`}
                          aria-label={`Ubah ${course.title}`}
                          on:click={() => handleEditCourse(course.id)}
                          class="p-1.5 text-slate-700 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          type="button"
                          data-testid={`delete-course-${course.id}`}
                          aria-label={`Hapus ${course.title}`}
                          on:click={() => handleDeleteCourse(course.id)}
                          class="p-1.5 text-slate-700 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      {/if}
                    </div>
                  </td>
                </tr>
              {/each}
            {/if}
          </tbody>
        </table>
      </div>
    </div>

    <AddModal show={showAddModal} on:close={() => (showAddModal = false)} />
    <ChangeModal
      show={showChangeModal}
      courseId={selectedCourseId}
      on:close={() => (showChangeModal = false)}
    />
  </div>
{/if}
