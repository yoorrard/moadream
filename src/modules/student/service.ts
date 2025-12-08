import { createClient } from '@/lib/supabase/server';
import { Student, Relationship, BehaviorType, SpecialNoteType, Gender } from '@/types';

export async function getStudents(projectId: string): Promise<Student[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('students')
        .select('id, project_id, student_number, name, current_class, original_class, target_class, gender, behaviors, special_notes, custom_behavior, custom_special_note, memo, created_by, created_at')
        .eq('project_id', projectId)
        .order('current_class', { ascending: true })
        .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
}

export async function getStudentsByClass(projectId: string, classNumber: number): Promise<Student[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('students')
        .select('id, project_id, student_number, name, current_class, original_class, target_class, gender, behaviors, special_notes, custom_behavior, custom_special_note, memo, created_by, created_at')
        .eq('project_id', projectId)
        .eq('current_class', classNumber)
        .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
}

export async function addStudent(
    projectId: string,
    name: string,
    currentClass: number,
    gender: Gender,
    behaviors: BehaviorType[],
    specialNotes: SpecialNoteType[],
    createdBy: string
): Promise<Student> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('students')
        .insert([
            {
                project_id: projectId,
                name,
                current_class: currentClass,
                gender,
                behaviors,
                special_notes: specialNotes,
                created_by: createdBy,
                target_class: null,
            },
        ])
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function bulkAddStudents(
    projectId: string,
    students: Array<{
        name: string;
        currentClass: number;
        gender: Gender;
    }>,
    createdBy: string
): Promise<Student[]> {
    const supabase = await createClient();

    const studentsToInsert = students.map((s) => ({
        project_id: projectId,
        name: s.name,
        current_class: s.currentClass,
        gender: s.gender,
        behaviors: [],
        special_notes: [],
        created_by: createdBy,
        target_class: null,
    }));

    const { data, error } = await supabase
        .from('students')
        .insert(studentsToInsert)
        .select();

    if (error) throw error;
    return data || [];
}

export async function updateStudent(
    studentId: string,
    updates: Partial<{
        name: string;
        currentClass: number;
        targetClass: number | null;
        gender: Gender;
        behaviors: BehaviorType[];
        specialNotes: SpecialNoteType[];
    }>
): Promise<Student> {
    const supabase = await createClient();

    const updateData: Record<string, any> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.currentClass !== undefined) updateData.current_class = updates.currentClass;
    if (updates.targetClass !== undefined) updateData.target_class = updates.targetClass;
    if (updates.gender !== undefined) updateData.gender = updates.gender;
    if (updates.behaviors !== undefined) updateData.behaviors = updates.behaviors;
    if (updates.specialNotes !== undefined) updateData.special_notes = updates.specialNotes;

    const { data, error } = await supabase
        .from('students')
        .update(updateData)
        .eq('id', studentId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteStudent(studentId: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);

    if (error) throw error;
}

export async function assignStudentToClass(
    studentId: string,
    targetClass: number | null
): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('students')
        .update({ target_class: targetClass })
        .eq('id', studentId);

    if (error) throw error;
}

// 관계 관리
export async function getRelationships(projectId: string): Promise<Relationship[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('relationships')
        .select(`
      *,
      student:students!relationships_student_id_fkey(*),
      target_student:students!relationships_target_student_id_fkey(*)
    `)
        .eq('student.project_id', projectId);

    if (error) throw error;
    return data || [];
}

export async function addRelationship(
    studentId: string,
    targetStudentId: string,
    type: 'conflict' | 'friendly'
): Promise<Relationship> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('relationships')
        .insert([
            {
                student_id: studentId,
                target_student_id: targetStudentId,
                type,
            },
        ])
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteRelationship(relationshipId: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('relationships')
        .delete()
        .eq('id', relationshipId);

    if (error) throw error;
}

export async function getStudentRelationships(studentId: string): Promise<Relationship[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('relationships')
        .select(`
      *,
      target_student:students!relationships_target_student_id_fkey(*)
    `)
        .eq('student_id', studentId);

    if (error) throw error;
    return data || [];
}
