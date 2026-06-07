package com.sahilcrm.service;

import com.sahilcrm.dto.AuthResponse;
import com.sahilcrm.dto.LoginRequest;
import com.sahilcrm.entity.User;
import com.sahilcrm.repository.UserRepository;
import com.sahilcrm.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private JwtUtil jwtUtil;
    @Mock private AuthenticationManager authenticationManager;

    @InjectMocks private AuthService authService;

    private LoginRequest loginRequest;
    private User testUser;

    @BeforeEach
    void setUp() {
        loginRequest = new LoginRequest();
        loginRequest.setEmail("admin@sahilcrm.in");
        loginRequest.setPassword("password123");

        testUser = User.builder()
                .id(1L)
                .email("admin@sahilcrm.in")
                .name("Admin User")
                .password("encodedPassword")
                .role(User.Role.ADMIN)
                .active(true)
                .build();
    }

    @Test
    void login_withValidCredentials_returnsSuccess() {
        when(userRepository.findByEmail("admin@sahilcrm.in")).thenReturn(Optional.of(testUser));
        when(jwtUtil.generateToken("admin@sahilcrm.in", "ADMIN")).thenReturn("mock.jwt.token");

        AuthResponse response = authService.login(loginRequest);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getToken()).isEqualTo("mock.jwt.token");
        assertThat(response.getRole()).isEqualTo("ADMIN");
        assertThat(response.getUser().getEmail()).isEqualTo("admin@sahilcrm.in");
    }

    @Test
    void login_withBadCredentials_returnsFailure() {
        doThrow(new BadCredentialsException("Bad credentials"))
                .when(authenticationManager)
                .authenticate(any(UsernamePasswordAuthenticationToken.class));

        AuthResponse response = authService.login(loginRequest);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).isEqualTo("Invalid email or password");
        assertThat(response.getToken()).isNull();
    }

    @Test
    void login_withDisabledAccount_returnsAccountDisabledMessage() {
        org.springframework.security.authentication.DisabledException disabledException =
                new org.springframework.security.authentication.DisabledException("Disabled");
        doThrow(disabledException).when(authenticationManager)
                .authenticate(any(UsernamePasswordAuthenticationToken.class));

        AuthResponse response = authService.login(loginRequest);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).contains("disabled");
    }
}
