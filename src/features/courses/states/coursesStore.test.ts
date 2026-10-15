import { describe, it, expect, vi, beforeEach } from "vitest";
import { get } from "svelte/store";
import { useCoursesStore, coursesStore } from "./coursesStore";
import courseApi from "../api/courseApi";
import * as toolsHelper from "../../../helpers/toolsHelper";

describe("coursesStore", () => {
  beforeEach(() => {
    coursesStore.reset();
    vi.restoreAllMocks();
    vi.spyOn(toolsHelper, "showSuccessDialog").mockImplementation(() => ({}) as any);
    vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => ({}) as any);
  });

  it("should expose the same singleton through the hook", () => {
    expect(useCoursesStore()).toBe(coursesStore);
  });

  it("should have correct default state", () => {
    expect(coursesStore.courses).toEqual([]);
    expect(coursesStore.course).toBeNull();
    expect(coursesStore.content).toBeNull();
    expect(coursesStore.isCourse).toBe(false);
    expect(coursesStore.$state.isLearnChanged).toBe(false);
  });

  it("should update state with setters and reset it", () => {
    coursesStore.setCourses([{ id: 1 }]);
    coursesStore.setCourse({ id: 1 });
    coursesStore.setContent({ id: 2 });
    const flags = Object.keys(get(coursesStore)).filter((k) => k.startsWith("is"));
    for (const key of flags) {
      coursesStore[`set${key.charAt(0).toUpperCase() + key.slice(1)}`](true);
    }

    const state: any = get(coursesStore);
    expect(state.courses).toEqual([{ id: 1 }]);
    expect(coursesStore.course).toEqual({ id: 1 });
    expect(coursesStore.content).toEqual({ id: 2 });
    for (const key of flags) {
      expect(state[key]).toBe(true);
    }

    coursesStore.reset();
    expect(coursesStore.courses).toEqual([]);
    coursesStore.reset({ courses: [{ id: 9 }] as any });
    expect(coursesStore.courses).toEqual([{ id: 9 }]);
  });

  describe("fetch actions", () => {
    it("asyncSetCourses should store courses and pass the is_me flag", async () => {
      const spy = vi.spyOn(courseApi, "getCourses").mockResolvedValue([{ id: 1 }] as any);
      await coursesStore.asyncSetCourses(true);
      expect(spy).toHaveBeenCalledWith(true);
      expect(coursesStore.courses).toEqual([{ id: 1 }]);
      await coursesStore.asyncSetCourses();
      expect(spy).toHaveBeenLastCalledWith(false);
    });

    it("asyncSetCourses should clear courses on failure", async () => {
      coursesStore.setCourses([{ id: 1 }]);
      vi.spyOn(courseApi, "getCourses").mockRejectedValue(new Error("x"));
      await coursesStore.asyncSetCourses();
      expect(coursesStore.courses).toEqual([]);
    });

    it("asyncSetCourse should store course and set flag", async () => {
      vi.spyOn(courseApi, "getCourseById").mockResolvedValue({ id: 5 } as any);
      await coursesStore.asyncSetCourse(5);
      expect(coursesStore.course).toEqual({ id: 5 });
      expect(coursesStore.isCourse).toBe(true);
    });

    it("asyncSetCourse should set null on failure", async () => {
      coursesStore.setCourse({ id: 1 });
      vi.spyOn(courseApi, "getCourseById").mockRejectedValue(new Error("x"));
      await coursesStore.asyncSetCourse(5);
      expect(coursesStore.course).toBeNull();
      expect(coursesStore.isCourse).toBe(true);
    });

    it("asyncSetContent should store content and set flag", async () => {
      vi.spyOn(courseApi, "getContentById").mockResolvedValue({ id: 7 } as any);
      await coursesStore.asyncSetContent(7);
      expect(coursesStore.content).toEqual({ id: 7 });
      expect(coursesStore.isContent).toBe(true);
    });

    it("asyncSetContent should set null on failure", async () => {
      coursesStore.setContent({ id: 1 });
      vi.spyOn(courseApi, "getContentById").mockRejectedValue(new Error("x"));
      await coursesStore.asyncSetContent(7);
      expect(coursesStore.content).toBeNull();
      expect(coursesStore.isContent).toBe(true);
    });
  });

  describe("mutations", () => {
    const cases = [
      {
        name: "add course",
        run: () => coursesStore.asyncSetIsCourseAdd("T", "D"),
        api: "postCourse",
        args: ["T", "D"],
        done: "isCourseAdded",
        finished: "isCourseAdd",
        message: "Kursus berhasil ditambahkan!",
      },
      {
        name: "change course",
        run: () => coursesStore.asyncSetIsCourseChange(1, "T", "D"),
        api: "putCourse",
        args: [1, "T", "D"],
        done: "isCourseChanged",
        finished: "isCourseChange",
        message: "Kursus berhasil diperbarui!",
      },
      {
        name: "change cover",
        run: () => coursesStore.asyncSetIsCourseChangeCover(1, "file" as any),
        api: "postCourseCover",
        args: [1, "file"],
        done: "isCourseChangedCover",
        finished: "isCourseChangeCover",
        message: "Sampul berhasil diperbarui!",
      },
      {
        name: "delete course",
        run: () => coursesStore.asyncSetIsCourseDelete(1),
        api: "deleteCourse",
        args: [1],
        done: "isCourseDeleted",
        finished: "isCourseDelete",
        message: "Kursus berhasil dihapus!",
      },
      {
        name: "join course",
        run: () => coursesStore.asyncSetIsStudentJoin(1),
        api: "postStudent",
        args: [1],
        done: "isStudentJoined",
        finished: "isStudentJoin",
        message: "Berhasil mendaftar kursus!",
      },
      {
        name: "leave course",
        run: () => coursesStore.asyncSetIsStudentLeave(1),
        api: "deleteStudent",
        args: [1],
        done: "isStudentLeft",
        finished: "isStudentLeave",
        message: "Berhasil keluar dari kursus!",
      },
      {
        name: "change rating",
        run: () => coursesStore.asyncSetIsRatingChange(1, 5, "Bagus"),
        api: "putRating",
        args: [1, 5, "Bagus"],
        done: "isRatingChanged",
        finished: "isRatingChange",
        message: "Rating berhasil disimpan!",
      },
      {
        name: "add content",
        run: () => coursesStore.asyncSetIsContentAdd(1, "T", "https://youtu.be/a"),
        api: "postContent",
        args: [1, "T", "https://youtu.be/a"],
        done: "isContentAdded",
        finished: "isContentAdd",
        message: "Konten berhasil ditambahkan!",
      },
      {
        name: "change content",
        run: () => coursesStore.asyncSetIsContentChange(2, "T", "https://youtu.be/a"),
        api: "putContent",
        args: [2, "T", "https://youtu.be/a"],
        done: "isContentChanged",
        finished: "isContentChange",
        message: "Konten berhasil diperbarui!",
      },
      {
        name: "delete content",
        run: () => coursesStore.asyncSetIsContentDelete(2),
        api: "deleteContent",
        args: [2],
        done: "isContentDeleted",
        finished: "isContentDelete",
        message: "Konten berhasil dihapus!",
      },
      {
        name: "change learn status",
        run: () => coursesStore.asyncSetIsLearnChange(2, 1),
        api: "postLearn",
        args: [2, 1],
        done: "isLearnChanged",
        finished: "isLearnChange",
        message: "Status belajar berhasil diperbarui!",
      },
    ];

    for (const c of cases) {
      it(`should ${c.name} using API message`, async () => {
        const spy = vi.spyOn(courseApi, c.api as any).mockResolvedValue("Pesan API" as any);
        await c.run();
        expect(spy).toHaveBeenCalledWith(...(c.args as [any]));
        expect(toolsHelper.showSuccessDialog).toHaveBeenCalledWith("Pesan API");
        expect(coursesStore[c.done]).toBe(true);
        expect(coursesStore[c.finished]).toBe(true);
      });

      it(`should ${c.name} using default message when API gives none`, async () => {
        vi.spyOn(courseApi, c.api as any).mockResolvedValue(undefined as any);
        await c.run();
        expect(toolsHelper.showSuccessDialog).toHaveBeenCalledWith(c.message);
      });

      it(`should handle failure when trying to ${c.name}`, async () => {
        vi.spyOn(courseApi, c.api as any).mockRejectedValue(new Error("Gagal"));
        await c.run();
        expect(toolsHelper.showErrorDialog).toHaveBeenCalledWith("Gagal");
        expect(coursesStore[c.done]).toBe(false);
        expect(coursesStore[c.finished]).toBe(true);
      });
    }
  });
});
