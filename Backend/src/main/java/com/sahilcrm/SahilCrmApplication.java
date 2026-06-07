package com.sahilcrm;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.sahilcrm")
public class SahilCrmApplication {
    public static void main(String[] args) {
        SpringApplication.run(SahilCrmApplication.class, args);
    }
}

