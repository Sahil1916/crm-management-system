package com.admitpro;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class AdmitProApplication {
    public static void main(String[] args) {
        SpringApplication.run(AdmitProApplication.class, args);
    }
}
