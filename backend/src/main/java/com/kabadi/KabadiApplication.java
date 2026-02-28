package com.kabadi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class KabadiApplication {
    public static void main(String[] args) {
        SpringApplication.run(KabadiApplication.class, args);
    }
}
