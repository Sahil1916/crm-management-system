CREATE DATABASE IF NOT EXISTS sahilcrm_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sahilcrm_db;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS admissions;
DROP TABLE IF EXISTS call_records;
DROP TABLE IF EXISTS follow_ups;
DROP TABLE IF EXISTS leads;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id BIGINT NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('ADMIN', 'MANAGER', 'COUNSELOR') NOT NULL DEFAULT 'COUNSELOR',
  active BIT(1) DEFAULT b'1',
  created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_email (email)
);

CREATE TABLE courses (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(255) NOT NULL,
  duration_months INT,
  fees DOUBLE,
  total_seats INT NOT NULL DEFAULT 60,
  filled_seats INT NOT NULL DEFAULT 0,
  status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  description VARCHAR(1000),
  created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_courses_name (name),
  UNIQUE KEY uk_courses_code (code)
);

CREATE TABLE leads (
  id BIGINT NOT NULL AUTO_INCREMENT,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(255) NOT NULL,
  country_code VARCHAR(255) DEFAULT '+91',
  course VARCHAR(255) NOT NULL,
  source ENUM('META', 'GOOGLE', 'INSTAGRAM', 'WALKIN', 'INBOUND', 'COLLEGE') NOT NULL,
  college VARCHAR(255),
  university VARCHAR(255),
  qualification ENUM('HIGH_SCHOOL', 'DIPLOMA', 'BACHELORS', 'MASTERS', 'OTHER'),
  location VARCHAR(255),
  stage ENUM('OPEN', 'CNR', 'CALLBACK', 'STAGE2', 'STAGE2_5', 'ADMITTED') NOT NULL DEFAULT 'OPEN',
  assigned_to_id BIGINT,
  created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_leads_email (email),
  KEY idx_leads_assigned_to (assigned_to_id),
  CONSTRAINT fk_leads_assigned_to FOREIGN KEY (assigned_to_id) REFERENCES users (id)
);

CREATE TABLE call_records (
  id BIGINT NOT NULL AUTO_INCREMENT,
  lead_id BIGINT NOT NULL,
  counselor_id BIGINT NOT NULL,
  call_date DATETIME(6) NOT NULL,
  call_status ENUM('CONNECTED', 'NOT_REACHABLE', 'BUSY', 'WRONG_NUMBER', 'CALLBACK_LATER', 'INTERESTED', 'NOT_INTERESTED') NOT NULL,
  duration_minutes INT,
  remarks VARCHAR(2000),
  next_follow_up_date DATETIME(6),
  created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_call_records_lead (lead_id),
  KEY idx_call_records_counselor (counselor_id),
  CONSTRAINT fk_call_records_lead FOREIGN KEY (lead_id) REFERENCES leads (id),
  CONSTRAINT fk_call_records_counselor FOREIGN KEY (counselor_id) REFERENCES users (id)
);

CREATE TABLE follow_ups (
  id BIGINT NOT NULL AUTO_INCREMENT,
  lead_id BIGINT NOT NULL,
  counselor_id BIGINT NOT NULL,
  scheduled_date DATETIME(6) NOT NULL,
  notes VARCHAR(1000),
  status ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
  created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_follow_ups_lead (lead_id),
  KEY idx_follow_ups_counselor (counselor_id),
  CONSTRAINT fk_follow_ups_lead FOREIGN KEY (lead_id) REFERENCES leads (id),
  CONSTRAINT fk_follow_ups_counselor FOREIGN KEY (counselor_id) REFERENCES users (id)
);

