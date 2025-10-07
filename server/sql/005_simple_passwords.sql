-- Update all users with their specific passwords
-- This replaces the bcrypt hashes with simple password validation

UPDATE users SET password_hash = 'CivilifyP1!' WHERE username = 'arda';
UPDATE users SET password_hash = 'CivilifyP2!' WHERE username = 'deloscientos';
UPDATE users SET password_hash = 'CivilifyP3!' WHERE username = 'paden';
UPDATE users SET password_hash = 'CivilifyP4!' WHERE username = 'sendrijas';
UPDATE users SET password_hash = 'CivilifyP5!' WHERE username = 'tagarao';

-- Verify the update
SELECT username, name, person_id, password_hash FROM users ORDER BY person_id;
