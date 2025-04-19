package net.windwards.spring.hello_rest.rest;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeResource {
    @Value("${HELLO_REST_REQUEST_DELAY:1.0}")
    private float requestDelay;

    @GetMapping("/health")
    public String health() {
        return "ok";
    }

    @GetMapping("/")
    public String index() throws InterruptedException {
        long delay = Float.valueOf(this.requestDelay * 1000).longValue();
        Thread.sleep(delay);
        return "Hello World!\n";
    }
}
