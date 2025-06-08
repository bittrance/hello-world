package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
)

func main() {
	request_delay_raw := os.Getenv("HELLO_REST_REQUEST_DELAY")
	if request_delay_raw == "" {
		request_delay_raw = "1.0"
	}
	request_delay, err := strconv.ParseFloat(request_delay_raw, 64)
	if err != nil {
		log.Fatalf("Non-numerical request delay: %s\n", request_delay_raw)
	}

	r := gin.Default()
	r.GET("/", func(c *gin.Context) {
		time.Sleep(time.Duration(request_delay * float64(time.Second)))
		c.String(http.StatusOK, "Hello world!")
	})

	r.GET("/health", func(c *gin.Context) {
		c.String(http.StatusOK, "OK")
	})

	server := &http.Server{
		Addr:    ":8080",
		Handler: r,
	}

	shutdownComplete := make(chan struct{})
	go func() {
		quit := make(chan os.Signal, 1)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		<-quit

		grace_period := time.Duration(request_delay * 2.0 * float64(time.Second))
		ctx, cancel := context.WithTimeout(context.Background(), grace_period)
		defer cancel()
		if err := server.Shutdown(ctx); err != nil {
			log.Printf("HTTP server Shutdown: %v", err)
		}
		close(shutdownComplete)
	}()

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("listen: %s\n", err)
	}

	<-shutdownComplete
}
