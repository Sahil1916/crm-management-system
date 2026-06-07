# EduCRM Backend

Spring Boot 3.2 + Spring Security + JWT + MySQL backend for EduCRM.

## Prerequisites

- Java 17+
- Maven 3.9+
- MySQL 8.0+ running on localhost:3306

## Setup

### 1. Update Database Credentials

Edit `src/main/resources/application.properties`:

```properties
spring.datasource.username=your_mysql_username
spring.datasource.password=your_mysql_password
```

### 2. Build & Run

```bash
cd "CRM Projecct/Backend"
mvn clean install
mvn spring-boot:run
```

Server starts on `http://localhost:8080`.

## API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | Login with email + password | Public |
| GET | `/api/auth/health` | Health check | Public |

### Leads
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/leads` | Get all leads | Authenticated |
| GET | `/api/leads/{id}` | Get lead by ID | Authenticated |
| GET | `/api/leads/counselor/{counselorId}` | Get leads by counselor | Authenticated |
| GET | `/api/leads/stage/{stage}` | Get leads by stage (OPEN, CNR, CALLBACK, STAGE2, STAGE2_5, ADMITTED) | Authenticated |
| POST | `/api/leads` | Create new lead | Authenticated |
| PUT | `/api/leads/{id}` | Update lead | Authenticated |
| DELETE | `/api/leads/{id}` | Delete lead | Authenticated |

### Courses
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/courses` | Get all courses | Authenticated |
| GET | `/api/courses/active` | Get active courses | Authenticated |
| GET | `/api/courses/{id}` | Get course by ID | Authenticated |
| POST | `/api/courses` | Create new course | Authenticated |
| PUT | `/api/courses/{id}` | Update course | Authenticated |
| DELETE | `/api/courses/{id}` | Delete course | Authenticated |

### Follow-ups
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/followups` | Get all follow-ups | Authenticated |
| GET | `/api/followups/counselor/{counselorId}` | Get follow-ups by counselor | Authenticated |
| GET | `/api/followups/counselor/{counselorId}/today` | Get today's follow-ups | Authenticated |
| GET | `/api/followups/lead/{leadId}` | Get follow-ups by lead | Authenticated |
| POST | `/api/followups` | Schedule follow-up | Authenticated |
| PUT | `/api/followups/{id}/complete` | Mark follow-up as completed | Authenticated |
| DELETE | `/api/followups/{id}` | Delete follow-up | Authenticated |

## Login Request

```json
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@educrm.in",
  "password": "admin123"
}
```

## Login Response (Success)

```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "role": "ADMIN",
  "user": {
    "id": 1,
    "name": "Super Admin",
    "email": "admin@educrm.in"
  }
}
```

## Demo Users (Auto-seeded)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@educrm.in` | `admin123` |
| Counselor | `rahul@educrm.in` | `rahul123` |

## Demo Data (Auto-seeded)

- **4 Courses**: MBA (120 seats), MCA (60 seats), BBA (90 seats), BCA (60 seats)
- **5 Leads**: Neha Joshi, Sana Shaikh, Karan Malhotra, Divya Nair, Rohit Sen — assigned to Rahul Kumar with various stages

## Project Structure

```
Backend/
├── pom.xml
├── src/main/
│   ├── java/com/educrm/
│   │   ├── EduCrmApplication.java
│   │   ├── auth/
│   │   │   ├── controller/AuthController.java
│   │   │   ├── dto/LoginRequest.java, AuthResponse.java
│   │   │   ├── entity/User.java
│   │   │   ├── repository/UserRepository.java
│   │   │   ├── security/CustomUserDetailsService.java, JwtUtil.java, SecurityConfig.java
│   │   │   └── service/AuthService.java
│   │   ├── config/
│   │   │   ├── CorsConfig.java
│   │   │   └── DataInitializer.java
│   │   ├── lead/
│   │   │   ├── Lead.java, LeadRepository.java, LeadController.java
│   │   ├── course/
│   │   │   ├── Course.java, CourseRepository.java, CourseController.java
│   │   └── followup/
│   │       ├── FollowUp.java, FollowUpRepository.java, FollowUpController.java
│   └── resources/
│       └── application.properties
```

## Connecting Frontend

After login, store the JWT token and include it in all subsequent requests:

```javascript
// Store after login
localStorage.setItem('token', data.token);

// Use in API calls
fetch('http://localhost:8080/api/leads', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'Content-Type': 'application/json'
  }
});
```

## IDE Setup

**Recommended:** Use **IntelliJ IDEA** (Community Edition) for the Backend and **VS Code** for the Frontend.

### Opening in IntelliJ IDEA
1. Open IntelliJ IDEA
2. Click `Open` and select the `Backend` folder
3. IntelliJ will auto-detect the Maven `pom.xml` and download dependencies
4. Right-click `EduCrmApplication.java` → `Run`

### Opening Frontend in VS Code
1. Open VS Code
2. `File` → `Open Folder` → select the `Frontend` folder
3. Install **Live Server** extension
4. Right-click `login.html` → `Open with Live Server`

## Tech Stack

- Spring Boot 3.2.5
- Spring Security 6 (JWT)
- Spring Data JPA
- MySQL 8
- Maven
- Lombok

