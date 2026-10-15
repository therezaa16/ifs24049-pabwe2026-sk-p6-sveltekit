<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Video, X, LoaderCircle } from "lucide-svelte";
  import { coursesStore } from "../states/coursesStore";
  import { showErrorDialog } from "../../../helpers/toolsHelper";

  export let show = false;
  export let courseId = null;
  // Bila content diisi, modal bekerja sebagai form ubah; bila null, sebagai form tambah.
  export let content = null;
  export let onClose = undefined;

  const dispatch = createEventDispatcher();

  let loading = false;
  let title = "";
  let youtube = "";
  let loadedKey = null;

  $: isEdit = !!content;

  function handleClose() {
    loadedKey = null;
    dispatch("close");
    if (onClose) onClose();
  }

  $: document.body.style.overflow = show ? "hidden" : "auto";

  // Isi form sekali setiap modal dibuka.
  $: if (show && loadedKey === null) {
    loadedKey = content ? `edit-${content.id}` : "add";
    title = content ? content.title || "" : "";
    youtube = content ? content.youtube || "" : "";
  }

  function finishMutation() {
    loading = false;
    coursesStore.asyncSetCourse(courseId);
    handleClose();
  }

  $: if ($coursesStore.isContentAdd) {
    coursesStore.setIsContentAdd(false);
    loading = false;
    if ($coursesStore.isContentAdded) {
      coursesStore.setIsContentAdded(false);
      finishMutation();
    }
  }

  $: if ($coursesStore.isContentChange) {
    coursesStore.setIsContentChange(false);
    loading = false;
    if ($coursesStore.isContentChanged) {
      coursesStore.setIsContentChanged(false);
      finishMutation();
    }
  }

  function handleSave() {
    if (!title.trim()) {
      showErrorDialog("Judul tidak boleh kosong");
      return;
    }

    if (!youtube.trim()) {
      showErrorDialog("Link YouTube tidak boleh kosong");
      return;
    }

    loading = true;
    if (isEdit) {
      coursesStore.asyncSetIsContentChange(content.id, title.trim(), youtube.trim());
    } else {
      coursesStore.asyncSetIsContentAdd(courseId, title.trim(), youtube.trim());
    }
  }
</script>

{#if show}
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="content-modal-heading"
    data-testid="content-modal"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
  >
    <div class="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <Video size={18} strokeWidth={2.5} />
          </div>
          <h2 id="content-modal-heading" class="text-base font-bold text-slate-800">
            {isEdit ? "Ubah Konten" : "Tambah Konten"}
          </h2>
        </div>
        <button
          type="button"
          data-testid="close-content-modal-btn"
          aria-label="Tutup"
          on:click={handleClose}
          class="p-2 rounded-xl text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <form on:submit|preventDefault={handleSave} class="p-6 space-y-4">
        <div>
          <label for="content-title-input" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Judul Konten <span class="text-red-600">*</span>
          </label>
          <input
            id="content-title-input"
            type="text"
            data-testid="content-title-input"
            bind:value={title}
            placeholder="Contoh: Pengenalan HTML"
            class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-sm"
          />
        </div>

        <div>
          <label for="content-youtube-input" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Link YouTube <span class="text-red-600">*</span>
          </label>
          <input
            id="content-youtube-input"
            type="url"
            data-testid="content-youtube-input"
            bind:value={youtube}
            placeholder="https://www.youtube.com/watch?v=..."
            class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-sm"
          />
        </div>

        <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            data-testid="cancel-content-modal-btn"
            on:click={handleClose}
            disabled={loading}
            class="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            data-testid="submit-content-modal-btn"
            disabled={loading}
            class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-xl shadow-md shadow-indigo-600/25 transition-all disabled:opacity-60"
          >
            {#if loading}
              <LoaderCircle size={18} class="animate-spin" />
              <span>Menyimpan...</span>
            {:else}
              <span>{isEdit ? "Perbarui Konten" : "Tambah Konten"}</span>
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
