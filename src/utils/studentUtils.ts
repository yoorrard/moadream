import { Student, BEHAVIOR_OPTIONS, SPECIAL_NOTES_OPTIONS } from '@/types';

export const getStudentLevel = (s: Student) => {
    let score = 0;
    s.behaviors?.forEach(b => {
        const opt = BEHAVIOR_OPTIONS.find(o => o.id === b);
        if (opt) score += opt.score;
    });
    s.special_notes?.forEach(n => {
        const opt = SPECIAL_NOTES_OPTIONS.find(o => o.id === n);
        if (opt) score += opt.score;
    });

    if (s.custom_behavior) score += 1;
    if (s.custom_special_note) score += 1;

    // Returns level (1-5) and suggested Style Class Suffix or color
    // We will return the logic values. The styling can be handled by the component using CSS modules.
    if (score >= 20) return { level: 1, label: '지도 최상', color: 'danger' };
    if (score >= 10) return { level: 2, label: '지도 상', color: 'warning' }; // Orange-ish
    if (score >= 5) return { level: 3, label: '지도 중', color: 'attention' }; // Yellow
    if (score >= 0) return { level: 4, label: '지도 하', color: 'success' }; // Green
    return { level: 5, label: '양호', color: 'safe' }; // Blue
};
