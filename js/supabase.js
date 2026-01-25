// Supabase 클라이언트 설정
const SUPABASE_URL = 'https://gaddpehqcxvvylfehlxh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZGRwZWhxY3h2dnlsZmVobHhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MDE0MTgsImV4cCI6MjA4MTM3NzQxOH0.3tJUdK17TVUgY96SsA_PmGtiHm5wSyy1xtGdjNwqUbI';

// Supabase 클라이언트 초기화
let supabaseClient = null;

async function initSupabase() {
    if (supabaseClient) return supabaseClient;

    // window.supabase 확인 (HTML에서 CDN으로 로드됨)
    if (!window.supabase || !window.supabase.createClient) {
        throw new Error('Supabase 라이브러리가 로드되지 않았습니다. 페이지를 새로고침해주세요.');
    }

    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return supabaseClient;
}

// 현재 사용자 가져오기
async function getCurrentUser() {
    const client = await initSupabase();
    const { data: { user } } = await client.auth.getUser();
    return user;
}

// 회원가입 (이메일/비밀번호)
async function signUp(email, password, nickname) {
    const client = await initSupabase();

    const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
            data: {
                nickname: nickname || email.split('@')[0]
            }
        }
    });

    if (error) throw error;
    return data;
}

// 로그인 (이메일/비밀번호)
async function signIn(email, password) {
    const client = await initSupabase();

    const { data, error } = await client.auth.signInWithPassword({
        email,
        password
    });

    if (error) throw error;
    return data;
}

// 로그아웃
async function signOut() {
    const client = await initSupabase();
    const { error } = await client.auth.signOut();
    if (error) throw error;
}

// 점수 저장
async function saveScore(gameId, score) {
    const client = await initSupabase();
    const user = await getCurrentUser();

    if (!user) {
        console.log('로그인이 필요합니다.');
        return null;
    }

    const nickname = user.user_metadata?.nickname || user.user_metadata?.username || 'Player';

    const { data, error } = await client
        .from('scores')
        .insert({
            user_id: user.id,
            game_id: gameId,
            score: score,
            nickname: nickname
        });

    if (error) throw error;
    return data;
}

// 최고 점수 가져오기 (개인)
async function getMyHighScore(gameId) {
    const client = await initSupabase();
    const user = await getCurrentUser();

    if (!user) return null;

    const { data, error } = await client
        .from('scores')
        .select('score')
        .eq('user_id', user.id)
        .eq('game_id', gameId)
        .order('score', { ascending: false })
        .limit(1)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.score || 0;
}

