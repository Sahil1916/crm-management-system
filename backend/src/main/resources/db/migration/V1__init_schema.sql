-- AdmitPro Schema V1

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS users (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(20) NOT NULL,
    phone       VARCHAR(15),
    is_active   TINYINT(1) NOT NULL DEFAULT 1,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    name             VARCHAR(100) NOT NULL,
    code             VARCHAR(20) NOT NULL UNIQUE,
    level            VARCHAR(20) NOT NULL,
    duration_months  INT NOT NULL,
    fee              DECIMAL(10,2) NOT NULL,
    description      TEXT,
    is_active        TINYINT(1) NOT NULL DEFAULT 1,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS enquiries (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    lead_name       VARCHAR(100) NOT NULL,
    phone           VARCHAR(15) NOT NULL,
    email           VARCHAR(150),
    course_id       BIGINT NOT NULL,
    counsellor_id   BIGINT,
    status          VARCHAR(20) NOT NULL DEFAULT 'NEW',
    priority        VARCHAR(10) NOT NULL DEFAULT 'COLD',
    source          VARCHAR(50),
    remarks         TEXT,
    enquiry_date    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id)     REFERENCES courses(id),
    FOREIGN KEY (counsellor_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS call_records (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    enquiry_id     BIGINT NOT NULL,
    counsellor_id  BIGINT NOT NULL,
    notes          TEXT,
    outcome        VARCHAR(20) NOT NULL,
    called_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enquiry_id)    REFERENCES enquiries(id) ON DELETE CASCADE,
    FOREIGN KEY (counsellor_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS follow_ups (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    enquiry_id      BIGINT NOT NULL,
    counsellor_id   BIGINT NOT NULL,
    remarks         TEXT,
    follow_up_date  DATE NOT NULL,
    is_done         TINYINT(1) NOT NULL DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enquiry_id)    REFERENCES enquiries(id) ON DELETE CASCADE,
    FOREIGN KEY (counsellor_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS admissions (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    enquiry_id      BIGINT,
    student_id      BIGINT NOT NULL,
    course_id       BIGINT NOT NULL,
    trainer_id      BIGINT,
    fee_paid        DECIMAL(10,2) NOT NULL DEFAULT 0,
    admission_date  DATE NOT NULL,
    payment_status  VARCHAR(10) NOT NULL DEFAULT 'PENDING',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enquiry_id)  REFERENCES enquiries(id) ON DELETE SET NULL,
    FOREIGN KEY (student_id)  REFERENCES users(id),
    FOREIGN KEY (course_id)   REFERENCES courses(id),
    FOREIGN KEY (trainer_id)  REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS attendance (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id       BIGINT NOT NULL,
    trainer_id       BIGINT NOT NULL,
    attendance_date  DATE NOT NULL,
    status           VARCHAR(10) NOT NULL DEFAULT 'PRESENT',
    UNIQUE KEY uq_attendance (student_id, attendance_date),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (trainer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notifications (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    title       VARCHAR(100) NOT NULL,
    message     TEXT NOT NULL,
    is_read     TINYINT(1) NOT NULL DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id      BIGINT,
    user_email   VARCHAR(150),
    action       VARCHAR(50) NOT NULL,
    entity_type  VARCHAR(50) NOT NULL,
    entity_id    BIGINT,
    description  TEXT,
    ip_address   VARCHAR(45),
    logged_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

SET FOREIGN_KEY_CHECKS = 1;
