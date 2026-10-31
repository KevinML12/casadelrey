// Loadtest reads only public JSON endpoints on the named QA service or loopback.
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"sort"
	"strings"
	"sync"
	"time"
)

type result struct {
	status int
	millis float64
	bytes  int
	cache  string
	failed bool
}

func main() {
	base := flag.String("base", "http://127.0.0.1:8091", "QA base URL")
	requests := flag.Int("requests", 6000, "read requests; six per simulated visit")
	concurrency := flag.Int("concurrency", 50, "maximum concurrent readers")
	rps := flag.Int("rps", 25, "paced request rate; no rate limit bypass")
	output := flag.String("output", "", "aggregate report path")
	flag.Parse()
	u, err := url.Parse(*base)
	if err != nil || u.User != nil || u.RawQuery != "" || u.Fragment != "" || !allowed(u.Hostname()) || (*rps < 1 || *rps > 40) || *concurrency < 1 || *concurrency > 100 || *requests < 1 || *requests > 12000 {
		fmt.Fprintln(os.Stderr, "Only loopback/named QA, 1–40 reads/sec, 1–100 workers and up to 12000 reads are allowed")
		os.Exit(2)
	}
	paths := []string{"/api/v1/settings", "/api/v1/site-photos", "/api/v1/events/", "/api/v1/cell-categories", "/api/v1/volunteer-areas", "/api/v1/gallery/?page=1&limit=20"}
	client := &http.Client{Timeout: 65 * time.Second, Transport: &http.Transport{MaxIdleConns: 100, MaxIdleConnsPerHost: 100}}
	warm, err := client.Get(strings.TrimRight(*base, "/") + "/health")
	if err != nil {
		fmt.Fprintln(os.Stderr, "QA health unavailable")
		os.Exit(1)
	}
	io.Copy(io.Discard, warm.Body)
	warm.Body.Close()
	if warm.StatusCode != 200 {
		os.Exit(1)
	}
	jobs := make(chan int, *concurrency)
	results := make(chan result, *requests)
	var wg sync.WaitGroup
	started := time.Now()
	for i := 0; i < *concurrency; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for n := range jobs {
				start := time.Now()
				response, err := client.Get(strings.TrimRight(*base, "/") + paths[n%len(paths)])
				r := result{failed: err != nil}
				if err == nil {
					body, readErr := io.ReadAll(io.LimitReader(response.Body, 2<<20))
					response.Body.Close()
					r.status = response.StatusCode
					r.bytes = len(body)
					r.cache = response.Header.Get("X-Response-Cache")
					r.failed = readErr != nil || r.status != 200 || !json.Valid(body)
				}
				r.millis = float64(time.Since(start).Microseconds()) / 1000
				results <- r
			}
		}()
	}
	ticker := time.NewTicker(time.Second / time.Duration(*rps))
	for n := 0; n < *requests; n++ {
		<-ticker.C
		jobs <- n
	}
	ticker.Stop()
	close(jobs)
	wg.Wait()
	close(results)
	samples := []float64{}
	statuses := map[int]int{}
	failures, hits, transferred := 0, 0, 0
	for row := range results {
		samples = append(samples, row.millis)
		statuses[row.status]++
		if row.failed {
			failures++
		}
		if row.cache == "HIT" {
			hits++
		}
		transferred += row.bytes
	}
	sort.Float64s(samples)
	percentile := func(p float64) float64 { index := int(float64(len(samples)-1) * p); return samples[index] }
	report := map[string]any{"requests": *requests, "equivalent_visits": *requests / len(paths), "max_workers": *concurrency, "paced_rps": *rps, "elapsed_seconds": time.Since(started).Seconds(), "errors": failures, "statuses": statuses, "cache_hits": hits, "p50_ms": percentile(.50), "p95_ms": percentile(.95), "p99_ms": percentile(.99), "max_ms": samples[len(samples)-1], "response_bytes": transferred, "target": u.Hostname(), "verified_at": time.Now().UTC().Format(time.RFC3339)}
	data, _ := json.MarshalIndent(report, "", "  ")
	fmt.Println(string(data))
	if *output != "" {
		if err := os.WriteFile(*output, data, 0600); err != nil {
			os.Exit(1)
		}
	}
	if failures > 0 {
		os.Exit(1)
	}
}
func allowed(host string) bool {
	return host == "127.0.0.1" || host == "localhost" || host == "::1" || host == "casadelrey-api-pruebas.onrender.com"
}
