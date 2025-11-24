using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using Google.Cloud.Firestore;

namespace AstraTradeAPI.Services
{
    public class FirebaseService
    {
        private static FirestoreDb? _firestoreDb;
        private static readonly object _lock = new object();

        public static FirestoreDb GetFirestoreDb()
        {
            if (_firestoreDb == null)
            {
                lock (_lock)
                {
                    if (_firestoreDb == null)
                    {
                        // Đường dẫn chắc chắn đúng
                        var path = Path.Combine(AppContext.BaseDirectory, "firebase-adminsdk.json");

                        var credential = GoogleCredential.FromFile(path);

                        FirebaseApp.Create(new AppOptions()
                        {
                            Credential = credential
                        });

                        // Lấy Project ID từ file JSON
                        var json = File.ReadAllText(path);
                        var projectId = System.Text.Json.JsonDocument.Parse(json)
                            .RootElement.GetProperty("project_id").GetString();

                        var builder = new FirestoreDbBuilder
                        {
                            ProjectId = projectId,
                            Credential = credential
                        };

                        _firestoreDb = builder.Build();
                    }
                }
            }

            return _firestoreDb;
        }
    }
}