CREATE TABLE admissions (
  id BIGINT NOT NULL AUTO_INCREMENT,
  lead_id BIGINT NOT NULL,
  course_id BIGINT NOT NULL,
  counselor_id BIGINT,
  total_fees DOUBLE NOT NULL,
  fees_paid DOUBLE NOT NULL DEFAULT 0,
  payment_status ENUM('PENDING', 'PARTIAL', 'PAID') NOT NULL DEFAULT 'PENDING',
  admission_date DATETIME(6) NOT NULL,
  remarks VARCHAR(1000),
  created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_admissions_lead (lead_id),
  KEY idx_admissions_course (course_id),
  KEY idx_admissions_counselor (counselor_id),
  CONSTRAINT fk_admissions_lead FOREIGN KEY (lead_id) REFERENCES leads (id),
  CONSTRAINT fk_admissions_course FOREIGN KEY (course_id) REFERENCES courses (id),
  CONSTRAINT fk_admissions_counselor FOREIGN KEY (counselor_id) REFERENCES users (id)
);

INSERT INTO users (id, email, password, name, role, active, created_at, updated_at) VALUES
  (1, 'admin@sahilcrm.in', '$2a$10$5CV3BPxUblDZtqQDSZKfiu.84nSNZVKQQz9qvOB49B8nDzU4jW7Wa', 'Super Admin', 'ADMIN', b'1', NOW(6), NOW(6)),
  (2, 'manager@sahilcrm.in', '$2a$10$5CV3BPxUblDZtqQDSZKfiu.84nSNZVKQQz9qvOB49B8nDzU4jW7Wa', 'Amit Sharma', 'MANAGER', b'1', NOW(6), NOW(6)),
  (3, 'rahul@sahilcrm.in', '$2a$10$5CV3BPxUblDZtqQDSZKfiu.84nSNZVKQQz9qvOB49B8nDzU4jW7Wa', 'Rahul Kumar', 'COUNSELOR', b'1', NOW(6), NOW(6)),
  (4, 'priya@sahilcrm.in', '$2a$10$5CV3BPxUblDZtqQDSZKfiu.84nSNZVKQQz9qvOB49B8nDzU4jW7Wa', 'Priya Sharma', 'COUNSELOR', b'1', NOW(6), NOW(6)),
  (5, 'ankit@sahilcrm.in', '$2a$10$5CV3BPxUblDZtqQDSZKfiu.84nSNZVKQQz9qvOB49B8nDzU4jW7Wa', 'Ankit Mehta', 'COUNSELOR', b'1', NOW(6), NOW(6));

INSERT INTO courses (id, name, code, duration_months, fees, total_seats, filled_seats, status, description, created_at, updated_at) VALUES
  (1, 'Master of Business Administration', 'MBA', 24, 850000, 120, 46, 'ACTIVE', 'Two-year MBA program with Finance, Marketing, HR, and Operations specializations.', NOW(6), NOW(6)),
  (2, 'Master of Computer Applications', 'MCA', 24, 620000, 60, 29, 'ACTIVE', 'Two-year postgraduate program in software development and modern computing.', NOW(6), NOW(6)),
  (3, 'Bachelor of Business Administration', 'BBA', 36, 450000, 90, 53, 'ACTIVE', 'Three-year undergraduate program in management and entrepreneurship.', NOW(6), NOW(6)),
  (4, 'Bachelor of Computer Applications', 'BCA', 36, 380000, 60, 20, 'ACTIVE', 'Three-year undergraduate program in programming, databases, and web technologies.', NOW(6), NOW(6)),
  (5, 'Post Graduate Diploma in Digital Marketing', 'PGDM-DM', 12, 240000, 40, 12, 'ACTIVE', 'One-year career-focused digital marketing program.', NOW(6), NOW(6));

