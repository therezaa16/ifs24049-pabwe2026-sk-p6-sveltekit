import { describe, it, expect, vi, beforeEach } from "vitest";
import DetailPage from "./DetailPage.svelte";
import { renderWithProviders } from "../../../test-utils";
import { mockGoto } from "../../../setupTests";
import * as toolsHelper from "../../../helpers/toolsHelper";
import courseApi from "../api/courseApi";
import { coursesStore } from "../states/coursesStore";

const tick = () => new Promise((r) => setTimeout(r, 20));

describe("Courses DetailPage", () => {
  const owner = { id: 1, name: "Pemilik", email: "o@del.org" };
  const student = { id: 2, name: "Peserta", email: "s@del.org" };
  const visitor = { id: 3, name: "Pengunjung", email: "v@del.org" };

  const mockCourse: any = {
    id: 7,
    user_id: 1,
    title: "Pemrograman Web",
    description: "Belajar web dari nol",
    cover: "https://example.com/cover.jpg",
    updated_at: "2024-02-26T02:44:47.000000Z",
    author: { name: "Pemilik" },
    students: [2],
    contents: [
      { id: 11, course_id: 7, title: "HTML", youtube: "https://youtu.be/aaaaaaaaaaa", my_status_finished: true },
      { id: 12, course_id: 7, title: "CSS", youtube: "https://youtu.be/bbbbbbbbbbb", my_status_finished: false },
    ],
    total_contents: 2,
    ratings: [
      { name: "Peserta", ratings: 5, comment: "Mantap" },
      { name: "Lainnya", ratings: 3, comment: null },
    ],
    avg_ratings: "4.0000",
    my_percentage_finished: "50.00",
  };

  let detailSpy: any;

  const render = (profile: any = owner, course: any = mockCourse, props: any = {}) =>
    renderWithProviders(DetailPage, {
      props: { courseId: 7, ...props },
      preloadedState: { profile, course },
    });

  beforeEach(() => {
    vi.restoreAllMocks();
    mockGoto.mockClear();
    detailSpy = vi.spyOn(coursesStore, "asyncSetCourse").mockResolvedValue(undefined as any);
    vi.spyOn(courseApi, "getCourseById").mockResolvedValue(mockCourse);
    vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => ({}) as any);
  });

  describe("loading and fetching", () => {
    it("should show a spinner while profile or course is missing", () => {
      const first = renderWithProviders(DetailPage, {
        props: { courseId: 7 },
        preloadedState: { profile: null, course: null },
      });
      expect(first.wrapper.find('[role="status"]').exists()).toBe(true);
      first.unmount();

      const second = renderWithProviders(DetailPage, {
        props: { courseId: 7 },
        preloadedState: { profile: owner, course: null },
      });
      expect(second.wrapper.find('[role="status"]').exists()).toBe(true);
      second.unmount();

      const third = renderWithProviders(DetailPage, {
        props: { courseId: 7 },
        preloadedState: { profile: null, course: mockCourse },
      });
      expect(third.wrapper.find('[role="status"]').exists()).toBe(true);
    });

    it("should fetch detail on mount only when an id is given", () => {
      render();
      expect(detailSpy).toHaveBeenCalledWith(7);
      detailSpy.mockClear();
      renderWithProviders(DetailPage, {
        props: { courseId: null },
        preloadedState: { profile: owner, course: null },
      });
      expect(detailSpy).not.toHaveBeenCalled();
    });

    it("should refetch when the id prop changes", async () => {
      const { rerender } = render();
      detailSpy.mockClear();
      await rerender({ courseId: 8 });
      await tick();
      expect(detailSpy).toHaveBeenCalledWith(8);
    });

    it("should show a not-found state, without redirecting, when loading finished without a course", async () => {
      const { wrapper, coursesStore: store } = render(owner, null);
      store.setIsCourse(true);
      await tick();
      expect(wrapper.find('[data-testid="course-not-found"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="not-found-back-link"]').attributes("href")).toBe("/");
      expect(mockGoto).not.toHaveBeenCalled();
    });

    it("should stay when loading finished with a course", async () => {
      const { coursesStore: store } = render();
      store.setIsCourse(true);
      await tick();
      expect(mockGoto).not.toHaveBeenCalled();
    });
  });

  describe("owner view", () => {
    it("should render details, owner badge and owner actions", () => {
      const { wrapper } = render(owner);
      expect(wrapper.text()).toContain("Pemrograman Web");
      expect(wrapper.text()).toContain("Belajar web dari nol");
      expect(wrapper.find("img").attributes("alt")).toBe("Sampul Pemrograman Web");
      expect(wrapper.find('[data-testid="course-author"]').text()).toContain("Pemilik");
      expect(wrapper.find('[data-testid="role-badge"]').text()).toBe("Pemilik");
      expect(wrapper.find('[data-testid="stat-students"]').text()).toBe("1");
      expect(wrapper.find('[data-testid="stat-contents"]').text()).toBe("2");
      expect(wrapper.find('[data-testid="stat-rating"]').text()).toBe("4.0");
      expect(wrapper.find('[data-testid="stat-progress"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="edit-cover-btn"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="add-content-btn"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="edit-content-11"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="join-course-btn"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="rating-form"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="content-link-11"]').attributes("href")).toBe("/courses/7/contents/11");
    });

    it("should prioritise the owner interface when the owner is also a student", () => {
      const { wrapper } = render(owner, { ...mockCourse, students: [1, 2] });
      expect(wrapper.find('[data-testid="role-badge"]').text()).toBe("Pemilik");
      expect(wrapper.find('[data-testid="leave-course-btn"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="add-content-btn"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="rating-form"]').exists()).toBe(false);
    });

    it("should render fallback content for a sparse course", () => {
      const { wrapper } = render(owner, {
        id: 9,
        user_id: 1,
        title: "Kosong",
        cover: null,
        description: null,
        avg_ratings: null,
      });
      expect(wrapper.find("img").exists()).toBe(false);
      expect(wrapper.find('[data-testid="course-author"]').exists()).toBe(false);
      expect(wrapper.text()).toContain("Tidak ada deskripsi untuk kursus ini.");
      expect(wrapper.find('[data-testid="stat-students"]').text()).toBe("0");
      expect(wrapper.find('[data-testid="stat-rating"]').text()).toBe("-");
      expect(wrapper.find('[data-testid="contents-empty"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="ratings-empty"]').exists()).toBe(true);
    });

    it("should delete the course after confirmation and go home when done", async () => {
      const confirmSpy = vi.spyOn(toolsHelper, "showConfirmDialog");
      const { wrapper, coursesStore: store } = render(owner);
      const deleteSpy = vi.spyOn(store, "asyncSetIsCourseDelete").mockResolvedValue(undefined as any);

      confirmSpy.mockResolvedValueOnce({ isConfirmed: false } as any);
      await wrapper.find('[data-testid="delete-detail-course-btn"]').trigger("click");
      await tick();
      expect(deleteSpy).not.toHaveBeenCalled();

      confirmSpy.mockResolvedValueOnce({ isConfirmed: true } as any);
      await wrapper.find('[data-testid="delete-detail-course-btn"]').trigger("click");
      await tick();
      expect(deleteSpy).toHaveBeenCalledWith(7);

      store.setIsCourseDeleted(false);
      store.setIsCourseDelete(true);
      await tick();
      expect(mockGoto).not.toHaveBeenCalled();

      store.setIsCourseDeleted(true);
      store.setIsCourseDelete(true);
      await tick();
      expect(mockGoto).toHaveBeenCalledWith("/");
    });

    it("should open and close the cover and edit modals", async () => {
      const { wrapper } = render(owner);
      await wrapper.find('[data-testid="edit-cover-btn"]').trigger("click");
      expect(wrapper.find('[data-testid="change-cover-modal"]').exists()).toBe(true);
      await wrapper.find('[data-testid="close-cover-modal-btn"]').trigger("click");
      expect(wrapper.find('[data-testid="change-cover-modal"]').exists()).toBe(false);

      await wrapper.find('[data-testid="edit-detail-course-btn"]').trigger("click");
      await tick();
      expect(wrapper.find('[data-testid="edit-course-modal"]').exists()).toBe(true);
      await wrapper.find('[data-testid="close-edit-modal-btn"]').trigger("click");
      expect(wrapper.find('[data-testid="edit-course-modal"]').exists()).toBe(false);
    });

    it("should open the content modal for add and edit, then close it", async () => {
      const { wrapper } = render(owner);
      await wrapper.find('[data-testid="add-content-btn"]').trigger("click");
      expect(wrapper.find('[data-testid="content-modal"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="content-title-input"]').element.value).toBe("");
      await wrapper.find('[data-testid="close-content-modal-btn"]').trigger("click");
      expect(wrapper.find('[data-testid="content-modal"]').exists()).toBe(false);

      await wrapper.find('[data-testid="edit-content-11"]').trigger("click");
      expect(wrapper.find('[data-testid="content-title-input"]').element.value).toBe("HTML");
    });

    it("should delete a content after confirmation and refresh when done", async () => {
      const confirmSpy = vi.spyOn(toolsHelper, "showConfirmDialog");
      const { wrapper, coursesStore: store } = render(owner);
      const deleteSpy = vi.spyOn(store, "asyncSetIsContentDelete").mockResolvedValue(undefined as any);

      confirmSpy.mockResolvedValueOnce({ isConfirmed: false } as any);
      await wrapper.find('[data-testid="delete-content-12"]').trigger("click");
      await tick();
      expect(deleteSpy).not.toHaveBeenCalled();

      confirmSpy.mockResolvedValueOnce({ isConfirmed: true } as any);
      await wrapper.find('[data-testid="delete-content-12"]').trigger("click");
      await tick();
      expect(deleteSpy).toHaveBeenCalledWith(12);

      detailSpy.mockClear();
      store.setIsContentDeleted(false);
      store.setIsContentDelete(true);
      await tick();
      expect(detailSpy).not.toHaveBeenCalled();

      store.setIsContentDeleted(true);
      store.setIsContentDelete(true);
      await tick();
      expect(detailSpy).toHaveBeenCalledWith(7);
    });
  });

  describe("student view", () => {
    it("should render student interface with progress and finished badge", () => {
      const { wrapper } = render(student);
      expect(wrapper.find('[data-testid="role-badge"]').text()).toBe("Peserta");
      expect(wrapper.find('[data-testid="stat-progress"]').text()).toBe("50%");
      expect(wrapper.find('[data-testid="content-finished-11"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="content-finished-12"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="content-link-11"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="leave-course-btn"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="join-course-btn"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="edit-cover-btn"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="add-content-btn"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="edit-content-11"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="rating-form"]').exists()).toBe(true);
    });

    it("should show 0% progress when the API gives none", () => {
      const { wrapper } = render(student, { ...mockCourse, my_percentage_finished: undefined });
      expect(wrapper.find('[data-testid="stat-progress"]').text()).toBe("0%");
    });

    it("should render ratings with and without comments", () => {
      const { wrapper } = render(student);
      expect(wrapper.find('[data-testid="rating-row-0"]').text()).toContain("Mantap");
      expect(wrapper.find('[data-testid="rating-row-0"]').text()).toContain("5/5");
      expect(wrapper.find('[data-testid="rating-row-1"]').text()).toContain("Lainnya");
    });

    it("should leave the course only after confirmation, then refresh", async () => {
      const confirmSpy = vi.spyOn(toolsHelper, "showConfirmDialog");
      const { wrapper, coursesStore: store } = render(student);
      const leaveSpy = vi.spyOn(store, "asyncSetIsStudentLeave").mockResolvedValue(undefined as any);

      confirmSpy.mockResolvedValueOnce({ isConfirmed: false } as any);
      await wrapper.find('[data-testid="leave-course-btn"]').trigger("click");
      await tick();
      expect(leaveSpy).not.toHaveBeenCalled();

      confirmSpy.mockResolvedValueOnce({ isConfirmed: true } as any);
      await wrapper.find('[data-testid="leave-course-btn"]').trigger("click");
      await tick();
      expect(leaveSpy).toHaveBeenCalledWith(7);

      detailSpy.mockClear();
      store.setIsStudentLeft(false);
      store.setIsStudentLeave(true);
      await tick();
      expect(detailSpy).not.toHaveBeenCalled();

      store.setIsStudentLeft(true);
      store.setIsStudentLeave(true);
      await tick();
      expect(detailSpy).toHaveBeenCalledWith(7);
    });

    it("should validate the comment before submitting a rating", async () => {
      const { wrapper, coursesStore: store } = render(student);
      const ratingSpy = vi.spyOn(store, "asyncSetIsRatingChange").mockResolvedValue(undefined as any);
      await wrapper.find('[data-testid="rating-form"]').trigger("submit");
      expect(toolsHelper.showErrorDialog).toHaveBeenCalledWith("Komentar tidak boleh kosong");
      expect(ratingSpy).not.toHaveBeenCalled();
    });

    it("should submit a rating and refresh when it succeeds", async () => {
      const { wrapper, coursesStore: store } = render(student);
      const ratingSpy = vi.spyOn(store, "asyncSetIsRatingChange").mockResolvedValue(undefined as any);

      await wrapper.find('[data-testid="rating-select"]').setValue("4");
      await wrapper.find('[data-testid="rating-comment"]').setValue("  Bagus sekali  ");
      await wrapper.find('[data-testid="rating-form"]').trigger("submit");
      expect(ratingSpy).toHaveBeenCalledWith(7, 4, "Bagus sekali");
      expect(wrapper.text()).toContain("Menyimpan...");

      detailSpy.mockClear();
      store.setIsRatingChanged(true);
      store.setIsRatingChange(true);
      await tick();
      expect(detailSpy).toHaveBeenCalledWith(7);
      expect(wrapper.text()).not.toContain("Menyimpan...");
      expect(wrapper.find('[data-testid="rating-comment"]').element.value).toBe("");
    });

    it("should keep the comment when saving the rating failed", async () => {
      const { wrapper, coursesStore: store } = render(student);
      vi.spyOn(store, "asyncSetIsRatingChange").mockResolvedValue(undefined as any);
      await wrapper.find('[data-testid="rating-comment"]').setValue("Komentar");
      await wrapper.find('[data-testid="rating-form"]').trigger("submit");

      detailSpy.mockClear();
      store.setIsRatingChanged(false);
      store.setIsRatingChange(true);
      await tick();
      expect(detailSpy).not.toHaveBeenCalled();
      expect(wrapper.find('[data-testid="rating-comment"]').element.value).toBe("Komentar");
    });
  });

  describe("visitor view", () => {
    it("should treat a course without students as having none", () => {
      const { wrapper } = render(visitor, { ...mockCourse, students: undefined });
      expect(wrapper.find('[data-testid="join-course-btn"]').exists()).toBe(true);
    });

    it("should offer joining and hide content links", () => {
      const { wrapper } = render(visitor);
      expect(wrapper.find('[data-testid="join-course-btn"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="role-badge"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="content-link-11"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="content-row-11"]').text()).toContain("HTML");
      expect(wrapper.find('[data-testid="rating-form"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="content-finished-11"]').exists()).toBe(false);
    });

    it("should join the course and refresh when done", async () => {
      const { wrapper, coursesStore: store } = render(visitor);
      const joinSpy = vi.spyOn(store, "asyncSetIsStudentJoin").mockResolvedValue(undefined as any);
      await wrapper.find('[data-testid="join-course-btn"]').trigger("click");
      expect(joinSpy).toHaveBeenCalledWith(7);

      detailSpy.mockClear();
      store.setIsStudentJoined(false);
      store.setIsStudentJoin(true);
      await tick();
      expect(detailSpy).not.toHaveBeenCalled();

      store.setIsStudentJoined(true);
      store.setIsStudentJoin(true);
      await tick();
      expect(detailSpy).toHaveBeenCalledWith(7);
    });
  });
});
