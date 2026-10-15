import { writable } from "svelte/store";
import courseApi, { type Course, type CourseContent } from "../api/courseApi";
import { showErrorDialog, showSuccessDialog } from "../../../helpers/toolsHelper";

export interface CoursesState {
  courses: Course[];
  course: Course | null;
  content: CourseContent | null;
  isCourse: boolean;
  isContent: boolean;
  isCourseAdd: boolean;
  isCourseAdded: boolean;
  isCourseChange: boolean;
  isCourseChanged: boolean;
  isCourseChangeCover: boolean;
  isCourseChangedCover: boolean;
  isCourseDelete: boolean;
  isCourseDeleted: boolean;
  isStudentJoin: boolean;
  isStudentJoined: boolean;
  isStudentLeave: boolean;
  isStudentLeft: boolean;
  isRatingChange: boolean;
  isRatingChanged: boolean;
  isContentAdd: boolean;
  isContentAdded: boolean;
  isContentChange: boolean;
  isContentChanged: boolean;
  isContentDelete: boolean;
  isContentDeleted: boolean;
  isLearnChange: boolean;
  isLearnChanged: boolean;
}

type StateKey = keyof CoursesState;

const initial: CoursesState = {
  courses: [],
  course: null,
  content: null,
  isCourse: false,
  isContent: false,
  isCourseAdd: false,
  isCourseAdded: false,
  isCourseChange: false,
  isCourseChanged: false,
  isCourseChangeCover: false,
  isCourseChangedCover: false,
  isCourseDelete: false,
  isCourseDeleted: false,
  isStudentJoin: false,
  isStudentJoined: false,
  isStudentLeave: false,
  isStudentLeft: false,
  isRatingChange: false,
  isRatingChanged: false,
  isContentAdd: false,
  isContentAdded: false,
  isContentChange: false,
  isContentChanged: false,
  isContentDelete: false,
  isContentDeleted: false,
  isLearnChange: false,
  isLearnChanged: false,
};

const capitalize = (key: string) => key.charAt(0).toUpperCase() + key.slice(1);

function createCoursesStore() {
  let currentState: CoursesState = { ...initial };
  const innerStore = writable<CoursesState>(currentState);
  innerStore.subscribe((val) => {
    currentState = val;
  });

  const store: any = {
    subscribe: innerStore.subscribe,
    get $state(): CoursesState {
      return currentState;
    },
    reset(state: Partial<CoursesState> = initial) {
      innerStore.set({ ...initial, ...state });
    },

    // Menjalankan aksi mutasi: menampilkan dialog, lalu menyalakan pasangan bendera.
    async _mutate(
      call: () => Promise<any>,
      defaultMessage: string,
      doneKey: StateKey,
      finishedKey: StateKey
    ) {
      try {
        const result = await call();
        showSuccessDialog((typeof result === "string" && result) || defaultMessage);
        this[`set${capitalize(doneKey)}`](true);
      } catch (error: any) {
        showErrorDialog(error.message);
        this[`set${capitalize(doneKey)}`](false);
      } finally {
        this[`set${capitalize(finishedKey)}`](true);
      }
    },

    async asyncSetCourses(isMe: boolean = false) {
      try {
        const courses = await courseApi.getCourses(isMe);
        this.setCourses(courses);
      } catch {
        this.setCourses([]);
      }
    },
    async asyncSetCourse(courseId: number | string) {
      try {
        const course = await courseApi.getCourseById(courseId);
        this.setCourse(course);
      } catch {
        this.setCourse(null);
      } finally {
        this.setIsCourse(true);
      }
    },
    async asyncSetContent(contentId: number | string) {
      try {
        const content = await courseApi.getContentById(contentId);
        this.setContent(content);
      } catch {
        this.setContent(null);
      } finally {
        this.setIsContent(true);
      }
    },
    asyncSetIsCourseAdd(title: string, description: string) {
      return this._mutate(
        () => courseApi.postCourse(title, description),
        "Kursus berhasil ditambahkan!",
        "isCourseAdded",
        "isCourseAdd"
      );
    },
    asyncSetIsCourseChange(courseId: number | string, title: string, description: string) {
      return this._mutate(
        () => courseApi.putCourse(courseId, title, description),
        "Kursus berhasil diperbarui!",
        "isCourseChanged",
        "isCourseChange"
      );
    },
    asyncSetIsCourseChangeCover(courseId: number | string, cover: File) {
      return this._mutate(
        () => courseApi.postCourseCover(courseId, cover),
        "Sampul berhasil diperbarui!",
        "isCourseChangedCover",
        "isCourseChangeCover"
      );
    },
    asyncSetIsCourseDelete(courseId: number | string) {
      return this._mutate(
        () => courseApi.deleteCourse(courseId),
        "Kursus berhasil dihapus!",
        "isCourseDeleted",
        "isCourseDelete"
      );
    },
    asyncSetIsStudentJoin(courseId: number | string) {
      return this._mutate(
        () => courseApi.postStudent(courseId),
        "Berhasil mendaftar kursus!",
        "isStudentJoined",
        "isStudentJoin"
      );
    },
    asyncSetIsStudentLeave(courseId: number | string) {
      return this._mutate(
        () => courseApi.deleteStudent(courseId),
        "Berhasil keluar dari kursus!",
        "isStudentLeft",
        "isStudentLeave"
      );
    },
    asyncSetIsRatingChange(courseId: number | string, ratings: number, comment: string) {
      return this._mutate(
        () => courseApi.putRating(courseId, ratings, comment),
        "Rating berhasil disimpan!",
        "isRatingChanged",
        "isRatingChange"
      );
    },
    asyncSetIsContentAdd(courseId: number | string, title: string, youtube: string) {
      return this._mutate(
        () => courseApi.postContent(courseId, title, youtube),
        "Konten berhasil ditambahkan!",
        "isContentAdded",
        "isContentAdd"
      );
    },
    asyncSetIsContentChange(contentId: number | string, title: string, youtube: string) {
      return this._mutate(
        () => courseApi.putContent(contentId, title, youtube),
        "Konten berhasil diperbarui!",
        "isContentChanged",
        "isContentChange"
      );
    },
    asyncSetIsContentDelete(contentId: number | string) {
      return this._mutate(
        () => courseApi.deleteContent(contentId),
        "Konten berhasil dihapus!",
        "isContentDeleted",
        "isContentDelete"
      );
    },
    asyncSetIsLearnChange(contentId: number | string, status: 0 | 1) {
      return this._mutate(
        () => courseApi.postLearn(contentId, status),
        "Status belajar berhasil diperbarui!",
        "isLearnChanged",
        "isLearnChange"
      );
    },
  };

  // Getter dan setter untuk setiap kunci state (courses -> setCourses, dst).
  for (const key of Object.keys(initial)) {
    Object.defineProperty(store, key, {
      get: () => (currentState as any)[key],
      enumerable: true,
    });
    store[`set${capitalize(key)}`] = (value: any) => {
      innerStore.update((s) => ({ ...s, [key]: value }));
    };
  }

  return store;
}

export const coursesStore = createCoursesStore();
export const useCoursesStore = () => coursesStore;
export default coursesStore;
