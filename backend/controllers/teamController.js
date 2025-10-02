const { pool } = require('../config/database');
const { checkAndAwardBadges } = require('../services/badgeService');

// Challenge için takımları listele
async function getTeams(req, res) {
    const { challengeId } = req.params;

    try {
        const [teams] = await pool.query(`
            SELECT
                t.*,
                u.username as captain_username,
                u.avatar_url as captain_avatar,
                COUNT(DISTINCT p.id) as member_count
            FROM teams t
            JOIN users u ON t.captain_id = u.id
            LEFT JOIN participants p ON t.id = p.team_id AND p.status = 'aktif'
            WHERE t.challenge_id = ?
            GROUP BY t.id
            ORDER BY t.total_points DESC, t.created_at DESC
        `, [challengeId]);

        // Her takım için üyeleri getir
        for (let team of teams) {
            const [members] = await pool.query(`
                SELECT
                    u.id as user_id,
                    u.username,
                    u.avatar_url,
                    p.points_earned
                FROM participants p
                JOIN users u ON p.user_id = u.id
                WHERE p.team_id = ? AND p.status = 'aktif'
                ORDER BY p.points_earned DESC
            `, [team.id]);
            team.members = members;
        }

        res.json({ teams });

    } catch (error) {
        console.error('Takım listeleme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

// Takım detayını getir
async function getTeamDetail(req, res) {
    const { teamId } = req.params;

    try {
        // Takım bilgisi
        const [[team]] = await pool.query(`
            SELECT
                t.*,
                u.username as captain_username,
                u.avatar_url as captain_avatar,
                c.title as challenge_title
            FROM teams t
            JOIN users u ON t.captain_id = u.id
            JOIN challenges c ON t.challenge_id = c.id
            WHERE t.id = ?
        `, [teamId]);

        if (!team) {
            return res.status(404).json({ error: 'Takım bulunamadı' });
        }

        // Takım üyeleri
        const [members] = await pool.query(`
            SELECT
                u.id,
                u.username,
                u.avatar_url,
                u.points as total_points,
                p.points_earned,
                p.joined_at,
                p.status
            FROM participants p
            JOIN users u ON p.user_id = u.id
            WHERE p.team_id = ? AND p.status = 'aktif'
            ORDER BY p.points_earned DESC
        `, [teamId]);

        res.json({ team, members });

    } catch (error) {
        console.error('Takım detay hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

// Yeni takım oluştur
async function createTeam(req, res) {
    const { challengeId } = req.params;
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'Takım adı gerekli' });
    }

    try {
        // Challenge'ın takım challenge'ı olduğunu kontrol et
        const [[challenge]] = await pool.query(
            'SELECT is_team_based, max_team_size FROM challenges WHERE id = ?',
            [challengeId]
        );

        if (!challenge) {
            return res.status(404).json({ error: 'Challenge bulunamadı' });
        }

        if (!challenge.is_team_based) {
            return res.status(400).json({ error: 'Bu challenge takım challenge\'ı değil' });
        }

        // Kullanıcının zaten bu challenge'da takımı var mı kontrol et
        const [[existing]] = await pool.query(`
            SELECT t.id
            FROM teams t
            JOIN participants p ON t.id = p.team_id
            WHERE t.challenge_id = ? AND p.user_id = ? AND p.status = 'aktif'
        `, [challengeId, req.user.id]);

        if (existing) {
            return res.status(400).json({ error: 'Bu challenge için zaten bir takımınız var' });
        }

        // Takım oluştur
        const [result] = await pool.query(
            'INSERT INTO teams (challenge_id, name, captain_id) VALUES (?, ?, ?)',
            [challengeId, name.trim(), req.user.id]
        );

        const teamId = result.insertId;

        // Kaptanı takıma ekle - Eğer zaten katılmışsa team_id güncelle
        const [[existingParticipant]] = await pool.query(
            'SELECT id FROM participants WHERE challenge_id = ? AND user_id = ?',
            [challengeId, req.user.id]
        );

        if (existingParticipant) {
            // Zaten katılmış, team_id güncelle
            await pool.query(
                'UPDATE participants SET team_id = ?, status = ? WHERE challenge_id = ? AND user_id = ?',
                [teamId, 'aktif', challengeId, req.user.id]
            );
        } else {
            // Yeni katılım
            await pool.query(
                'INSERT INTO participants (challenge_id, user_id, team_id, status) VALUES (?, ?, ?, ?)',
                [challengeId, req.user.id, teamId, 'aktif']
            );
        }

        // Badge kontrolü yap (takım oluşturma badge'leri için)
        await checkAndAwardBadges(req.user.id, 'team_create');

        res.status(201).json({
            message: 'Takım oluşturuldu',
            team_id: teamId
        });

    } catch (error) {
        console.error('Takım oluşturma hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

// Takıma katıl
async function joinTeam(req, res) {
    const { teamId } = req.params;

    try {
        // Takım bilgisi
        const [[team]] = await pool.query(
            'SELECT challenge_id, captain_id FROM teams WHERE id = ?',
            [teamId]
        );

        if (!team) {
            return res.status(404).json({ error: 'Takım bulunamadı' });
        }

        // Challenge bilgisi
        const [[challenge]] = await pool.query(
            'SELECT max_team_size FROM challenges WHERE id = ?',
            [team.challenge_id]
        );

        // Kullanıcının zaten bu challenge'da takımı var mı
        const [[existing]] = await pool.query(`
            SELECT t.id, t.name
            FROM teams t
            JOIN participants p ON t.id = p.team_id
            WHERE t.challenge_id = ? AND p.user_id = ? AND p.status = 'aktif'
        `, [team.challenge_id, req.user.id]);

        if (existing) {
            return res.status(400).json({
                error: `Bu challenge için zaten "${existing.name}" takımındasınız`
            });
        }

        // Takım dolu mu kontrol et
        const [[{ member_count }]] = await pool.query(
            'SELECT COUNT(*) as member_count FROM participants WHERE team_id = ? AND status = ?',
            [teamId, 'aktif']
        );

        if (challenge.max_team_size && member_count >= challenge.max_team_size) {
            return res.status(400).json({ error: 'Takım dolu' });
        }

        // Kullanıcıyı takıma ekle - Eğer zaten katılmışsa team_id güncelle
        const [[existingParticipant]] = await pool.query(
            'SELECT id FROM participants WHERE challenge_id = ? AND user_id = ?',
            [team.challenge_id, req.user.id]
        );

        if (existingParticipant) {
            // Zaten katılmış, team_id güncelle
            await pool.query(
                'UPDATE participants SET team_id = ?, status = ? WHERE challenge_id = ? AND user_id = ?',
                [teamId, 'aktif', team.challenge_id, req.user.id]
            );
        } else {
            // Yeni katılım
            await pool.query(
                'INSERT INTO participants (challenge_id, user_id, team_id, status) VALUES (?, ?, ?, ?)',
                [team.challenge_id, req.user.id, teamId, 'aktif']
            );
        }

        res.json({ message: 'Takıma katıldınız' });

    } catch (error) {
        console.error('Takıma katılma hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

// Takımdan ayrıl
async function leaveTeam(req, res) {
    const { teamId } = req.params;

    try {
        // Takım bilgisi
        const [[team]] = await pool.query(
            'SELECT challenge_id, captain_id FROM teams WHERE id = ?',
            [teamId]
        );

        if (!team) {
            return res.status(404).json({ error: 'Takım bulunamadı' });
        }

        // Kaptan ayrılamaz
        if (team.captain_id === req.user.id) {
            return res.status(400).json({ error: 'Kaptan takımdan ayrılamaz. Takımı silebilirsiniz.' });
        }

        // Kullanıcıyı takımdan çıkar
        const [result] = await pool.query(
            'DELETE FROM participants WHERE team_id = ? AND user_id = ?',
            [teamId, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Bu takımda değilsiniz' });
        }

        res.json({ message: 'Takımdan ayrıldınız' });

    } catch (error) {
        console.error('Takımdan ayrılma hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

// Takımı sil (sadece kaptan)
async function deleteTeam(req, res) {
    const { teamId } = req.params;

    try {
        const [[team]] = await pool.query(
            'SELECT captain_id FROM teams WHERE id = ?',
            [teamId]
        );

        if (!team) {
            return res.status(404).json({ error: 'Takım bulunamadı' });
        }

        if (team.captain_id !== req.user.id) {
            return res.status(403).json({ error: 'Sadece kaptan takımı silebilir' });
        }

        // Takımı sil (cascade ile participants da silinecek)
        await pool.query('DELETE FROM teams WHERE id = ?', [teamId]);

        res.json({ message: 'Takım silindi' });

    } catch (error) {
        console.error('Takım silme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

module.exports = {
    getTeams,
    getTeamDetail,
    createTeam,
    joinTeam,
    leaveTeam,
    deleteTeam
};
