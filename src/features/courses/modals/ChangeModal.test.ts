import { describe, it, expect, vi, beforeEach } from "vitest";
import ChangeModal from "./ChangeModal.svelte";
import { renderWithProviders } from "../../../test-utils";
import courseApi from "../api/courseApi";
import * as toolsHelper from "../../../helpers/toolsHelper";

const tick = () => new Promise((r) => setTimeout(r, 20));

describe("ChangeModal", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => {});
  });

  it("should not render when show is false", () => {
    const { wrapper } = renderWithProviders(ChangeModal, {
      props: { show: false, courseId: 1 },
    });
    expect(wrapper.find('[data-testid="edit-course-modal"]').exists()).toBe(false);
  });

  it("should not fetch when no courseId", () => {
    const spy = vi.spyOn(courseApi, "getCourseById");
    renderWithProviders(ChangeModal, { props: { show: true, courseId: null } });
    expect(spy).not.toHaveBeenCalled();
  });

  it("should load existing data into the form", async () => {
    vi.spyOn(courseApi, "getCourseById").mockResolvedValue({
      id: 1,
      title: "Judul",
      description: "Deskripsi",
    });
    const { wrapper } = renderWithProviders(ChangeModal, {
      props: { show: true, courseId: 1 },
    });
    await tick();
    expect(wrapper.find('[data-testid="edit-course-title-input"]').element.value).toBe("Judul");
    expect(wrapper.find('[data-testid="edit-course-description-input"]').element.value).toBe(
      "Deskripsi"
    );
  });

  it("should fall back to defaults when fields are missing", async () => {
    vi.spyOn(courseApi, "getCourseById").mockResolvedValue({ id: 1 });
    const { wrapper } = renderWithProviders(ChangeModal, {
      props: { show: true, courseId: 1 },
    });
    await tick();
    expect(wrapper.find('[data-testid="edit-course-title-input"]').element.value).toBe("");
  });

  it("should keep the form untouched when the API returns nothing", async () => {
    vi.spyOn(courseApi, "getCourseById").mockResolvedValue(undefined);
    const { wrapper } = renderWithProviders(ChangeModal, {
      props: { show: true, courseId: 1 },
    });
    await tick();
    expect(wrapper.find('[data-testid="edit-course-title-input"]').element.value).toBe("");
  });

  it("should show error and close when loading fails", async () => {
    vi.spyOn(courseApi, "getCourseById").mockRejectedValue(new Error("x"));
    const closeSpy = vi.fn();
    renderWithProviders(ChangeModal, {
      props: { show: true, courseId: 1, onClose: closeSpy },
    });
    await tick();
    expect(toolsHelper.showErrorDialog).toHaveBeenCalledWith("Gagal mengambil data kursus");
    expect(closeSpy).toHaveBeenCalled();
  });

  describe("with loaded data", () => {
    const setup = async (props = {}) => {
      vi.spyOn(courseApi, "getCourseById").mockResolvedValue({
        id: 1,
        title: "Judul",
        description: "Deskripsi",
      });
      const utils = renderWithProviders(ChangeModal, {
        props: { show: true, courseId: 1, ...props },
      });
      await tick();
      return utils;
    };

    it("should validate empty title", async () => {
      const { wrapper } = await setup();
      await wrapper.find('[data-testid="edit-course-title-input"]').setValue("  ");
      await wrapper.find("form").trigger("submit");
      expect(toolsHelper.showErrorDialog).toHaveBeenCalledWith("Judul tidak boleh kosong");
    });

    it("should validate empty description", async () => {
      const { wrapper } = await setup();
      await wrapper.find('[data-testid="edit-course-description-input"]').setValue("  ");
      await wrapper.find("form").trigger("submit");
      expect(toolsHelper.showErrorDialog).toHaveBeenCalledWith("Deskripsi tidak boleh kosong");
    });

    it("should submit changes and close after success", async () => {
      const closeSpy = vi.fn();
      const { wrapper, coursesStore } = await setup({ onClose: closeSpy });
      const changeSpy = vi.spyOn(coursesStore, "asyncSetIsCourseChange").mockResolvedValue(undefined as any);
      const listSpy = vi.spyOn(coursesStore, "asyncSetCourses").mockResolvedValue(undefined as any);
      const detailSpy = vi.spyOn(coursesStore, "asyncSetCourse").mockResolvedValue(undefined as any);

      await wrapper.find('[data-testid="edit-course-title-input"]').setValue("Baru");
      await wrapper.find("form").trigger("submit");
      expect(changeSpy).toHaveBeenCalledWith(1, "Baru", "Deskripsi");
      expect(wrapper.text()).toContain("Menyimpan...");

      coursesStore.setIsCourseChanged(true);
      coursesStore.setIsCourseChange(true);
      await tick();

      expect(listSpy).toHaveBeenCalled();
      expect(detailSpy).toHaveBeenCalledWith(1);
      expect(closeSpy).toHaveBeenCalled();
    });

    it("should stay open when change fails", async () => {
      const closeSpy = vi.fn();
      const { coursesStore } = await setup({ onClose: closeSpy });
      coursesStore.setIsCourseChanged(false);
      coursesStore.setIsCourseChange(true);
      await tick();
      expect(closeSpy).not.toHaveBeenCalled();
    });

    it("should call onClose from close and cancel buttons", async () => {
      const closeSpy = vi.fn();
      const { wrapper } = await setup({ onClose: closeSpy });
      await wrapper.find('[data-testid="close-edit-modal-btn"]').trigger("click");
      await wrapper.find('[data-testid="cancel-edit-modal-btn"]').trigger("click");
      expect(closeSpy).toHaveBeenCalledTimes(2);
    });

    it("should close without an onClose callback", async () => {
      const { wrapper } = await setup();
      await wrapper.find('[data-testid="cancel-edit-modal-btn"]').trigger("click");
      expect(wrapper.exists()).toBe(true);
    });
  });
});
