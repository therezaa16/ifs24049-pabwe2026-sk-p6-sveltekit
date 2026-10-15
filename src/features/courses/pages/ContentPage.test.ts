import { describe, it, expect, vi, beforeEach } from "vitest";
import ContentPage from "./ContentPage.svelte";
import { renderWithProviders } from "../../../test-utils";
import { mockGoto } from "../../../setupTests";
import { coursesStore } from "../states/coursesStore";

const tick = () => new Promise((r) => setTimeout(r, 20));

describe("Courses ContentPage", () => {
  const owner = { id: 1, name: "Pemilik" };
  const student = { id: 2, name: "Peserta" };
  const visitor = { id: 3, name: "Pengunjung" };
  const course: any = { id: 7, user_id: 1, title: "Pemrograman Web", students: [2] };
  const content: any = {
    id: 11,
    course_id: 7,
    title: "Pengenalan HTML",
    youtube: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    my_status_finished: false,
  };

  let courseSpy: any;
  let contentSpy: any;

  const render = (profile: any = student, overrides: any = {}) =>
    renderWithProviders(ContentPage, {
      props: { courseId: 7, contentId: 11 },
      preloadedState: { profile, course, content, ...overrides },
    });

  beforeEach(() => {
    vi.restoreAllMocks();
    mockGoto.mockClear();
    courseSpy = vi.spyOn(coursesStore, "asyncSetCourse").mockResolvedValue(undefined as any);
    contentSpy = vi.spyOn(coursesStore, "asyncSetContent").mockResolvedValue(undefined as any);
  });

  it("should show a spinner while profile or content is missing", () => {
    const first = render(null);
    expect(first.wrapper.find('[role="status"]').exists()).toBe(true);
    first.unmount();
    const second = render(student, { content: null });
    expect(second.wrapper.find('[role="status"]').exists()).toBe(true);
  });

  it("should fetch course and content on mount", () => {
    render();
    expect(courseSpy).toHaveBeenCalledWith(7);
    expect(contentSpy).toHaveBeenCalledWith(11);
  });

  it("should refetch the content when the content id changes", async () => {
    const { rerender } = render();
    contentSpy.mockClear();
    await rerender({ courseId: 7, contentId: 12 });
    await tick();
    expect(contentSpy).toHaveBeenCalledWith(12);
  });

  it("should render the YouTube player and course title", () => {
    const { wrapper } = render();
    const player = wrapper.find('[data-testid="content-player"]');
    expect(player.attributes("src")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(player.attributes("title")).toBe("Video: Pengenalan HTML");
    expect(wrapper.text()).toContain("Pemrograman Web");
    expect(wrapper.text()).toContain("Pengenalan HTML");
    expect(wrapper.find('[data-testid="back-to-course-link"]').attributes("href")).toBe("/courses/7");
  });

  it("should render a fallback link for unsupported video urls", () => {
    const { wrapper } = render(student, { content: { ...content, youtube: "https://example.com/v" } });
    expect(wrapper.find('[data-testid="content-player"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="content-invalid"]').exists()).toBe(true);
  });

  it("should leave the course title empty while the course is not loaded", () => {
    const { wrapper } = render(student, { course: null });
    expect(wrapper.find("h1").text()).toBe("Pengenalan HTML");
    expect(wrapper.find('[data-testid="toggle-finished-btn"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="not-student-note"]').exists()).toBe(true);
  });

  it("should not show the toggle for owners or visitors", () => {
    const ownerView = render(owner);
    expect(ownerView.wrapper.find('[data-testid="toggle-finished-btn"]').exists()).toBe(false);
    expect(ownerView.wrapper.find('[data-testid="not-student-note"]').exists()).toBe(false);
    ownerView.unmount();

    const visitorView = render(visitor);
    expect(visitorView.wrapper.find('[data-testid="toggle-finished-btn"]').exists()).toBe(false);
    expect(visitorView.wrapper.find('[data-testid="not-student-note"]').exists()).toBe(true);
  });

  it("should treat a course without students as having none", () => {
    const { wrapper } = render(visitor, { course: { ...course, students: undefined } });
    expect(wrapper.find('[data-testid="not-student-note"]').exists()).toBe(true);
  });

  it("should prioritise the owner interface for an owner who is also a student", () => {
    const { wrapper } = render(owner, { course: { ...course, students: [1] } });
    expect(wrapper.find('[data-testid="toggle-finished-btn"]').exists()).toBe(false);
  });

  it("should mark content as finished and refresh when done", async () => {
    const { wrapper, coursesStore: store } = render(student);
    const learnSpy = vi.spyOn(store, "asyncSetIsLearnChange").mockResolvedValue(undefined as any);
    expect(wrapper.find('[data-testid="toggle-finished-btn"]').text()).toContain("Tandai Selesai");

    await wrapper.find('[data-testid="toggle-finished-btn"]').trigger("click");
    expect(learnSpy).toHaveBeenCalledWith(11, 1);
    expect(wrapper.text()).toContain("Menyimpan...");

    contentSpy.mockClear();
    store.setIsLearnChanged(true);
    store.setIsLearnChange(true);
    await tick();
    expect(contentSpy).toHaveBeenCalledWith(11);
    expect(wrapper.text()).not.toContain("Menyimpan...");
  });

  it("should unmark finished content", async () => {
    const { wrapper, coursesStore: store } = render(student, {
      content: { ...content, my_status_finished: true },
    });
    const learnSpy = vi.spyOn(store, "asyncSetIsLearnChange").mockResolvedValue(undefined as any);
    expect(wrapper.find('[data-testid="toggle-finished-btn"]').text()).toContain("Selesai (batalkan)");
    await wrapper.find('[data-testid="toggle-finished-btn"]').trigger("click");
    expect(learnSpy).toHaveBeenCalledWith(11, 0);
  });

  it("should not refresh when updating the status failed", async () => {
    const { wrapper, coursesStore: store } = render(student);
    vi.spyOn(store, "asyncSetIsLearnChange").mockResolvedValue(undefined as any);
    await wrapper.find('[data-testid="toggle-finished-btn"]').trigger("click");

    contentSpy.mockClear();
    store.setIsLearnChanged(false);
    store.setIsLearnChange(true);
    await tick();
    expect(contentSpy).not.toHaveBeenCalled();
    expect(wrapper.text()).not.toContain("Menyimpan...");
  });

  it("should go back to the course when the content failed to load", async () => {
    const { coursesStore: store } = render(student, { content: null });
    store.setIsContent(true);
    await tick();
    expect(mockGoto).toHaveBeenCalledWith("/courses/7");
  });

  it("should stay when the content loaded", async () => {
    const { coursesStore: store } = render();
    store.setIsContent(true);
    await tick();
    expect(mockGoto).not.toHaveBeenCalled();
  });

  it("should go home when the course failed to load, and stay when it loaded", async () => {
    const { coursesStore: store } = render(student);
    store.setIsCourse(true);
    await tick();
    expect(mockGoto).not.toHaveBeenCalled();

    store.setCourse(null);
    store.setIsCourse(true);
    await tick();
    expect(mockGoto).toHaveBeenCalledWith("/");
  });
});
