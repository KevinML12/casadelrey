// prepare-production checks the existing database and private R2 bucket.
// Credentials stay in a mode-0600 local file and are never printed.
package main

import (
	"context"
	"flag"
	"fmt"
	"os"
	"strings"

	"errors"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/smithy-go"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func main() {
	file := flag.String("credentials", "", "Protected six-line runtime credential file")
	private := flag.String("private-bucket", "casadelreyhue-receipts-private", "Private receipt bucket")
	create := flag.Bool("create-private-bucket", false, "Create a missing private bucket")
	flag.Parse()
	if err := run(*file, *private, *create); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func run(file, private string, create bool) error {
	info, err := os.Stat(file)
	if err != nil || info.Mode().Perm()&0077 != 0 {
		return fmt.Errorf("credential file missing or not private")
	}
	data, err := os.ReadFile(file)
	if err != nil {
		return fmt.Errorf("cannot read protected credentials")
	}
	values := strings.Split(strings.TrimSpace(string(data)), "\n")
	if len(values) != 6 {
		return fmt.Errorf("expected six runtime credential fields")
	}
	account, access, secret, public, _, dsn := values[0], values[1], values[2], values[3], values[4], values[5]
	if private == public || private == "" {
		return fmt.Errorf("private bucket must differ from public bucket")
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{Logger: logger.Default.LogMode(logger.Silent)})
	if err != nil {
		return fmt.Errorf("production database connection failed")
	}
	sqlDB, err := db.DB()
	if err != nil {
		return fmt.Errorf("database pool unavailable")
	}
	defer sqlDB.Close()
	sqlDB.SetMaxOpenConns(1)
	var total, legacy int64
	if err := db.Table("payment_receipts").Count(&total).Error; err != nil {
		return fmt.Errorf("receipt inventory failed")
	}
	if err := db.Table("payment_receipts").Where("receipt_image_url NOT LIKE ?", "receipt-private:%").Count(&legacy).Error; err != nil {
		return fmt.Errorf("legacy inventory failed")
	}
	fmt.Printf("Database reachable; receipts=%d legacy_references=%d\n", total, legacy)
	client := s3.NewFromConfig(aws.Config{Region: "auto", Credentials: credentials.NewStaticCredentialsProvider(access, secret, "")}, func(o *s3.Options) {
		o.BaseEndpoint = aws.String("https://" + account + ".r2.cloudflarestorage.com")
		o.UsePathStyle = true
	})
	ctx := context.Background()
	var objects int
	pager := s3.NewListObjectsV2Paginator(client, &s3.ListObjectsV2Input{Bucket: aws.String(public), Prefix: aws.String("comprobantes/")})
	for pager.HasMorePages() {
		page, err := pager.NextPage(ctx)
		if err != nil {
			return fmt.Errorf("public receipt object inventory failed")
		}
		objects += len(page.Contents)
	}
	fmt.Printf("Public receipt objects=%d\n", objects)
	// Object-scoped R2 tokens need not have bucket-administration rights.
	// Check the object API the application actually uses, not HeadBucket.
	_, err = client.ListObjectsV2(ctx, &s3.ListObjectsV2Input{Bucket: aws.String(private), Prefix: aws.String("_readiness/"), MaxKeys: aws.Int32(1)})
	if err != nil {
		var apiErr smithy.APIError
		if !errors.As(err, &apiErr) || (apiErr.ErrorCode() != "NotFound" && apiErr.ErrorCode() != "NoSuchBucket") {
			if apiErr != nil {
				return fmt.Errorf("cannot verify private bucket permissions: %s", apiErr.ErrorCode())
			}
			return fmt.Errorf("cannot verify private bucket permissions")
		}
		if !create {
			fmt.Println("Private bucket absent; no changes made")
			return nil
		}
		if _, err = client.CreateBucket(ctx, &s3.CreateBucketInput{Bucket: aws.String(private)}); err != nil {
			return fmt.Errorf("private bucket creation denied")
		}
		fmt.Println("Created separate private bucket; no public domains configured")
	} else {
		fmt.Println("Private bucket accessible")
	}
	if legacy > 0 || objects > 0 {
		return fmt.Errorf("historical receipt migration required before release")
	}
	return nil
}