INSERT INTO leads (id, first_name, last_name, email, phone, country_code, course, source, college, university, qualification, location, stage, assigned_to_id, created_at, updated_at) VALUES
  (1, 'Neha', 'Joshi', 'neha.joshi@example.com', '8765432109', '+91', 'MCA', 'GOOGLE', 'St. Xavier''s College', 'Mumbai University', 'BACHELORS', 'Mumbai', 'ADMITTED', 3, DATE_SUB(NOW(6), INTERVAL 18 DAY), NOW(6)),
  (2, 'Sana', 'Shaikh', 'sana.shaikh@example.com', '5432109876', '+91', 'MCA', 'META', 'Rizvi College', 'Mumbai University', 'BACHELORS', 'Mumbai', 'OPEN', 3, DATE_SUB(NOW(6), INTERVAL 13 DAY), NOW(6)),
  (3, 'Karan', 'Malhotra', 'karan.malhotra@example.com', '9988776655', '+91', 'MBA', 'INSTAGRAM', 'NMIMS', 'NMIMS University', 'BACHELORS', 'Pune', 'CALLBACK', 3, DATE_SUB(NOW(6), INTERVAL 10 DAY), NOW(6)),
  (4, 'Divya', 'Nair', 'divya.nair@example.com', '8877665544', '+91', 'BBA', 'WALKIN', 'Christ Junior College', 'Christ University', 'HIGH_SCHOOL', 'Bangalore', 'STAGE2', 4, DATE_SUB(NOW(6), INTERVAL 9 DAY), NOW(6)),
  (5, 'Rohit', 'Sen', 'rohit.sen@example.com', '7766554433', '+91', 'BCA', 'META', 'Symbiosis College', 'Symbiosis International', 'HIGH_SCHOOL', 'Pune', 'CNR', 5, DATE_SUB(NOW(6), INTERVAL 8 DAY), NOW(6)),
  (6, 'Aarav', 'Patel', 'aarav.patel@example.com', '9876501234', '+91', 'MBA', 'GOOGLE', 'H L College', 'Gujarat University', 'BACHELORS', 'Ahmedabad', 'STAGE2_5', 4, DATE_SUB(NOW(6), INTERVAL 7 DAY), NOW(6)),
  (7, 'Meera', 'Iyer', 'meera.iyer@example.com', '9123456780', '+91', 'PGDM-DM', 'INBOUND', 'Ethiraj College', 'Madras University', 'BACHELORS', 'Chennai', 'OPEN', 5, DATE_SUB(NOW(6), INTERVAL 6 DAY), NOW(6)),
  (8, 'Kabir', 'Khan', 'kabir.khan@example.com', '9012345678', '+91', 'BCA', 'COLLEGE', 'Modern College', 'SPPU', 'HIGH_SCHOOL', 'Pune', 'CALLBACK', 3, DATE_SUB(NOW(6), INTERVAL 5 DAY), NOW(6)),
  (9, 'Isha', 'Gupta', 'isha.gupta@example.com', '8899001122', '+91', 'BBA', 'INSTAGRAM', 'Delhi Public School', 'CBSE', 'HIGH_SCHOOL', 'Delhi', 'ADMITTED', 4, DATE_SUB(NOW(6), INTERVAL 4 DAY), NOW(6)),
  (10, 'Aditya', 'Rao', 'aditya.rao@example.com', '7788990011', '+91', 'MBA', 'META', 'Fergusson College', 'SPPU', 'BACHELORS', 'Pune', 'OPEN', 5, DATE_SUB(NOW(6), INTERVAL 3 DAY), NOW(6)),
  (11, 'Pooja', 'Verma', 'pooja.verma@example.com', '9988007766', '+91', 'MCA', 'GOOGLE', 'Patna Women''s College', 'Patna University', 'BACHELORS', 'Patna', 'STAGE2', 3, DATE_SUB(NOW(6), INTERVAL 2 DAY), NOW(6)),
  (12, 'Yash', 'Kulkarni', 'yash.kulkarni@example.com', '9090901234', '+91', 'BBA', 'WALKIN', 'MES College', 'SPPU', 'HIGH_SCHOOL', 'Nashik', 'OPEN', 4, DATE_SUB(NOW(6), INTERVAL 1 DAY), NOW(6));

