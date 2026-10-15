import { describe, it, expect, vi, beforeEach } from "vitest";
import AddModal from "./AddModal.svelte";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";

const tick = () => new Promise((r) => setTimeout(r, 10));

describe("AddModal", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => {});
  });

  it("should not render when show is false", () => {
    const { wrapper } = renderWithProviders(AddModal, { props: { show: false } });
    expect(wrapper.find('[data-testid="add-course-modal"]').exists()).toBe(false);
    expect(document.body.style.overflow).toBe("auto");
  });

  it("should render form and lock body scroll when shown", () => {
    const { wrapper } = renderWithProviders(AddModal, { props: { show: true } });
    expect(wrapper.find('[data-testid="add-course-modal"]').exists()).toBe(true);
    expect(wrapper.text()).toContain("Tambah Kursus Baru");
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("should show validation error if title is empty", async () => {
    const { wrapper, coursesStore } = renderWithProviders(AddModal, { props: { show: true } });
    const addSpy = vi.spyOn(coursesStore, "asyncSetIsCourseAdd").mockResolvedValue(undefined as any);
    await wrapper.find("form").trigger("submit");
    expect(toolsHelper.showErrorDialog).toHaveBeenCalledWith("Judul tidak boleh kosong");
    expect(addSpy).not.toHaveBeenCalled();
  });

  it("should show validation error if description is empty", async () => {
    const { wrapper } = renderWithProviders(AddModal, { props: { show: true } });
    await wrapper.find('[data-testid="add-course-title-input"]').setValue("Judul");
    await wrapper.find("form").trigger("submit");
    expect(toolsHelper.showErrorDialog).toHaveBeenCalledWith("Deskripsi tidak boleh kosong");
  });

  it("should submit trimmed data and close after the store reports success", async () => {
    const closeSpy = vi.fn();
    const { wrapper, coursesStore } = renderWithProviders(AddModal, {
      props: { show: true, onClose: closeSpy },
    });
    const addSpy = vi.spyOn(coursesStore, "asyncSetIsCourseAdd").mockResolvedValue(undefined as any);
    const listSpy = vi.spyOn(coursesStore, "asyncSetCourses").mockResolvedValue(undefined as any);

    await wrapper.find('[data-testid="add-course-title-input"]').setValue("  Kampus  ");
    await wrapper.find('[data-testid="add-course-description-input"]').setValue(" Tautan kampus ");
    await wrapper.find("form").trigger("submit");
    await tick();

    expect(addSpy).toHaveBeenCalledWith("Kampus", "Tautan kampus");
    expect(wrapper.text()).toContain("Menyimpan...");

    coursesStore.setIsCourseAdded(true);
    coursesStore.setIsCourseAdd(true);
    await tick();

    expect(listSpy).toHaveBeenCalled();
    expect(closeSpy).toHaveBeenCalled();
    expect(wrapper.text()).not.toContain("Menyimpan...");
    expect(wrapper.find('[data-testid="add-course-title-input"]').element.value).toBe("");
  });

  it("should stay open when the store reports a failed add", async () => {
    const closeSpy = vi.fn();
    const { wrapper, coursesStore } = renderWithProviders(AddModal, {
      props: { show: true, onClose: closeSpy },
    });
    vi.spyOn(coursesStore, "asyncSetIsCourseAdd").mockResolvedValue(undefined as any);

    await wrapper.find('[data-testid="add-course-title-input"]').setValue("A");
    await wrapper.find('[data-testid="add-course-description-input"]').setValue("B");
    await wrapper.find("form").trigger("submit");

    coursesStore.setIsCourseAdded(false);
    coursesStore.setIsCourseAdd(true);
    await tick();

    expect(closeSpy).not.toHaveBeenCalled();
    expect(wrapper.text()).not.toContain("Menyimpan...");
  });

  it("should call onClose from close and cancel buttons", async () => {
    const closeSpy = vi.fn();
    const { wrapper } = renderWithProviders(AddModal, { props: { show: true, onClose: closeSpy } });
    await wrapper.find('[data-testid="close-add-modal-btn"]').trigger("click");
    await wrapper.find('[data-testid="cancel-add-modal-btn"]').trigger("click");
    expect(closeSpy).toHaveBeenCalledTimes(2);
  });

  it("should close without an onClose callback", async () => {
    const { wrapper } = renderWithProviders(AddModal, { props: { show: true } });
    await wrapper.find('[data-testid="cancel-add-modal-btn"]').trigger("click");
    expect(wrapper.exists()).toBe(true);
  });
});
