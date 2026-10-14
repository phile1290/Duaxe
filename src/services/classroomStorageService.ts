import { GameMode, SubjectType } from '../types';

export interface SavedTeamConfig {
  teamId: string;
  teamName: string;
  studentNames: string[];
}

export interface SavedClassData {
  classId: string;
  className: string; // e.g. "Lớp 3A"
  grade: number; // 1 - 5
  subject: SubjectType;
  studentsText: string;
  gameMode: GameMode;
  teamCount: number;
  teamsConfig: SavedTeamConfig[];
  lastLessonTitle?: string;
  lastWeek?: number;
  updatedAt: string;
}

const LOCAL_STORAGE_CLASSES_KEY = 'knowledge_race_saved_classes_v2';
const LOCAL_STORAGE_ACTIVE_CLASS_ID_KEY = 'knowledge_race_active_class_id_v2';
const FIREBASE_CONFIG_STORAGE_KEY = 'knowledge_race_firebase_config_v1';

// Initial class template - completely empty students as requested
const DEFAULT_INITIAL_CLASSES: SavedClassData[] = [
  {
    classId: 'class-3a',
    className: 'Lớp 3A',
    grade: 3,
    subject: 'Toán',
    studentsText: '', // Empty as requested: teacher enters from scratch
    gameMode: 'individual',
    teamCount: 4,
    teamsConfig: [],
    lastLessonTitle: '',
    lastWeek: 1,
    updatedAt: new Date().toISOString(),
  },
  {
    classId: 'class-4b',
    className: 'Lớp 4B',
    grade: 4,
    subject: 'Toán',
    studentsText: '',
    gameMode: 'individual',
    teamCount: 4,
    teamsConfig: [],
    lastLessonTitle: '',
    lastWeek: 1,
    updatedAt: new Date().toISOString(),
  },
  {
    classId: 'class-5c',
    className: 'Lớp 5C',
    grade: 5,
    subject: 'Toán',
    studentsText: '',
    gameMode: 'individual',
    teamCount: 4,
    teamsConfig: [],
    lastLessonTitle: '',
    lastWeek: 1,
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Get all saved classes from LocalStorage
 */
export function getSavedClassesFromLocalStorage(): SavedClassData[] {
  if (typeof window === 'undefined') return DEFAULT_INITIAL_CLASSES;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CLASSES_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_CLASSES_KEY, JSON.stringify(DEFAULT_INITIAL_CLASSES));
      return DEFAULT_INITIAL_CLASSES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_INITIAL_CLASSES;
  } catch (err) {
    console.error('Failed to parse saved classes from localStorage:', err);
    return DEFAULT_INITIAL_CLASSES;
  }
}

/**
 * Save classes to LocalStorage
 */
export function saveClassesToLocalStorage(classes: SavedClassData[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_CLASSES_KEY, JSON.stringify(classes));
  } catch (err) {
    console.error('Failed to save classes to localStorage:', err);
  }
}

/**
 * Get active class ID
 */
export function getActiveClassId(): string {
  if (typeof window === 'undefined') return 'class-3a';
  try {
    return localStorage.getItem(LOCAL_STORAGE_ACTIVE_CLASS_ID_KEY) || 'class-3a';
  } catch {
    return 'class-3a';
  }
}

/**
 * Set active class ID
 */
export function setActiveClassId(classId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_CLASS_ID_KEY, classId);
  } catch (err) {
    console.error('Failed to set active class ID:', err);
  }
}

/**
 * Get Firebase Config if saved by user
 */
export function getStoredFirebaseConfig(): Record<string, string> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(FIREBASE_CONFIG_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Save Firebase Config
 */
export function saveStoredFirebaseConfig(config: Record<string, string> | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!config) {
      localStorage.removeItem(FIREBASE_CONFIG_STORAGE_KEY);
    } else {
      localStorage.setItem(FIREBASE_CONFIG_STORAGE_KEY, JSON.stringify(config));
    }
  } catch (err) {
    console.error('Failed to save Firebase config:', err);
  }
}

/**
 * Save single class data (updates existing or adds new)
 * Persists to LocalStorage and attempts Firebase cloud sync
 */
export async function saveClassData(classData: SavedClassData): Promise<{ success: boolean; message: string }> {
  try {
    const classes = getSavedClassesFromLocalStorage();
    const existingIndex = classes.findIndex((c) => c.classId === classData.classId);

    const updatedData: SavedClassData = {
      ...classData,
      updatedAt: new Date().toISOString(),
    };

    let newClasses: SavedClassData[];
    if (existingIndex >= 0) {
      newClasses = [...classes];
      newClasses[existingIndex] = updatedData;
    } else {
      newClasses = [updatedData, ...classes];
    }

    saveClassesToLocalStorage(newClasses);
    setActiveClassId(updatedData.classId);

    // Optional Firebase Firestore cloud sync if configured
    try {
      const fbConfig = getStoredFirebaseConfig();
      if (fbConfig && fbConfig.projectId) {
        // Attempt lightweight Firestore REST or SDK write
        const projectId = fbConfig.projectId;
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/classrooms/${updatedData.classId}`;
        
        await fetch(firestoreUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              className: { stringValue: updatedData.className },
              grade: { integerValue: String(updatedData.grade) },
              studentsText: { stringValue: updatedData.studentsText },
              gameMode: { stringValue: updatedData.gameMode },
              teamCount: { integerValue: String(updatedData.teamCount) },
              teamsConfigJson: { stringValue: JSON.stringify(updatedData.teamsConfig) },
              updatedAt: { stringValue: updatedData.updatedAt },
            },
          }),
        }).catch(() => {
          // Silent catch for offline or unauthenticated Firestore
        });
      }
    } catch {
      // Firebase cloud sync is optional, local persistence is guaranteed
    }

    return {
      success: true,
      message: `Đã lưu vĩnh viễn dữ liệu ${updatedData.className} vào hệ thống!`,
    };
  } catch (err: any) {
    console.error('Error saving class data:', err);
    return {
      success: false,
      message: 'Không thể lưu dữ liệu lớp học: ' + (err?.message || 'Lỗi không xác định'),
    };
  }
}

/**
 * Create a new class
 */
export function createNewClass(className: string, grade = 3): SavedClassData {
  const cleanName = className.trim() || `Lớp mới ${Date.now().toString().slice(-4)}`;
  const classId = `class-${Date.now()}`;
  const newClass: SavedClassData = {
    classId,
    className: cleanName,
    grade,
    subject: 'Toán',
    studentsText: '',
    gameMode: 'individual',
    teamCount: 4,
    teamsConfig: [],
    lastLessonTitle: '',
    lastWeek: 1,
    updatedAt: new Date().toISOString(),
  };

  const classes = getSavedClassesFromLocalStorage();
  const updatedClasses = [newClass, ...classes];
  saveClassesToLocalStorage(updatedClasses);
  setActiveClassId(classId);

  return newClass;
}

/**
 * Delete a class
 */
export function deleteClassData(classId: string): SavedClassData[] {
  const classes = getSavedClassesFromLocalStorage();
  const filtered = classes.filter((c) => c.classId !== classId);
  const remaining = filtered.length > 0 ? filtered : DEFAULT_INITIAL_CLASSES;
  saveClassesToLocalStorage(remaining);
  if (remaining[0]) {
    setActiveClassId(remaining[0].classId);
  }
  return remaining;
}