// 랭킹 가져오기 (사용자당 최고 점수만, 상위 N명)
async function getLeaderboard(gameId, limit = 10) {
    const client = await initSupabase();

    // 더 많은 데이터를 가져온 후 사용자별 최고 점수만 필터링
    const { data, error } = await client
        .from('scores')
        .select('user_id, nickname, score, created_at')
        .eq('game_id', gameId)
        .order('score', { ascending: false })
        .limit(limit * 20); // 충분한 데이터 확보

    if (error) throw error;
    if (!data) return [];

    // 사용자별 최고 점수만 추출 (user_id가 없으면 nickname 사용)
    const userBestScores = new Map();
    for (const record of data) {
        // user_id가 있으면 user_id 사용, 없으면 nickname을 키로 사용
        const key = record.user_id || `nickname_${record.nickname}`;
        if (!userBestScores.has(key) || userBestScores.get(key).score < record.score) {
            userBestScores.set(key, {
                nickname: record.nickname,
                score: record.score,
                created_at: record.created_at
            });
        }
    }

    // Map을 배열로 변환하고 점수순 정렬 후 limit 적용
    return Array.from(userBestScores.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}

// 인증 상태 변경 리스너
async function onAuthStateChange(callback) {
    const client = await initSupabase();
    client.auth.onAuthStateChange((event, session) => {
        callback(event, session);
    });
}

// 현재 사용자 닉네임 가져오기
async function getCurrentNickname() {
    const user = await getCurrentUser();
    if (!user) return null;
    return user.user_metadata?.nickname || user.user_metadata?.username || 'Player';
}

// 게임 컬렉션 저장 (UPDATE 우선, 실패 시 INSERT)
async function saveGameCollection(gameId, collectionData, currentStage) {
    const client = await initSupabase();
    const user = await getCurrentUser();

    if (!user) {
        console.log('로그인이 필요합니다.');
        return null;
    }

    const updateData = {
        collection_data: collectionData,
        current_stage: currentStage,
        updated_at: new Date().toISOString()
    };

    // 먼저 UPDATE 시도
    const updateResult = await client
        .from('game_collections')
        .update(updateData)
        .eq('user_id', user.id)
        .eq('game_id', gameId)
        .select();

    // UPDATE가 성공하고 데이터가 있으면 반환
    if (!updateResult.error && updateResult.data && updateResult.data.length > 0) {
        return updateResult.data;
    }

    // UPDATE할 데이터가 없으면 INSERT 시도
    const insertResult = await client
        .from('game_collections')
        .insert({
            user_id: user.id,
            game_id: gameId,
            ...updateData
        });

    if (insertResult.error) throw insertResult.error;
    return insertResult.data;
}

// 게임 컬렉션 불러오기
async function loadGameCollection(gameId) {
    const client = await initSupabase();
    const user = await getCurrentUser();

    if (!user) return null;

    const { data, error } = await client
        .from('game_collections')
        .select('collection_data, current_stage')
        .eq('user_id', user.id)
        .eq('game_id', gameId)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
}

// ============================================
// MonV2 전용 API 함수들
// ============================================

// 몬스터 마스터 데이터 로드
async function getMonsters() {
    const client = await initSupabase();
    const { data, error } = await client
        .from('monsters')
        .select('*')
        .order('id');

    if (error) throw error;
    return data || [];
}

// 사용자 소유 몬스터 조회
async function getUserMonsters() {
    const client = await initSupabase();
    const user = await getCurrentUser();

    if (!user) return [];

    const { data, error } = await client
        .from('user_monsters')
        .select(`
            id,
            monster_id,
            caught_at,
            catch_stage,
            catch_count,
            level,
            experience,
            is_fusion,
            nickname,
            is_favorite,
            monsters (
                id,
                name,
                icon,
                type,
                rarity,
                description
            )
        `)
        .eq('user_id', user.id)
        .order('caught_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

// 몬스터 포획 기록 (성공 시만)
async function catchMonster(monsterId, stage, pokeballs, catchProbability, livesRemaining) {
    const client = await initSupabase();
    const user = await getCurrentUser();

    if (!user) {
        console.log('로그인이 필요합니다.');
        return null;
    }

    try {
        // 1. 이미 소유한 몬스터인지 확인
        const { data: existing, error: selectError } = await client
            .from('user_monsters')
            .select('id, catch_count')
            .eq('user_id', user.id)
            .eq('monster_id', monsterId)
            .single();

        if (selectError && selectError.code !== 'PGRST116') {
            throw selectError;
        }

        if (existing) {
            // 이미 있으면 catch_count 증가
            const { error: updateError } = await client
                .from('user_monsters')
                .update({
                    catch_count: existing.catch_count + 1,
                    last_updated: new Date().toISOString()
                })
                .eq('id', existing.id);

            if (updateError) throw updateError;
        } else {
            // 새로 추가
            const { error: insertError } = await client
                .from('user_monsters')
                .insert({
                    user_id: user.id,
                    monster_id: monsterId,
                    catch_stage: stage,
                    catch_count: 1,
                    caught_at: new Date().toISOString()
                });

            if (insertError) throw insertError;
        }

        // 2. 포획 이벤트 로그 기록 (옵셔널)
        await client
            .from('monster_catches')
            .insert({
                user_id: user.id,
                monster_id: monsterId,
                stage: stage,
                success: true,
                pokeballs_used: pokeballs,
                catch_probability: catchProbability,
                lives_remaining: livesRemaining
            });

        // 3. 진행도 업데이트
        await updateUserProgress(stage);

        return true;
    } catch (error) {
        console.error('포획 기록 중 오류:', error);
        throw error;
    }
}

// 포획 실패 기록 (옵셔널)
async function logCatchAttempt(monsterId, stage, pokeballs, catchProbability, livesRemaining, success) {
    const client = await initSupabase();
    const user = await getCurrentUser();

    if (!user) return null;

    const { error } = await client
        .from('monster_catches')
        .insert({
            user_id: user.id,
            monster_id: monsterId,
            stage: stage,
            success: success,
            pokeballs_used: pokeballs,
            catch_probability: catchProbability,
            lives_remaining: livesRemaining
        });

    if (error) console.error('포획 시도 로그 실패:', error);
}

// 사용자 진행도 업데이트
async function updateUserProgress(currentStage, gameOverIncrement = false) {
    const client = await initSupabase();
    const user = await getCurrentUser();

    if (!user) return null;

    try {
        // 현재 소유 몬스터 수 계산
        const { data: monsters, error: monstersError } = await client
            .from('user_monsters')
            .select('monster_id, catch_count')
            .eq('user_id', user.id);

        if (monstersError) throw monstersError;

        const uniqueMonsters = new Set(monsters.map(m => m.monster_id)).size;
        const totalCatches = monsters.reduce((sum, m) => sum + m.catch_count, 0);

        // 기존 진행도 확인
        const { data: existing, error: selectError } = await client
            .from('user_progress')
            .select('*')
            .eq('user_id', user.id)
            .eq('game_id', 'monv2')
            .single();

        if (selectError && selectError.code !== 'PGRST116') {
            throw selectError;
        }

        const updateData = {
            user_id: user.id,
            game_id: 'monv2',
            current_stage: currentStage,
            highest_stage: existing ? Math.max(existing.highest_stage, currentStage) : currentStage,
            unique_monsters: uniqueMonsters,
            total_catches: totalCatches,
            total_game_overs: existing ? (existing.total_game_overs + (gameOverIncrement ? 1 : 0)) : (gameOverIncrement ? 1 : 0),
            last_played_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // UPSERT
        const { error: upsertError } = await client
            .from('user_progress')
            .upsert(updateData, {
                onConflict: 'user_id'
            });

        if (upsertError) throw upsertError;

        return true;
    } catch (error) {
        console.error('진행도 업데이트 중 오류:', error);
        throw error;
    }
}

// 사용자 진행도 로드
async function loadUserProgress() {
    const client = await initSupabase();
    const user = await getCurrentUser();

    if (!user) return null;

    const { data, error } = await client
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('game_id', 'monv2')
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
}

// 사용자 컬렉션 요약 정보
async function getCollectionSummary() {
    const client = await initSupabase();
    const user = await getCurrentUser();

    if (!user) return null;

    const { data, error } = await client
        .from('v_user_collection_summary')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
}

// MonV2 랭킹 (highest_stage 기준)
async function getMonV2Leaderboard(limit = 10) {
    const client = await initSupabase();

    const { data, error } = await client
        .from('user_progress')
        .select(`
            user_id,
            highest_stage,
            unique_monsters,
            total_catches,
            last_played_at
        `)
        .eq('game_id', 'monv2')
        .order('highest_stage', { ascending: false })
        .order('unique_monsters', { ascending: false })
        .limit(limit);

    if (error) throw error;

    // 닉네임 가져오기 (auth.users는 직접 조회 불가, user_metadata 사용 불가)
    // 대신 scores 테이블에서 닉네임 조회하거나 별도 처리 필요
    return data || [];
}
