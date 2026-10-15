import { describe, it, expect, vi, beforeEach } from "vitest";
import ContentModal from "./ContentModal.svelte";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";

const tick = () => new Promise((r) => setTimeout(r, 10));

describe("ContentModal", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => {});
  });

  it("should not render when show is false", () => {
    const { wrapper } = renderWithProviders(ContentModal, { props: { show: false, courseId: 1 } });
    expect(wrapper.find('[data-testid="content-modal"]').exists()).toBe(false);
    expect(document.body.style.overflow).toBe("auto");
  });

  describe("add mode", () => {
    it("should validate empty title and url", async () => {
      const { wrapper } = renderWithProviders(ContentModal, { props: { show: true, courseId: 1 } });
      expect(wrapper.text()).toContain("Tambah Konten");
      await wrapper.find("form").trigger("submit");
      expect(toolsHelper.showErrorDialog).toHaveBeenCalledWith("Judul tidak boleh kosong");

      await wrapper.find('[data-testid="content-title-input"]').setValue("Pengenalan");
      await wrapper.find("form").trigger("submit");
      expect(toolsHelper.showErrorDialog).toHaveBeenCalledWith("Link YouTube tidak boleh kosong");
    });

    it("should add an content and refresh data after success", async () => {
      const closeSpy = vi.fn();
      const { wrapper, coursesStore } = renderWithProviders(ContentModal, {
        props: { show: true, courseId: 9, onClose: closeSpy },
      });
      const addSpy = vi.spyOn(coursesStore, "asyncSetIsContentAdd").mockResolvedValue(undefined as any);
      const detailSpy = vi.spyOn(coursesStore, "asyncSetCourse").mockResolvedValue(undefined as any);

      await wrapper.find('[data-testid="content-title-input"]').setValue(" Pengenalan ");
      await wrapper.find('[data-testid="content-youtube-input"]').setValue(" https://youtu.be/aaaaaaaaaaa ");
      await wrapper.find("form").trigger("submit");
      expect(addSpy).toHaveBeenCalledWith(9, "Pengenalan", "https://youtu.be/aaaaaaaaaaa");
      expect(wrapper.text()).toContain("Menyimpan...");

      coursesStore.setIsContentAdded(true);
      coursesStore.setIsContentAdd(true);
      await tick();

      expect(detailSpy).toHaveBeenCalledWith(9);
      expect(closeSpy).toHaveBeenCalled();
    });

    it("should stay open when add fails", async () => {
      const closeSpy = vi.fn();
      const { coursesStore } = renderWithProviders(ContentModal, {
        props: { show: true, courseId: 9, onClose: closeSpy },
      });
      coursesStore.setIsContentAdded(false);
      coursesStore.setIsContentAdd(true);
      await tick();
      expect(closeSpy).not.toHaveBeenCalled();
    });
  });

  describe("edit mode", () => {
    const content = { id: 5, title: "Lama", youtube: "https://youtu.be/lamalamalam" };

    it("should prefill the form from the content", () => {
      const { wrapper } = renderWithProviders(ContentModal, {
        props: { show: true, courseId: 1, content },
      });
      expect(wrapper.text()).toContain("Ubah Konten");
      expect(wrapper.find('[data-testid="content-title-input"]').element.value).toBe("Lama");
      expect(wrapper.find('[data-testid="content-youtube-input"]').element.value).toBe("https://youtu.be/lamalamalam");
    });

    it("should fall back to empty strings for contents without fields", () => {
      const { wrapper } = renderWithProviders(ContentModal, {
        props: { show: true, courseId: 1, content: { id: 6 } },
      });
      expect(wrapper.find('[data-testid="content-title-input"]').element.value).toBe("");
      expect(wrapper.find('[data-testid="content-youtube-input"]').element.value).toBe("");
    });

    it("should update the content and refresh data after success", async () => {
      const closeSpy = vi.fn();
      const { wrapper, coursesStore } = renderWithProviders(ContentModal, {
        props: { show: true, courseId: 1, content, onClose: closeSpy },
      });
      const changeSpy = vi.spyOn(coursesStore, "asyncSetIsContentChange").mockResolvedValue(undefined as any);
      vi.spyOn(coursesStore, "asyncSetCourse").mockResolvedValue(undefined as any);

      await wrapper.find('[data-testid="content-title-input"]').setValue("Baru");
      await wrapper.find("form").trigger("submit");
      expect(changeSpy).toHaveBeenCalledWith(5, "Baru", "https://youtu.be/lamalamalam");

      coursesStore.setIsContentChanged(true);
      coursesStore.setIsContentChange(true);
      await tick();
      expect(closeSpy).toHaveBeenCalled();
    });

    it("should stay open when update fails", async () => {
      const closeSpy = vi.fn();
      const { coursesStore } = renderWithProviders(ContentModal, {
        props: { show: true, courseId: 1, content, onClose: closeSpy },
      });
      coursesStore.setIsContentChanged(false);
      coursesStore.setIsContentChange(true);
      await tick();
      expect(closeSpy).not.toHaveBeenCalled();
    });
  });

  it("should call onClose from close and cancel buttons, and work without callback", async () => {
    const closeSpy = vi.fn();
    const first = renderWithProviders(ContentModal, {
      props: { show: true, courseId: 1, onClose: closeSpy },
    });
    await first.wrapper.find('[data-testid="close-content-modal-btn"]').trigger("click");
    await first.wrapper.find('[data-testid="cancel-content-modal-btn"]').trigger("click");
    expect(closeSpy).toHaveBeenCalledTimes(2);
    first.unmount();

    const second = renderWithProviders(ContentModal, { props: { show: true, courseId: 1 } });
    await second.wrapper.find('[data-testid="cancel-content-modal-btn"]').trigger("click");
    expect(second.wrapper.exists()).toBe(true);
  });
});
