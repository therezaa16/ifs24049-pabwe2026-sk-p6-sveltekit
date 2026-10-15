import { describe, it, expect, vi, beforeEach } from "vitest";
import HomePage from "./HomePage.svelte";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";
import courseApi from "../api/courseApi";
import { coursesStore } from "../states/coursesStore";

const tick = () => new Promise((r) => setTimeout(r, 20));

describe("Courses HomePage", () => {
  const mockProfile = { id: 1, name: "Abdullah", email: "abdul@del.org" };
  const mockCourses: any[] = [
    {
      id: 1,
      user_id: 1,
      title: "Pemrograman Web",
      description: "Belajar web",
      cover: "https://example.com/cover1.jpg",
      updated_at: "2024-02-26T02:44:47.000000Z",
      author: { name: "Abdullah" },
      students: [1, 2],
      total_contents: 3,
      avg_ratings: "4.5000",
    },
    {
      id: 2,
      user_id: 2,
      title: "Basis Data",
      description: null,
      cover: null,
      updated_at: "2024-02-26T02:44:47.000000Z",
      author: null,
      students: undefined,
      total_contents: 0,
      avg_ratings: null,
    },
    {
      id: 3,
      user_id: 1,
      title: null,
      description: "Hanya deskripsi",
      cover: null,
      updated_at: "2024-02-26T02:44:47.000000Z",
      author: { name: "" },
      students: [3],
      total_contents: 2,
      avg_ratings: "3.0000",
    },
  ];

  let loadSpy: any;

  beforeEach(() => {
    vi.restoreAllMocks();
    loadSpy = vi.spyOn(coursesStore, "asyncSetCourses").mockResolvedValue(undefined as any);
  });

  it("should render nothing when profile is not present", () => {
    const { wrapper } = renderWithProviders(HomePage, { preloadedState: { profile: null, courses: mockCourses } });
    expect(wrapper.find('[data-testid="add-course-btn"]').exists()).toBe(false);
  });

  it("should render empty state when there are no courses", async () => {
    const { wrapper } = renderWithProviders(HomePage, {
      preloadedState: { profile: mockProfile, courses: [] },
    });
    await tick();
    expect(wrapper.text()).toContain("Daftar Kursus");
    expect(wrapper.text()).toContain("Belum ada data kursus yang cocok.");
    expect(loadSpy).toHaveBeenCalledWith(false);
  });

  it("should treat a missing course list as empty", async () => {
    const { wrapper, coursesStore: store } = renderWithProviders(HomePage, {
      preloadedState: { profile: mockProfile },
    });
    store.setCourses(null);
    await tick();
    expect(wrapper.find('[data-testid="stat-total"]').text()).toBe("0");
  });

  it("should show a loading indicator while fetching", async () => {
    const { wrapper } = renderWithProviders(HomePage, {
      preloadedState: { profile: mockProfile, courses: [] },
    });
    await tick();
    loadSpy.mockReturnValue(new Promise(() => {}));
    await wrapper.find('[data-testid="filter-mine-btn"]').trigger("click");
    await tick();
    expect(wrapper.text()).toContain("Memuat daftar kursus...");
  });

  it("should render rows and statistics", async () => {
    const { wrapper } = renderWithProviders(HomePage, {
      preloadedState: { profile: mockProfile, courses: mockCourses },
    });
    await tick();

    expect(wrapper.find('[data-testid="stat-total"]').text()).toBe("3");
    expect(wrapper.find('[data-testid="stat-joined"]').text()).toBe("1");
    expect(wrapper.find('[data-testid="stat-contents"]').text()).toBe("5");
    const row1 = wrapper.find('[data-testid="course-row-1"]');
    expect(row1.text()).toContain("2 peserta");
    expect(row1.text()).toContain("3 konten");
    expect(row1.text()).toContain("4.5");
    expect(row1.find("img").exists()).toBe(true);
    const row2 = wrapper.find('[data-testid="course-row-2"]');
    expect(row2.text()).toContain("0 peserta");
    expect(row2.text()).toContain("0 konten");
    expect(row2.find("img").exists()).toBe(false);
    expect(wrapper.find('[data-testid="view-course-1"]').attributes("href")).toBe("/courses/1");
  });

  it("should only show edit/delete buttons for the owner", async () => {
    const { wrapper } = renderWithProviders(HomePage, {
      preloadedState: { profile: mockProfile, courses: mockCourses },
    });
    await tick();
    expect(wrapper.find('[data-testid="edit-course-1"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="delete-course-1"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="edit-course-2"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="delete-course-2"]').exists()).toBe(false);
  });

  it("should filter by search query on title and description", async () => {
    const { wrapper } = renderWithProviders(HomePage, {
      preloadedState: { profile: mockProfile, courses: mockCourses },
    });
    await tick();
    const input = wrapper.find('[data-testid="search-course-input"]');

    await input.setValue("web");
    expect(wrapper.find('[data-testid="course-row-1"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="course-row-2"]').exists()).toBe(false);

    await input.setValue("hanya deskripsi");
    expect(wrapper.find('[data-testid="course-row-3"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="course-row-1"]').exists()).toBe(false);

    await input.setValue("tidak ada");
    expect(wrapper.text()).toContain("Belum ada data kursus yang cocok.");

    await input.setValue("   ");
    expect(wrapper.find('[data-testid="course-row-1"]').exists()).toBe(true);
  });

  it("should reload when switching between all and mine filter", async () => {
    const { wrapper } = renderWithProviders(HomePage, {
      preloadedState: { profile: mockProfile, courses: mockCourses },
    });
    await tick();
    await wrapper.find('[data-testid="filter-mine-btn"]').trigger("click");
    await tick();
    expect(loadSpy).toHaveBeenLastCalledWith(true);
    await wrapper.find('[data-testid="filter-all-btn"]').trigger("click");
    await tick();
    expect(loadSpy).toHaveBeenLastCalledWith(false);
  });

  it("should delete a course after confirmation only", async () => {
    const confirmSpy = vi.spyOn(toolsHelper, "showConfirmDialog");
    const { wrapper, coursesStore: store } = renderWithProviders(HomePage, {
      preloadedState: { profile: mockProfile, courses: mockCourses },
    });
    const deleteSpy = vi.spyOn(store, "asyncSetIsCourseDelete").mockResolvedValue(undefined as any);
    await tick();

    confirmSpy.mockResolvedValueOnce({ isConfirmed: false } as any);
    await wrapper.find('[data-testid="delete-course-1"]').trigger("click");
    await tick();
    expect(deleteSpy).not.toHaveBeenCalled();

    confirmSpy.mockResolvedValueOnce({ isConfirmed: true } as any);
    await wrapper.find('[data-testid="delete-course-1"]').trigger("click");
    await tick();
    expect(deleteSpy).toHaveBeenCalledWith(1);
  });

  it("should reload after a delete completes, but not after a failed one", async () => {
    const { coursesStore: store } = renderWithProviders(HomePage, {
      preloadedState: { profile: mockProfile, courses: mockCourses },
    });
    await tick();
    loadSpy.mockClear();

    store.setIsCourseDeleted(false);
    store.setIsCourseDelete(true);
    await tick();
    expect(loadSpy).not.toHaveBeenCalled();

    store.setIsCourseDeleted(true);
    store.setIsCourseDelete(true);
    await tick();
    expect(loadSpy).toHaveBeenCalledTimes(1);
  });

  it("should open and close the add modal", async () => {
    const { wrapper } = renderWithProviders(HomePage, {
      preloadedState: { profile: mockProfile, courses: [] },
    });
    await tick();
    await wrapper.find('[data-testid="add-course-btn"]').trigger("click");
    expect(wrapper.find('[data-testid="add-course-modal"]').exists()).toBe(true);
    await wrapper.find('[data-testid="close-add-modal-btn"]').trigger("click");
    expect(wrapper.find('[data-testid="add-course-modal"]').exists()).toBe(false);
  });

  it("should open and close the change modal", async () => {
    vi.spyOn(courseApi, "getCourseById").mockResolvedValue(mockCourses[0]);
    const { wrapper } = renderWithProviders(HomePage, {
      preloadedState: { profile: mockProfile, courses: mockCourses },
    });
    await tick();
    await wrapper.find('[data-testid="edit-course-1"]').trigger("click");
    await tick();
    expect(wrapper.find('[data-testid="edit-course-modal"]').exists()).toBe(true);
    await wrapper.find('[data-testid="close-edit-modal-btn"]').trigger("click");
    expect(wrapper.find('[data-testid="edit-course-modal"]').exists()).toBe(false);
  });
});
