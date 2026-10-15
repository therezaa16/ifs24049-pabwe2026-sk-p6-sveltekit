import { describe, it, expect, vi, beforeEach } from "vitest";
import courseApi from "./courseApi";
import apiHelper from "../../../helpers/apiHelper";

const mockResponse = (body: any) =>
  vi.spyOn(apiHelper, "fetchData").mockResolvedValue({ json: async () => body } as any);

describe("courseApi", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("simple message endpoints", () => {
    const cases: {
      name: string;
      call: () => Promise<any>;
      method: string;
      path: string;
      body?: any;
      fallback: string;
    }[] = [
      {
        name: "postCourseCover",
        call: () => courseApi.postCourseCover(1, new File(["x"], "c.jpg")),
        method: "POST",
        path: "/courses/1/cover",
        fallback: "Gagal mengubah sampul",
      },
      {
        name: "putCourse",
        call: () => courseApi.putCourse(1, "T", "D"),
        method: "PUT",
        path: "/courses/1",
        body: { title: "T", description: "D" },
        fallback: "Gagal mengubah kursus",
      },
      {
        name: "deleteCourse",
        call: () => courseApi.deleteCourse(1),
        method: "DELETE",
        path: "/courses/1",
        fallback: "Gagal menghapus kursus",
      },
      {
        name: "deleteAllCourses",
        call: () => courseApi.deleteAllCourses(),
        method: "DELETE",
        path: "/courses",
        fallback: "Gagal menghapus semua kursus",
      },
      {
        name: "postStudent",
        call: () => courseApi.postStudent(1),
        method: "POST",
        path: "/courses/1/students",
        fallback: "Gagal mendaftar kursus",
      },
      {
        name: "deleteStudent",
        call: () => courseApi.deleteStudent(1),
        method: "DELETE",
        path: "/courses/1/students",
        fallback: "Gagal keluar dari kursus",
      },
      {
        name: "putRating",
        call: () => courseApi.putRating(1, 5, "Bagus"),
        method: "PUT",
        path: "/courses/1/students/ratings",
        body: { ratings: 5, comment: "Bagus" },
        fallback: "Gagal memberi rating",
      },
      {
        name: "putContent",
        call: () => courseApi.putContent(9, "T", "https://youtu.be/abc"),
        method: "PUT",
        path: "/courses/-/contents/9",
        body: { title: "T", youtube: "https://youtu.be/abc" },
        fallback: "Gagal mengubah konten",
      },
      {
        name: "deleteContent",
        call: () => courseApi.deleteContent(9),
        method: "DELETE",
        path: "/courses/-/contents/9",
        fallback: "Gagal menghapus konten",
      },
      {
        name: "postLearn",
        call: () => courseApi.postLearn(9, 1),
        method: "POST",
        path: "/courses/-/contents/9/learns",
        body: { status: 1 },
        fallback: "Gagal memperbarui status belajar",
      },
    ];

    for (const c of cases) {
      it(`${c.name} should call API and return message`, async () => {
        const spy = mockResponse({ status: "success", message: "ok" });
        expect(await c.call()).toBe("ok");
        const [url, options] = spy.mock.calls[0] as [string, any];
        expect(url).toContain(c.path);
        expect(options.method).toBe(c.method);
        if (c.body) expect(JSON.parse(options.body)).toEqual(c.body);
      });

      it(`${c.name} should throw API message on failure`, async () => {
        mockResponse({ status: "fail", message: "Data tidak valid" });
        await expect(c.call()).rejects.toThrow("Data tidak valid");
      });

      it(`${c.name} should throw fallback message when none given`, async () => {
        mockResponse({ status: "fail" });
        await expect(c.call()).rejects.toThrow(c.fallback);
      });
    }

    it("postCourseCover should send the file as FormData", async () => {
      const spy = mockResponse({ status: "success", message: "ok" });
      await courseApi.postCourseCover(1, new File(["x"], "c.jpg"));
      const options = (spy.mock.calls[0] as [string, any])[1];
      expect(options.body).toBeInstanceOf(FormData);
      expect(options.body.get("cover")).toBeInstanceOf(File);
    });
  });

  describe("data endpoints", () => {
    it("postCourse should return data", async () => {
      const spy = mockResponse({ status: "success", data: { course_id: 3 } });
      expect(await courseApi.postCourse("T", "D")).toEqual({ course_id: 3 });
      const options = (spy.mock.calls[0] as [string, any])[1];
      expect(JSON.parse(options.body)).toEqual({ title: "T", description: "D" });
    });

    it("postCourse should throw on failure", async () => {
      mockResponse({ status: "fail" });
      await expect(courseApi.postCourse("T", "D")).rejects.toThrow("Gagal menambahkan kursus");
    });

    it("postContent should return data", async () => {
      const spy = mockResponse({ status: "success", data: { content_id: 4 } });
      expect(await courseApi.postContent(1, "T", "https://youtu.be/a")).toEqual({ content_id: 4 });
      expect((spy.mock.calls[0] as [string, any])[0]).toContain("/courses/1/contents");
    });

    it("postContent should throw on failure", async () => {
      mockResponse({ status: "fail" });
      await expect(courseApi.postContent(1, "T", "u")).rejects.toThrow("Gagal menambahkan konten");
    });

    it("getCourses should return the list and support is_me", async () => {
      const spy = mockResponse({ status: "success", data: { courses: [{ id: 1 }] } });
      expect(await courseApi.getCourses()).toEqual([{ id: 1 }]);
      expect((spy.mock.calls[0] as [string, any])[0]).not.toContain("is_me");
      await courseApi.getCourses(true);
      expect((spy.mock.calls[1] as [string, any])[0]).toContain("?is_me=1");
    });

    it("getCourses should return [] without data and throw on failure", async () => {
      mockResponse({ status: "success" });
      expect(await courseApi.getCourses()).toEqual([]);
      mockResponse({ status: "fail" });
      await expect(courseApi.getCourses()).rejects.toThrow("Gagal mengambil data kursus");
    });

    it("getCourseById should return the course, undefined without data, or throw", async () => {
      mockResponse({ status: "success", data: { course: { id: 2 } } });
      expect(await courseApi.getCourseById(2)).toEqual({ id: 2 });
      mockResponse({ status: "success" });
      expect(await courseApi.getCourseById(2)).toBeUndefined();
      mockResponse({ status: "fail" });
      await expect(courseApi.getCourseById(2)).rejects.toThrow("Gagal mengambil detail kursus");
    });

    it("getContentById should return the content, undefined without data, or throw", async () => {
      const spy = mockResponse({ status: "success", data: { course_content: { id: 5 } } });
      expect(await courseApi.getContentById(5)).toEqual({ id: 5 });
      expect((spy.mock.calls[0] as [string, any])[0]).toContain("/courses/-/contents/5");
      mockResponse({ status: "success" });
      expect(await courseApi.getContentById(5)).toBeUndefined();
      mockResponse({ status: "fail" });
      await expect(courseApi.getContentById(5)).rejects.toThrow("Gagal mengambil detail konten");
    });
  });
});
