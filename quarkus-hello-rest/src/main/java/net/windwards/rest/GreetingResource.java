package net.windwards.rest;

import org.eclipse.microprofile.config.inject.ConfigProperty;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/")
public class GreetingResource {
    @ConfigProperty(name = "hello_rest.request_delay", defaultValue = "1.0")
    Float requestDelay;

    @Path("health")
    @GET
    public String health() {
        return "ok";
    }

    @GET
    @Produces(MediaType.TEXT_PLAIN)
    public String hello() throws InterruptedException {
        long delay = Float.valueOf(this.requestDelay * 1000).longValue();
        Thread.sleep(delay);
        return "Hello world!";
    }
}
