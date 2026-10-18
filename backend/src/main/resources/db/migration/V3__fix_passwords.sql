-- V3__fix_passwords.sql
-- Fix all user passwords to correct BCrypt hash for "Admin@123"
-- This corrects the broken hash from the original V2 seed

-- Update all existing users to the correct password hash for Admin@123
UPDATE users SET password = '$2a$10$E58NeEFTzKrJJqkjnXiMPemKja9/2x9V8O0P3SewcJmwS8BholULe'
WHERE email IN (
    'admin@admitpro.com',
    'priya@admitpro.com',
    'amit@admitpro.com',
    'karan@admitpro.com',
    'sneha@admitpro.com'
);

-- Insert users if they don't exist yet (fresh install)
INSERT IGNORE INTO users (name, email, password, role, phone, is_active) VALUES
('Super Admin',  'admin@admitpro.com',  '$2a$10$E58NeEFTzKrJJqkjnXiMPemKja9/2x9V8O0P3SewcJmwS8BholULe', 'ADMIN',      '9000000001', 1),
('Priya Desai',  'priya@admitpro.com',  '$2a$10$E58NeEFTzKrJJqkjnXiMPemKja9/2x9V8O0P3SewcJmwS8BholULe', 'COUNSELLOR', '9000000002', 1),
('Amit Kumar',   'amit@admitpro.com',   '$2a$10$E58NeEFTzKrJJqkjnXiMPemKja9/2x9V8O0P3SewcJmwS8BholULe', 'COUNSELLOR', '9000000003', 1),
('Karan Mehta',  'karan@admitpro.com',  '$2a$10$E58NeEFTzKrJJqkjnXiMPemKja9/2x9V8O0P3SewcJmwS8BholULe', 'TRAINER',    '9000000004', 1),
('Sneha Patil',  'sneha@admitpro.com',  '$2a$10$E58NeEFTzKrJJqkjnXiMPemKja9/2x9V8O0P3SewcJmwS8BholULe', 'STUDENT',    '9000000005', 1);

-- Ensure courses exist
INSERT IGNORE INTO courses (name, code, level, duration_months, fee, description, is_active) VALUES
('M.Tech Computer Science',       'MT-CSE',  'POSTGRADUATE',  24, 120000.00, 'Advanced CS with AI/ML specialization.', 1),
('B.Tech Information Technology', 'BT-IT',   'UNDERGRADUATE', 48,  80000.00, 'Core IT engineering with industry projects.', 1),
('MBA General Management',        'MBA-GEN', 'POSTGRADUATE',  24,  95000.00, 'Business administration program.', 1),
('BBA General',                   'BBA-GEN', 'UNDERGRADUATE', 36,  55000.00, 'Foundation business management degree.', 1),
('MCA Computer Applications',     'MCA-CS',  'POSTGRADUATE',  24,  75000.00, 'Applied computing and software development.', 1),
('BCA Computer Applications',     'BCA-CS',  'UNDERGRADUATE', 36,  50000.00, 'Undergraduate computer applications program.', 1);
