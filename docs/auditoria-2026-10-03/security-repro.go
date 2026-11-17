package main
import (
 "bytes"; "context"; "encoding/json"; "fmt"; "io"; "mime/multipart"; "net/http"; "net/http/httptest"
 "casadelrey/backend/handlers"; "casadelrey/backend/models"; "casadelrey/backend/storage"
 "github.com/glebarez/sqlite"; "github.com/labstack/echo/v4"; "gorm.io/gorm"; "gorm.io/gorm/logger"
)
type memoryStore struct { mime string; content string }
func(s *memoryStore)Upload(_ context.Context, _, _ string, r io.Reader,_ int64, mime string)(string,error){b,_:=io.ReadAll(r);s.mime=mime;s.content=string(b);return "https://example.invalid/private-test.jpg",nil}
func(s *memoryStore)Delete(_ context.Context,_ string)error{return nil}
func(s *memoryStore)ActiveBackend()storage.Backend{return storage.Backend("audit-memory")}
func main(){
 db,err:=gorm.Open(sqlite.Open(":memory:"),&gorm.Config{Logger:logger.Default.LogMode(logger.Silent)});if err!=nil{panic(err)}
 db.AutoMigrate(&models.Donation{},&models.Event{},&models.EventRegistration{},&models.User{},&models.Post{})
 db.Create(&models.Event{Title:"Isolated audit event",IsActive:true})
 db.Create(&models.EventRegistration{EventID:1,Name:"Local fixture",Email:"victim@example.invalid",AttendeeCount:1})
 e:=echo.New();rsvp:=handlers.NewRSVPHandler(db);e.DELETE("/events/:id/rsvp",rsvp.CancelMyRSVP)
 rec:=httptest.NewRecorder();req:=httptest.NewRequest(http.MethodDelete,"/events/1/rsvp?email=victim@example.invalid",nil);e.ServeHTTP(rec,req)
 fmt.Printf("RSVP cancellation without authentication: HTTP %d %s\n",rec.Code,rec.Body.String())
 var remaining int64;db.Model(&models.EventRegistration{}).Count(&remaining);fmt.Println("RSVP rows remaining:",remaining)
 stmt:=db.Session(&gorm.Session{DryRun:true}).First(&models.Event{},"1=1").Statement;fmt.Println("Unparsed event id SQL:",stmt.SQL.String(),"vars:",stmt.Vars)
 e.POST("/events/:id/rsvp",rsvp.RegisterRSVP)
 for i,id:=range []string{"1=1","1=0"}{body:=fmt.Sprintf(`{"name":"Local audit","email":"audit-%d@example.invalid","attendee_count":1}`,i);req:=httptest.NewRequest(http.MethodPost,"/events/"+id+"/rsvp",bytes.NewBufferString(body));req.Header.Set("Content-Type","application/json");rec:=httptest.NewRecorder();e.ServeHTTP(rec,req);fmt.Printf("Public RSVP injected condition %s: HTTP %d %s\n",id,rec.Code,rec.Body.String())}
 s:=&memoryStore{};up:=handlers.NewUploadHandler(s);e.POST("/receipts/upload",up.UploadReceipt)
 var buf bytes.Buffer;w:=multipart.NewWriter(&buf);f,_:=w.CreateFormFile("file","audit.jpg");f.Write([]byte("AUDIT: plain text, not an image"));w.Close()
 req=httptest.NewRequest(http.MethodPost,"/receipts/upload",&buf);req.Header.Set("Content-Type",w.FormDataContentType());rec=httptest.NewRecorder();e.ServeHTTP(rec,req);fmt.Printf("Invalid image bytes: HTTP %d; stored MIME=%s; bytes=%s\n",rec.Code,s.mime,s.content)
 user:=models.User{Name:"Local author",Email:"private@example.invalid",Phone:"private phone",Address:"private address",Role:"admin",Password:"DO_NOT_SERIALIZE"};db.Create(&user)
 db.Create(&models.Post{Title:"Local post",Slug:"audit",Status:"published",AuthorID:user.ID})
 e.GET("/blog",handlers.NewBlogHandler(db).GetPublishedPosts);rec=httptest.NewRecorder();e.ServeHTTP(rec,httptest.NewRequest(http.MethodGet,"/blog",nil));var payload interface{};json.Unmarshal(rec.Body.Bytes(),&payload);j,_:=json.Marshal(payload);fmt.Printf("Public blog author payload: HTTP %d %s\n",rec.Code,j)
 e.POST("/donations/register",handlers.NewDonationHandler(db).RegisterDonation)
 rec=httptest.NewRecorder();req=httptest.NewRequest(http.MethodPost,"/donations/register",bytes.NewBufferString(`{"name":"Local audit only","amount":999999,"payment_method":"presencial","currency":"USD"}`));req.Header.Set("Content-Type","application/json");e.ServeHTTP(rec,req);var donation models.Donation;db.First(&donation);fmt.Printf("Unverified donation: HTTP %d; successful=%v; currency=%s; amount=%.0f\n",rec.Code,donation.IsSuccessful,donation.Currency,donation.Amount)

}
