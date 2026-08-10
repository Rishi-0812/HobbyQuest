package com.example.hobbyquest_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class HobbyQuestBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(HobbyQuestBackendApplication.class, args);
    }

}