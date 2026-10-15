import apiHelper from "../../../helpers/apiHelper";

declare const DELCOM_BASEURL: string;

export interface CourseAuthor {
  name: string;
  photo?: string | null;
}

export interface CourseContent {
  id: number;
  course_id: number;
  title: string;
  youtube: string;
  created_at?: string;
  updated_at?: string;
  my_status_finished?: boolean;
}

export interface CourseRating {
  name: string;
  ratings: number;
  comment?: string | null;
}

export interface Course {
  id: number;
  user_id: number;
  title: string;
  description?: string | null;
  cover?: string | null;
  created_at?: string;
  updated_at?: string;
  author?: CourseAuthor | null;
  students?: number[];
  contents?: CourseContent[];
  total_contents?: number;
  ratings?: CourseRating[];
  avg_ratings?: string | null;
  my_percentage_finished?: string | null;
}

const courseApi = (() => {
  const BASE_URL = `${DELCOM_BASEURL}/courses`;

  const JSON_HEADERS = { "Content-Type": "application/json" };

  function _url(path: string): string {
    return BASE_URL + path;
  }

  async function _request(path: string, options: RequestInit, fallbackMessage: string): Promise<any> {
    const response = await apiHelper.fetchData(_url(path), options);
    const result = await response.json();
    if (result.status !== "success") {
      throw new Error(result.message || fallbackMessage);
    }
    return result;
  }

  async function postCourse(title: string, description: string): Promise<any> {
    const result = await _request(
      "",
      { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ title, description }) },
      "Gagal menambahkan kursus"
    );
    return result.data;
  }

  async function postCourseCover(courseId: number | string, cover: File): Promise<string> {
    const formData = new FormData();
    formData.append("cover", cover);
    const result = await _request(
      `/${courseId}/cover`,
      { method: "POST", body: formData },
      "Gagal mengubah sampul"
    );
    return result.message;
  }

  async function putCourse(courseId: number | string, title: string, description: string): Promise<string> {
    const result = await _request(
      `/${courseId}`,
      { method: "PUT", headers: JSON_HEADERS, body: JSON.stringify({ title, description }) },
      "Gagal mengubah kursus"
    );
    return result.message;
  }

  async function getCourses(isMe: boolean = false): Promise<Course[]> {
    const result = await _request(isMe ? "?is_me=1" : "", { method: "GET" }, "Gagal mengambil data kursus");
    return result.data?.courses || [];
  }

  async function getCourseById(courseId: number | string): Promise<Course | undefined> {
    const result = await _request(`/${courseId}`, { method: "GET" }, "Gagal mengambil detail kursus");
    return result.data?.course;
  }

  async function deleteCourse(courseId: number | string): Promise<string> {
    const result = await _request(`/${courseId}`, { method: "DELETE" }, "Gagal menghapus kursus");
    return result.message;
  }

  async function deleteAllCourses(): Promise<string> {
    const result = await _request("", { method: "DELETE" }, "Gagal menghapus semua kursus");
    return result.message;
  }

  async function postStudent(courseId: number | string): Promise<string> {
    const result = await _request(`/${courseId}/students`, { method: "POST" }, "Gagal mendaftar kursus");
    return result.message;
  }

  async function deleteStudent(courseId: number | string): Promise<string> {
    const result = await _request(`/${courseId}/students`, { method: "DELETE" }, "Gagal keluar dari kursus");
    return result.message;
  }

  async function putRating(courseId: number | string, ratings: number, comment: string): Promise<string> {
    const result = await _request(
      `/${courseId}/students/ratings`,
      { method: "PUT", headers: JSON_HEADERS, body: JSON.stringify({ ratings, comment }) },
      "Gagal memberi rating"
    );
    return result.message;
  }

  async function postContent(courseId: number | string, title: string, youtube: string): Promise<any> {
    const result = await _request(
      `/${courseId}/contents`,
      { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ title, youtube }) },
      "Gagal menambahkan konten"
    );
    return result.data;
  }

  async function putContent(contentId: number | string, title: string, youtube: string): Promise<string> {
    const result = await _request(
      `/-/contents/${contentId}`,
      { method: "PUT", headers: JSON_HEADERS, body: JSON.stringify({ title, youtube }) },
      "Gagal mengubah konten"
    );
    return result.message;
  }

  async function getContentById(contentId: number | string): Promise<CourseContent | undefined> {
    const result = await _request(`/-/contents/${contentId}`, { method: "GET" }, "Gagal mengambil detail konten");
    return result.data?.course_content;
  }

  async function deleteContent(contentId: number | string): Promise<string> {
    const result = await _request(`/-/contents/${contentId}`, { method: "DELETE" }, "Gagal menghapus konten");
    return result.message;
  }

  async function postLearn(contentId: number | string, status: 0 | 1): Promise<string> {
    const result = await _request(
      `/-/contents/${contentId}/learns`,
      { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ status }) },
      "Gagal memperbarui status belajar"
    );
    return result.message;
  }

  return {
    postCourse,
    postCourseCover,
    putCourse,
    getCourses,
    getCourseById,
    deleteCourse,
    deleteAllCourses,
    postStudent,
    deleteStudent,
    putRating,
    postContent,
    putContent,
    getContentById,
    deleteContent,
    postLearn,
  };
})();

export default courseApi;
