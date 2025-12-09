import { createClient } from '@/lib/supabase/server';
import { Project, ProjectMember } from '@/types';

// 6자리 프로젝트 코드 생성
function generateProjectCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 혼동되는 문자 제외
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export async function createProject(
    name: string,
    currentClasses: number,
    targetClasses: number,
    leaderId: string
): Promise<Project> {
    const supabase = await createClient();

    // 고유한 코드 생성
    let code = generateProjectCode();
    let isUnique = false;

    while (!isUnique) {
        const { data: existing } = await supabase
            .from('projects')
            .select('id')
            .eq('code', code)
            .single();

        if (!existing) {
            isUnique = true;
        } else {
            code = generateProjectCode();
        }
    }

    const { data, error } = await supabase
        .from('projects')
        .insert([
            {
                name,
                code,
                current_classes: currentClasses,
                target_classes: targetClasses,
                leader_id: leaderId,
            },
        ])
        .select()
        .single();

    if (error) throw error;

    // 리더를 멤버로 추가
    await supabase.from('project_members').insert([
        {
            project_id: data.id,
            user_id: leaderId,
            assigned_class: null,
        },
    ]);

    return data;
}

export async function getProject(projectId: string): Promise<Project | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

    if (error) return null;
    return data;
}

export async function getProjectByCode(code: string): Promise<Project | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .rpc('get_project_by_code', { p_code: code.toUpperCase() });

    if (error || !data || data.length === 0) return null;
    return data[0] as Project;
}

export async function getUserProjects(userId: string): Promise<Project[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('project_members')
        .select(`
      project_id,
      assigned_class,
      projects (*)
    `)
        .eq('user_id', userId);

    if (error) throw error;

    return data?.map((item: any) => ({
        ...item.projects,
        assigned_class: item.assigned_class,
    })) || [];
}

export async function joinProject(projectId: string, userId: string): Promise<void> {
    const supabase = await createClient();

    // 이미 멤버인지 확인
    const { data: existing } = await supabase
        .from('project_members')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .single();

    if (existing) {
        throw new Error('이미 참여한 프로젝트입니다.');
    }

    const { error } = await supabase.from('project_members').insert([
        {
            project_id: projectId,
            user_id: userId,
            assigned_class: null,
        },
    ]);

    if (error) throw error;
}

export async function getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('project_members')
        .select(`
      *,
      user:profiles(*)
    `)
        .eq('project_id', projectId);

    if (error) throw error;
    return data || [];
}

export async function assignClassToMember(
    projectId: string,
    userId: string,
    classNumber: number
): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('project_members')
        .update({ assigned_class: classNumber })
        .eq('project_id', projectId)
        .eq('user_id', userId);

    if (error) throw error;
}