INSERT INTO call_records (id, lead_id, counselor_id, call_date, call_status, duration_minutes, remarks, next_follow_up_date, created_at) VALUES
  (1, 1, 3, DATE_SUB(NOW(6), INTERVAL 16 DAY), 'INTERESTED', 12, 'Student interested in MCA. Discussed fees and placement support.', DATE_SUB(NOW(6), INTERVAL 14 DAY), DATE_SUB(NOW(6), INTERVAL 16 DAY)),
  (2, 3, 3, DATE_SUB(NOW(6), INTERVAL 9 DAY), 'CALLBACK_LATER', 5, 'Requested callback after discussing with parents.', DATE_ADD(NOW(6), INTERVAL 1 DAY), DATE_SUB(NOW(6), INTERVAL 9 DAY)),
  (3, 4, 4, DATE_SUB(NOW(6), INTERVAL 8 DAY), 'CONNECTED', 9, 'Walk-in lead. Sent BBA brochure on WhatsApp.', DATE_SUB(NOW(6), INTERVAL 6 DAY), DATE_SUB(NOW(6), INTERVAL 8 DAY)),
  (4, 5, 5, DATE_SUB(NOW(6), INTERVAL 7 DAY), 'NOT_REACHABLE', 0, 'Phone was unreachable. Try again in evening.', DATE_ADD(NOW(6), INTERVAL 2 DAY), DATE_SUB(NOW(6), INTERVAL 7 DAY)),
  (5, 9, 4, DATE_SUB(NOW(6), INTERVAL 3 DAY), 'INTERESTED', 14, 'Confirmed BBA admission process and documents.', NULL, DATE_SUB(NOW(6), INTERVAL 3 DAY));

INSERT INTO follow_ups (id, lead_id, counselor_id, scheduled_date, notes, status, created_at) VALUES
  (1, 2, 3, DATE_ADD(NOW(6), INTERVAL 1 DAY), 'Call Sana for MCA fee clarification.', 'SCHEDULED', NOW(6)),
  (2, 3, 3, DATE_ADD(NOW(6), INTERVAL 1 DAY), 'Callback Karan after parent discussion.', 'SCHEDULED', NOW(6)),
  (3, 4, 4, DATE_SUB(NOW(6), INTERVAL 6 DAY), 'Send BBA eligibility details.', 'COMPLETED', DATE_SUB(NOW(6), INTERVAL 8 DAY)),
  (4, 5, 5, DATE_ADD(NOW(6), INTERVAL 2 DAY), 'Retry Rohit call in evening.', 'SCHEDULED', NOW(6)),
  (5, 7, 5, DATE_ADD(NOW(6), INTERVAL 3 DAY), 'Share PGDM-DM module-wise curriculum.', 'SCHEDULED', NOW(6)),
  (6, 11, 3, DATE_ADD(NOW(6), INTERVAL 4 DAY), 'Schedule MCA counseling session.', 'SCHEDULED', NOW(6));

INSERT INTO admissions (id, lead_id, course_id, counselor_id, total_fees, fees_paid, payment_status, admission_date, remarks, created_at) VALUES
  (1, 1, 2, 3, 620000, 310000, 'PARTIAL', DATE_SUB(NOW(6), INTERVAL 5 DAY), 'First installment paid. Second due in 30 days.', DATE_SUB(NOW(6), INTERVAL 5 DAY)),
  (2, 9, 3, 4, 450000, 450000, 'PAID', DATE_SUB(NOW(6), INTERVAL 2 DAY), 'Full payment received through bank transfer.', DATE_SUB(NOW(6), INTERVAL 2 DAY));

SELECT 'SahilCRM demo database imported successfully' AS status;
SELECT 'Login: admin@sahilcrm.in / password123' AS admin_login;
SELECT 'Login: manager@sahilcrm.in / password123' AS manager_login;
SELECT 'Login: rahul@sahilcrm.in / password123' AS counselor_login;
