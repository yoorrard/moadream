'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User as AuthUser, Session } from '@supabase/supabase-js';
import { User } from '@/types';

interface AuthState {
    user: User | null;
    authUser: AuthUser | null;
    session: Session | null;
    loading: boolean;
    initialized: boolean;
}

export function useAuth() {
    const [state, setState] = useState<AuthState>({
        user: null,
        authUser: null,
        session: null,
        loading: true,
        initialized: false,
    });

    const supabase = useMemo(() => createClient(), []);

    // 프로필 조회 함수 - 5초 타임아웃 + 자가 치유(Self-healing)
    const fetchProfile = useCallback(async (userId: string, sessionUser?: AuthUser): Promise<User | null> => {
        try {
            // 타임아웃 프로미스
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Timeout')), 5000);
            });

            // 프로필 조회 프로미스
            const fetchPromise = supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            const { data: profile, error } = await Promise.race([fetchPromise, timeoutPromise]);

            if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
                console.warn('Profile fetch error:', error.message);
                return null;
            }

            if (profile) {
                return {
                    id: profile.id,
                    email: profile.email || '',
                    name: profile.name,
                    created_at: profile.created_at,
                };
            }

            // 프로필이 없고 sessionUser 정보가 있다면 생성 시도 (Self-healing)
            if (!profile && sessionUser) {
                console.log('Profile missing, attempting to create...');
                const newProfile = {
                    id: userId,
                    name: sessionUser.user_metadata.name || sessionUser.user_metadata.full_name || sessionUser.email?.split('@')[0] || '사용자',
                };

                const { data: created, error: createError } = await supabase
                    .from('profiles')
                    .insert(newProfile)
                    .select()
                    .single();

                if (createError) {
                    console.error('Failed to create profile:', createError);
                    return null;
                }

                return {
                    id: created.id,
                    email: sessionUser.email || '',
                    name: created.name,
                    created_at: created.created_at,
                };
            }

            return null;
        } catch (e: any) {
            if (e.message === 'Timeout') {
                console.warn('Profile fetch timeout');
            } else {
                console.error('Profile fetch exception:', e);
            }
            return null;
        }
    }, [supabase]);

    // 초기화
    useEffect(() => {
        let mounted = true;

        const initialize = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (!mounted) return;

                if (error) {
                    console.error('getSession error:', error);
                    setState({ user: null, authUser: null, session: null, loading: false, initialized: true });
                    return;
                }

                if (!session?.user) {
                    setState({ user: null, authUser: null, session: null, loading: false, initialized: true });
                    return;
                }

                // 세션이 있으면 먼저 authUser 설정하고 initialized를 true로
                setState({
                    user: null,
                    authUser: session.user,
                    session: session,
                    loading: false,  // 로딩 완료
                    initialized: true,  // 초기화 완료
                });

                // 프로필은 백그라운드에서 조회
                const profile = await fetchProfile(session.user.id, session.user);
                if (mounted && profile) {
                    setState(prev => ({
                        ...prev,
                        user: {
                            ...profile,
                            email: session.user.email || profile.email || '',
                        },
                    }));
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                if (mounted) {
                    setState({ user: null, authUser: null, session: null, loading: false, initialized: true });
                }
            }
        };

        initialize();

        // 인증 상태 변화 구독
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!mounted) return;

                console.log('Auth event:', event);

                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    if (session?.user) {
                        setState({
                            user: null,
                            authUser: session.user,
                            session: session,
                            loading: false,
                            initialized: true,
                        });

                        // 프로필 백그라운드 조회
                        const profile = await fetchProfile(session.user.id, session.user);
                        if (mounted && profile) {
                            setState(prev => ({
                                ...prev,
                                user: {
                                    ...profile,
                                    email: session.user.email || profile.email || '',
                                },
                            }));
                        }
                    }
                } else if (event === 'SIGNED_OUT') {
                    setState({ user: null, authUser: null, session: null, loading: false, initialized: true });
                }
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [supabase, fetchProfile]);

    // 구글 로그인
    const signInWithGoogle = useCallback(async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent select_account',
                },
            }
        });
        if (error) throw error;
        return data;
    }, [supabase]);

    // 로그아웃
    const signOut = useCallback(async () => {
        try {
            await supabase.auth.signOut();
            localStorage.clear(); // Clear any local state
        } catch (error) {
            console.error('SignOut error:', error);
        }
        setState({ user: null, authUser: null, session: null, loading: false, initialized: true });
        window.location.href = '/'; // Hard reload to clear everything
    }, [supabase]);

    // 프로필 새로고침
    const refreshProfile = useCallback(async () => {
        if (!state.authUser) return;

        const profile = await fetchProfile(state.authUser.id);
        if (profile) {
            setState(prev => ({
                ...prev,
                user: {
                    ...profile,
                    email: prev.authUser?.email || profile.email || '',
                },
            }));
        }
    }, [state.authUser, fetchProfile]);

    return {
        user: state.user,
        authUser: state.authUser,
        session: state.session,
        loading: state.loading,
        initialized: state.initialized,
        signInWithGoogle,
        signOut,
        refreshProfile,
    };
}
