// User type
export interface User {
    id: string;
    email: string;
    name: string;
    created_at: string;
}

// Project type
export interface Project {
    id: string;
    name: string;
    code: string;
    current_classes: number;
    target_classes: number;
    leader_id: string;
    created_at: string;
}

// Project member type
export interface ProjectMember {
    project_id: string;
    user_id: string;
    assigned_class: number | null;
    user?: User;
}

// Gender type
export type Gender = 'male' | 'female';

// Behavior types
export interface BehaviorOption {
    id: string;
    label: string;
    style?: 'danger' | 'warning' | 'success' | 'neutral';
    score: number; // Difficulty score: Positive = Difficult, Negative/Zero = Helpful/Easy
}

export const BEHAVIOR_OPTIONS: BehaviorOption[] = [
    { id: 'leadership', label: '리더십', style: 'success', score: -5 },
    { id: 'active', label: '활동적', style: 'success', score: -2 },
    { id: 'introverted', label: '내향적', style: 'neutral', score: 0 },
    { id: 'extroverted', label: '외향적', style: 'neutral', score: 0 },
    { id: 'academic_high', label: '학습우수', style: 'success', score: -5 },
    { id: 'academic_low', label: '학습부진', style: 'warning', score: 5 },
    { id: 'distracted', label: '산만함', style: 'danger', score: 5 },
    { id: 'disruptive', label: '수업방해', style: 'danger', score: 10 },
    { id: 'helpful', label: '협조적', style: 'success', score: -5 },
    { id: 'responsible', label: '책임감', style: 'success', score: -5 },
    { id: 'creative', label: '창의적', style: 'success', score: -2 },
    { id: 'aggressive', label: '공격적', style: 'danger', score: 10 },
    { id: 'passive', label: '소극적', style: 'neutral', score: 2 },
    { id: 'emotional', label: '정서불안', style: 'danger', score: 8 },
    { id: 'peer_issues', label: '교우관계', style: 'danger', score: 8 },
    { id: 'lying', label: '거짓말', style: 'danger', score: 8 },
    { id: 'other_behavior', label: '기타', style: 'neutral', score: 1 },
];

export type BehaviorType = typeof BEHAVIOR_OPTIONS[number]['id'];

// Special notes types
export interface SpecialNoteOption {
    id: string;
    label: string;
    style?: 'danger' | 'warning' | 'success' | 'neutral';
    score: number;
}

export const SPECIAL_NOTES_OPTIONS: SpecialNoteOption[] = [
    { id: 'adhd', label: 'ADHD', style: 'danger', score: 10 },
    { id: 'twins', label: '쌍둥이', style: 'warning', score: 3 },
    { id: 'disability', label: '장애', style: 'warning', score: 5 },
    { id: 'multicultural', label: '다문화', style: 'neutral', score: 1 },
    { id: 'gifted', label: '영재', style: 'success', score: -2 },
    { id: 'special_care', label: '특별관리', style: 'warning', score: 5 },
    { id: 'transfer', label: '전학생', style: 'neutral', score: 2 },
    { id: 'single_parent', label: '한부모', style: 'neutral', score: 2 },
    { id: 'grandparent', label: '조손가정', style: 'neutral', score: 2 },
    { id: 'low_income', label: '기초수급', style: 'neutral', score: 2 },
    { id: 'allergy', label: '알레르기', style: 'warning', score: 3 },
    { id: 'violence', label: '학폭관련', style: 'danger', score: 15 },
    { id: 'other_note', label: '기타', style: 'neutral', score: 1 },
];

export type SpecialNoteType = typeof SPECIAL_NOTES_OPTIONS[number]['id'];

// Student type
export interface Student {
    id: string;
    project_id: string;
    student_number?: number;
    name: string;
    current_class: number;
    original_class?: number;
    target_class: number | null;
    gender: Gender;
    behaviors: BehaviorType[];
    special_notes: SpecialNoteType[];
    custom_behavior?: string;
    custom_special_note?: string;
    memo?: string;
    created_by: string;
    created_at: string;
}

// Relationship type
export type RelationType = 'conflict' | 'friendly';

export interface Relationship {
    id: string;
    student_id: string;
    target_student_id: string;
    type: RelationType;
    student?: Student;
    target_student?: Student;
}

// Class assignment statistics
export interface ClassStats {
    classNumber: number;
    totalStudents: number;
    maleCount: number;
    femaleCount: number;
    behaviorDistribution: Record<BehaviorType, number>;
    specialNotesCount: number;
    conflictWarnings: number;
}

// Form types
export interface StudentFormData {
    name: string;
    current_class: number;
    gender: Gender;
    behaviors: BehaviorType[];
    special_notes: SpecialNoteType[];
}

export interface ProjectFormData {
    name: string;
    current_classes: number;
    target_classes: number;
}

// API Response types
export interface ApiResponse<T> {
    data?: T;
    error?: string;
}

// Drag and drop types
export interface DraggableStudentData {
    student: Student;
    sourceClass: number | null;
}
