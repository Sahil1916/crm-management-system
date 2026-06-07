package com.sahilcrm.config;

import com.sahilcrm.entity.Admission;
import com.sahilcrm.entity.Course;
import com.sahilcrm.entity.Lead;
import com.sahilcrm.entity.User;
import com.sahilcrm.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@Profile("dev")
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final LeadRepository leadRepository;
    private final CourseRepository courseRepository;
    private final AdmissionRepository admissionRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) seedUsers();
        if (courseRepository.count() == 0) seedCourses();
        if (leadRepository.count() == 0) seedLeads();
        if (admissionRepository.count() == 0) seedAdmissions();
    }

    private void seedUsers() {
        String adminPass = System.getenv().getOrDefault("SEED_ADMIN_PASSWORD", "");
        String managerPass = System.getenv().getOrDefault("SEED_MANAGER_PASSWORD", "");
        String counselorPass = System.getenv().getOrDefault("SEED_COUNSELOR_PASSWORD", "");

        if (adminPass.isBlank() || managerPass.isBlank() || counselorPass.isBlank()) {
            log.error("Seed passwords not set. Provide SEED_ADMIN_PASSWORD, SEED_MANAGER_PASSWORD, SEED_COUNSELOR_PASSWORD env vars.");
            throw new IllegalStateException("Seed passwords must be set via environment variables.");
        }

        User admin = User.builder()
                .email("admin@sahilcrm.in")
                .password(passwordEncoder.encode(adminPass))
                .name("Super Admin")
                .role(User.Role.ADMIN)
                .active(true)
                .build();

        User manager = User.builder()
                .email("manager@sahilcrm.in")
                .password(passwordEncoder.encode(managerPass))
                .name("Amit Sharma")
                .role(User.Role.MANAGER)
                .active(true)
                .build();

        User counselor = User.builder()
                .email("rahul@sahilcrm.in")
                .password(passwordEncoder.encode(counselorPass))
                .name("Rahul Kumar")
                .role(User.Role.COUNSELOR)
                .active(true)
                .build();

        userRepository.saveAll(List.of(admin, manager, counselor));
        log.info("Demo users seeded (dev profile).");
    }

    private void seedCourses() {
        List<Course> courses = List.of(
                Course.builder().name("Master of Business Administration").code("MBA")
                        .durationMonths(24).fees(850000.0).totalSeats(120).filledSeats(45)
                        .status(Course.Status.ACTIVE)
                        .description("Two-year full-time MBA program.").build(),
                Course.builder().name("Master of Computer Applications").code("MCA")
                        .durationMonths(24).fees(620000.0).totalSeats(60).filledSeats(28)
                        .status(Course.Status.ACTIVE)
                        .description("Two-year postgraduate program in computer applications.").build(),
                Course.builder().name("Bachelor of Business Administration").code("BBA")
                        .durationMonths(36).fees(450000.0).totalSeats(90).filledSeats(52)
                        .status(Course.Status.ACTIVE)
                        .description("Three-year undergraduate business administration program.").build(),
                Course.builder().name("Bachelor of Computer Applications").code("BCA")
                        .durationMonths(36).fees(380000.0).totalSeats(60).filledSeats(19)
                        .status(Course.Status.ACTIVE)
                        .description("Three-year undergraduate program in computer applications.").build()
        );
        courseRepository.saveAll(courses);
        log.info("Demo courses seeded (dev profile).");
    }

    private void seedLeads() {
        User counselor = userRepository.findByEmail("rahul@sahilcrm.in").orElseThrow();
        List<Lead> leads = List.of(
                Lead.builder().firstName("Neha").lastName("Joshi").email("neha.j@gmail.com")
                        .phone("8765432109").countryCode("+91").course("MCA")
                        .source(Lead.Source.GOOGLE).college("St. Xavier's College")
                        .university("Mumbai University").qualification(Lead.Qualification.BACHELORS)
                        .location("Mumbai").stage(Lead.Stage.STAGE2_5).assignedTo(counselor).build(),
                Lead.builder().firstName("Sana").lastName("Shaikh").email("sana.s@gmail.com")
                        .phone("5432109876").countryCode("+91").course("MCA")
                        .source(Lead.Source.META).college("Rizvi College")
                        .university("Mumbai University").qualification(Lead.Qualification.BACHELORS)
                        .location("Mumbai").stage(Lead.Stage.OPEN).assignedTo(counselor).build(),
                Lead.builder().firstName("Karan").lastName("Malhotra").email("karan.m@gmail.com")
                        .phone("9988776655").countryCode("+91").course("MBA")
                        .source(Lead.Source.INSTAGRAM).college("NMIMS")
                        .university("NMIMS University").qualification(Lead.Qualification.BACHELORS)
                        .location("Pune").stage(Lead.Stage.CALLBACK).assignedTo(counselor).build(),
                Lead.builder().firstName("Divya").lastName("Nair").email("divya.n@gmail.com")
                        .phone("8877665544").countryCode("+91").course("BBA")
                        .source(Lead.Source.WALKIN).college("Christ University")
                        .university("Christ University").qualification(Lead.Qualification.HIGH_SCHOOL)
                        .location("Bangalore").stage(Lead.Stage.STAGE2).assignedTo(counselor).build(),
                Lead.builder().firstName("Rohit").lastName("Sen").email("rohit.s@gmail.com")
                        .phone("7766554433").countryCode("+91").course("BCA")
                        .source(Lead.Source.META).college("Symbiosis")
                        .university("Symbiosis International").qualification(Lead.Qualification.HIGH_SCHOOL)
                        .location("Pune").stage(Lead.Stage.CNR).assignedTo(counselor).build()
        );
        leadRepository.saveAll(leads);
        log.info("Demo leads seeded (dev profile).");
    }

    private void seedAdmissions() {
        User counselor = userRepository.findByEmail("rahul@sahilcrm.in").orElseThrow();
        Lead lead = leadRepository.findAll().stream()
                .filter(l -> l.getEmail().equals("neha.j@gmail.com")).findFirst().orElseThrow();
        Course course = courseRepository.findByCode("MCA").orElseThrow();
        Admission admission = Admission.builder()
                .lead(lead).course(course).counselor(counselor)
                .totalFees(course.getFees()).feesPaid(310000.0)
                .paymentStatus(Admission.PaymentStatus.PARTIAL)
                .admissionDate(LocalDateTime.now().minusDays(5))
                .remarks("First installment paid. Second due in 30 days.").build();
        admissionRepository.save(admission);
        log.info("Demo admission seeded (dev profile).");
    }
}
